-- Phase 16: Cooldown, Reset Exploit Prevention, and Referral Bonus points update.

-- 1. Re-create qualify_referral_after_delivery trigger function to award +300 points to referrer instead of +100
create or replace function public.qualify_referral_after_delivery()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_referral public.referrals%rowtype;
begin
  if new.user_id is null or lower(coalesce(new.order_status, '')) not in ('delivered', 'completed')
    or lower(coalesce(old.order_status, '')) in ('delivered', 'completed') then return new; end if;
  select * into v_referral from public.referrals where referred_id = new.user_id and status = 'pending' limit 1 for update;
  if v_referral.id is null then return new; end if;
  update public.referrals set status = 'rewarded' where id = v_referral.id;
  
  -- Referrer gets +300 points
  insert into public.user_rewards (user_id, points) values (v_referral.referrer_id, 300) 
    on conflict (user_id) do update set points = public.user_rewards.points + 300, updated_at = now();
  
  -- Referred user gets +50 points
  insert into public.user_rewards (user_id, points) values (new.user_id, 50) 
    on conflict (user_id) do update set points = public.user_rewards.points + 50, updated_at = now();
    
  insert into public.reward_transactions (user_id, points, reason, order_id) values
    (v_referral.referrer_id, 300, 'Qualified referral reward', new.id),
    (new.user_id, 50, 'Welcome referral reward', new.id);

  -- Insert notification for referrer
  insert into public.notifications (user_id, title, message, type, link)
  values (v_referral.referrer_id, 'Referral rewarded!', 'Your friend has completed their first purchase. You earned 300 loyalty points!', 'referral', '/dashboard/rewards');
  
  return new;
end; $$;

-- 2. Re-create create_store_order function to validate reset exploit prevention with the custom error message.
create or replace function public.create_store_order(
  p_customer_name text,
  p_customer_whatsapp text,
  p_items jsonb,
  p_bundles jsonb,
  p_payment_reference text default null,
  p_coupon_code text default null,
  p_payment_proof_path text default null
) returns text language plpgsql security definer set search_path = public
as $$
declare
  v_total numeric;
  v_bundle_total numeric := 0;
  v_id bigint;
  v_reference text;
  v_first_game bigint;
  v_recent_orders integer;
  v_coupon_id bigint;
  v_coupon_type text;
  v_coupon_value numeric;
  v_coupon_minimum numeric;
  v_coupon_usage_limit integer;
  v_coupon_per_user integer;
  v_coupon_uses integer;
  v_discount numeric := 0;
  v_valid_games integer := 0;
  v_valid_bundles integer := 0;
  v_cart_items jsonb := '[]'::jsonb;
  v_current_points integer := 0;
  v_uses integer := 0;
begin
  if char_length(trim(p_customer_name)) < 2 then raise exception 'Customer name is required'; end if;
  if p_customer_whatsapp !~ '^[0-9]{10,15}$' then raise exception 'Invalid WhatsApp number'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_typeof(p_bundles) <> 'array' then raise exception 'Invalid cart'; end if;
  if jsonb_array_length(p_items) + jsonb_array_length(p_bundles) = 0
    or jsonb_array_length(p_items) + jsonb_array_length(p_bundles) > 20 then raise exception 'Invalid cart'; end if;

  select count(*) into v_recent_orders from public.orders
  where regexp_replace(customer_whatsapp, '[^0-9]', '', 'g') = p_customer_whatsapp
    and created_at > now() - interval '2 minutes';
  if v_recent_orders >= 3 then raise exception 'Too many recent orders. Please wait two minutes.'; end if;

  select coalesce(sum(case item->>'platform'
    when 'Epic' then g.epic_price
    when 'Offline' then g.offline_price
    else g.steam_price end * greatest(1, least(5, coalesce((item->>'quantity')::int, 1)))), 0), min(g.id), count(*)
  into v_total, v_first_game, v_valid_games
  from jsonb_array_elements(p_items) item
  join public.games g on g.id = (item->>'game_id')::bigint
  where coalesce(g.archived, false) = false
    and item->>'platform' = any(coalesce(g.available_platforms, array['Steam','Epic','Offline']));

  select coalesce(sum(b.bundle_price * greatest(1, least(5, coalesce((item->>'quantity')::int, 1)))), 0), count(*)
  into v_bundle_total, v_valid_bundles
  from jsonb_array_elements(p_bundles) item
  join public.bundles b on b.id = (item->>'bundle_id')::bigint
  where b.active = true;

  if v_valid_games <> jsonb_array_length(p_items) or v_valid_bundles <> jsonb_array_length(p_bundles) then
    raise exception 'One or more cart items are unavailable';
  end if;

  v_total := coalesce(v_total, 0) + coalesce(v_bundle_total, 0);
  if v_total <= 0 then raise exception 'Cart pricing could not be verified'; end if;

  if v_first_game is null then
    select min(bg.game_id) into v_first_game
    from jsonb_array_elements(p_bundles) item
    join public.bundle_games bg on bg.bundle_id = (item->>'bundle_id')::bigint;
  end if;

  select coalesce(jsonb_agg(line), '[]'::jsonb) into v_cart_items
  from (
    select jsonb_build_object(
      'type', 'game',
      'game_id', g.id,
      'title', g.title,
      'platform', item->>'platform',
      'quantity', greatest(1, least(5, coalesce((item->>'quantity')::int, 1))),
      'unit_price', case item->>'platform' when 'Epic' then g.epic_price when 'Offline' then g.offline_price else g.steam_price end
    ) as line
    from jsonb_array_elements(p_items) item
    join public.games g on g.id = (item->>'game_id')::bigint
    union all
    select jsonb_build_object(
      'type', 'bundle',
      'bundle_id', b.id,
      'title', b.title,
      'platform', 'Bundle',
      'quantity', greatest(1, least(5, coalesce((item->>'quantity')::int, 1))),
      'unit_price', b.bundle_price
    ) as line
    from jsonb_array_elements(p_bundles) item
    join public.bundles b on b.id = (item->>'bundle_id')::bigint
  ) verified_lines;

  if nullif(trim(p_coupon_code), '') is not null then
    select id, discount_type, discount_value, minimum_order, usage_limit, per_user_limit
    into v_coupon_id, v_coupon_type, v_coupon_value, v_coupon_minimum, v_coupon_usage_limit, v_coupon_per_user
    from public.coupons
    where upper(code) = upper(trim(p_coupon_code)) and active = true
      and (starts_at is null or starts_at <= now()) and (expires_at is null or expires_at > now());
    if v_coupon_id is null then raise exception 'Coupon is not active'; end if;
    if v_total < coalesce(v_coupon_minimum, 0) then raise exception 'Coupon minimum order is not met'; end if;
    select count(*) into v_coupon_uses from public.coupon_usage where coupon_id = v_coupon_id;
    if v_coupon_usage_limit is not null and v_coupon_uses >= v_coupon_usage_limit then raise exception 'Coupon usage limit reached'; end if;
    if auth.uid() is not null and v_coupon_per_user is not null and (select count(*) from public.coupon_usage where coupon_id = v_coupon_id and user_id = auth.uid()) >= v_coupon_per_user then raise exception 'Coupon already used'; end if;
    
    -- Enforce rank check and free checkout rules for loyalty coupon codes and RAKE20
    if upper(trim(p_coupon_code)) in ('RAKE20', 'DIAMONDFREE', 'DIAMOND-FREEBIE', 'PLATINUMFREE', 'PLATINUM-FREEBIE') then
      if auth.uid() is null then
        raise exception 'Sign in to redeem loyalty rewards';
      end if;
      
      select points into v_current_points from public.user_rewards where user_id = auth.uid();
      v_current_points := coalesce(v_current_points, 0);
      
      if v_current_points < 5000 then
        raise exception 'This exclusive code is only available to Diamond or Platinum members. Keep buying games and referring friends to rank up!';
      end if;
      
      if upper(trim(p_coupon_code)) in ('DIAMONDFREE', 'DIAMOND-FREEBIE') then
        if v_current_points < 5000 then
          raise exception 'Points have already been reset. You must rebuild points from scratch to re-unlock eligibility.';
        end if;
        if (select count(*) from public.coupon_usage where user_id = auth.uid() and coupon_id = v_coupon_id) >= 1 then
          raise exception 'Diamond loyalty freebie has already been claimed and locked.';
        end if;
      elsif upper(trim(p_coupon_code)) in ('PLATINUMFREE', 'PLATINUM-FREEBIE') then
        if v_current_points < 10000 then
          raise exception 'Platinum freebie rewards require Platinum rank (10,000 points).';
        end if;
        if (select count(*) from public.coupon_usage where user_id = auth.uid() and coupon_id = v_coupon_id) >= 3 then
          raise exception 'Platinum loyalty freebies have reached the maximum limit of 3 redemptions.';
        end if;
      end if;
    end if;

    v_discount := least(v_total, case when v_coupon_type = 'percentage' then v_total * v_coupon_value / 100 else v_coupon_value end);

    -- Block free game triggers for ranks below Diamond (points < 5000)
    if (v_total - v_discount) = 0 then
      if auth.uid() is null then
        raise exception 'Sign in to redeem free checkout codes.';
      end if;
      select points into v_current_points from public.user_rewards where user_id = auth.uid();
      v_current_points := coalesce(v_current_points, 0);
      if v_current_points < 5000 then
        raise exception 'Free game checkouts are restricted to Diamond and Platinum loyalty ranks.';
      end if;
    end if;
  end if;

  insert into public.orders (game_id, variant_type, customer_name, customer_whatsapp, payment_status, order_status, total_price, cart_items, user_id, payment_reference, screenshot_url)
  values (v_first_game, case when jsonb_array_length(p_items) + jsonb_array_length(p_bundles) > 1 then 'Multi-Game' when jsonb_array_length(p_bundles) = 1 then 'Bundle' else p_items->0->>'platform' end, trim(p_customer_name), p_customer_whatsapp, 'Pending', 'Pending', v_total - v_discount, v_cart_items, auth.uid(), nullif(trim(p_payment_reference), ''), nullif(trim(p_payment_proof_path), ''))
  returning id into v_id;
  v_reference := 'RKX-' || to_char(now(), 'YYMM') || '-' || lpad(v_id::text, 6, '0');
  update public.orders set order_reference = v_reference where id = v_id;
  
  if v_coupon_id is not null and auth.uid() is not null then
    insert into public.coupon_usage (coupon_id, user_id, order_id) values (v_coupon_id, auth.uid(), v_id);
    
    -- Handle point reset burn cycle
    if upper(trim(p_coupon_code)) in ('DIAMONDFREE', 'DIAMOND-FREEBIE') then
      select points into v_current_points from public.user_rewards where user_id = auth.uid();
      update public.user_rewards set points = 0 where user_id = auth.uid();
      insert into public.reward_transactions (user_id, points, reason, order_id)
      values (auth.uid(), -v_current_points, 'Diamond loyalty freebie point reset', v_id);
    elsif upper(trim(p_coupon_code)) in ('PLATINUMFREE', 'PLATINUM-FREEBIE') then
      select count(*) into v_uses from public.coupon_usage where user_id = auth.uid() and coupon_id = v_coupon_id;
      if v_uses >= 3 then
        select points into v_current_points from public.user_rewards where user_id = auth.uid();
        update public.user_rewards set points = 0 where user_id = auth.uid();
        insert into public.reward_transactions (user_id, points, reason, order_id)
        values (auth.uid(), -v_current_points, 'Platinum loyalty 3rd freebie reset', v_id);
      end if;
    end if;
  end if;

  return v_reference;
end; $$;

grant execute on function public.create_store_order(text,text,jsonb,jsonb,text,text,text) to anon, authenticated;

-- 3. Re-create track_store_order function to return customer_rank
drop function if exists public.track_store_order(text,text);
create or replace function public.track_store_order(p_order_reference text, p_phone_suffix text)
returns table(
  order_id bigint, 
  order_ref text, 
  status text, 
  total_price numeric, 
  created_at timestamptz, 
  items jsonb, 
  customer_name text,
  customer_rank text
)
language sql security definer set search_path = public
as $$
  select 
    o.id, 
    coalesce(o.order_reference, 'RKX-' || o.id), 
    coalesce(o.order_status, o.payment_status, 'Pending'), 
    o.total_price, 
    o.created_at, 
    coalesce(o.cart_items, '[]'::jsonb), 
    o.customer_name,
    coalesce(ur.level, 'Bronze')
  from public.orders o
  left join public.user_rewards ur on ur.user_id = o.user_id
  where (o.order_reference = trim(p_order_reference) or o.id::text = regexp_replace(p_order_reference, '[^0-9]', '', 'g'))
    and right(regexp_replace(o.customer_whatsapp, '[^0-9]', '', 'g'), length(regexp_replace(p_phone_suffix, '[^0-9]', '', 'g'))) = regexp_replace(p_phone_suffix, '[^0-9]', '', 'g')
    and length(regexp_replace(p_phone_suffix, '[^0-9]', '', 'g')) >= 10
  limit 1;
$$;

grant execute on function public.track_store_order(text,text) to anon, authenticated;

notify pgrst, 'reload schema';
