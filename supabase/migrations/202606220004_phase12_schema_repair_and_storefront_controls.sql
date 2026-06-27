-- Phase 12: repair the diagnosed dashboard-created schema without deleting store data.

alter table public.games
  add column if not exists genres text[],
  add column if not exists features text[],
  add column if not exists minimum_requirements text,
  add column if not exists recommended_requirements text,
  add column if not exists activation_instructions text,
  add column if not exists activation_slots integer default 0;

update public.games
set genres = array[genre]
where genres is null and nullif(trim(genre), '') is not null;

insert into public.profiles (id, display_name, role, created_at, updated_at)
select id, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 'admin', now(), now()
from auth.users
where lower(email) = '12k21rakeshkannam@gmail.com'
on conflict (id) do update set role = 'admin', updated_at = now();

insert into public.admin_users (id, email)
select id, email from auth.users where lower(email) = '12k21rakeshkannam@gmail.com'
on conflict (id) do update set email = excluded.email;

insert into public.user_rewards (user_id) values ('6e0e3057-0ca0-4c09-94a9-f3afa18703bb') on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when lower(coalesce(new.email, '')) = '12k21rakeshkannam@gmail.com' then 'admin' else 'customer' end
  )
  on conflict (id) do update
  set display_name = coalesce(public.profiles.display_name, excluded.display_name),
      role = case when lower(coalesce(new.email, '')) = '12k21rakeshkannam@gmail.com' then 'admin' else public.profiles.role end,
      updated_at = now();
  insert into public.user_rewards (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.activate_rakexura_owner()
returns boolean language plpgsql security definer set search_path = public
as $$
declare v_email text := lower(coalesce(auth.jwt()->>'email', ''));
begin
  if auth.uid() is null or v_email <> '12k21rakeshkannam@gmail.com' then
    raise exception 'This account is not the configured Rakexura owner';
  end if;
  insert into public.profiles (id, display_name, role, updated_at)
  values (auth.uid(), split_part(v_email, '@', 1), 'admin', now())
  on conflict (id) do update set role = 'admin', updated_at = now();
  insert into public.admin_users (id, email) values (auth.uid(), v_email)
  on conflict (id) do update set email = excluded.email;
  return exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
end;
$$;

revoke all on function public.activate_rakexura_owner() from public;
grant execute on function public.activate_rakexura_owner() to authenticated;

drop function if exists public.create_store_order(text,text,jsonb,text);
drop function if exists public.create_store_order(text,text,jsonb,text,text,text);
drop function if exists public.create_store_order(text,text,jsonb,jsonb,text,text,text);

create function public.create_store_order(
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
  v_total numeric := 0;
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
  v_quantity integer := 0;
  v_cart_items jsonb := '[]'::jsonb;
begin
  if char_length(trim(p_customer_name)) < 2 then raise exception 'Customer name is required'; end if;
  if p_customer_whatsapp !~ '^[0-9]{10,15}$' then raise exception 'Invalid WhatsApp number'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_typeof(p_bundles) <> 'array' then raise exception 'Invalid cart'; end if;
  if jsonb_array_length(p_items) + jsonb_array_length(p_bundles) = 0 or jsonb_array_length(p_items) + jsonb_array_length(p_bundles) > 20 then raise exception 'Invalid cart'; end if;

  select count(*) into v_recent_orders from public.orders
  where regexp_replace(customer_whatsapp, '[^0-9]', '', 'g') = p_customer_whatsapp
    and created_at > now() - interval '2 minutes';
  if v_recent_orders >= 3 then raise exception 'Too many recent orders. Please wait two minutes.'; end if;

  select coalesce(sum(case item->>'platform' when 'Epic' then g.epic_price when 'Offline' then g.offline_price else g.steam_price end * greatest(1, least(5, coalesce((item->>'quantity')::int, 1)))), 0), min(g.id), count(*), coalesce(sum(greatest(1, least(5, coalesce((item->>'quantity')::int, 1)))), 0)
  into v_total, v_first_game, v_valid_games, v_quantity
  from jsonb_array_elements(p_items) item
  join public.games g on g.id = (item->>'game_id')::bigint
  where coalesce(g.archived, false) = false
    and item->>'platform' = any(coalesce(g.available_platforms, array['Steam','Epic','Offline']));

  select coalesce(sum(b.bundle_price * greatest(1, least(5, coalesce((item->>'quantity')::int, 1)))), 0), count(*), v_quantity + coalesce(sum(greatest(1, least(5, coalesce((item->>'quantity')::int, 1)))), 0)
  into v_bundle_total, v_valid_bundles, v_quantity
  from jsonb_array_elements(p_bundles) item
  join public.bundles b on b.id = (item->>'bundle_id')::bigint
  where b.active = true;

  if v_valid_games <> jsonb_array_length(p_items) or v_valid_bundles <> jsonb_array_length(p_bundles) then raise exception 'One or more cart items are unavailable'; end if;
  v_total := coalesce(v_total, 0) + coalesce(v_bundle_total, 0);
  if v_total <= 0 then raise exception 'Cart pricing could not be verified'; end if;

  if v_first_game is null then
    select min(bg.game_id) into v_first_game from jsonb_array_elements(p_bundles) item join public.bundle_games bg on bg.bundle_id = (item->>'bundle_id')::bigint;
  end if;

  select coalesce(jsonb_agg(line), '[]'::jsonb) into v_cart_items from (
    select jsonb_build_object('type','game','game_id',g.id,'title',g.title,'platform',item->>'platform','quantity',greatest(1,least(5,coalesce((item->>'quantity')::int,1))),'unit_price',case item->>'platform' when 'Epic' then g.epic_price when 'Offline' then g.offline_price else g.steam_price end) line
    from jsonb_array_elements(p_items) item join public.games g on g.id = (item->>'game_id')::bigint
    union all
    select jsonb_build_object('type','bundle','bundle_id',b.id,'title',b.title,'platform','Bundle','quantity',greatest(1,least(5,coalesce((item->>'quantity')::int,1))),'unit_price',b.bundle_price) line
    from jsonb_array_elements(p_bundles) item join public.bundles b on b.id = (item->>'bundle_id')::bigint
  ) verified_lines;

  if nullif(trim(p_coupon_code), '') is not null then
    select id, discount_type, discount_value, minimum_order, usage_limit, per_user_limit
    into v_coupon_id, v_coupon_type, v_coupon_value, v_coupon_minimum, v_coupon_usage_limit, v_coupon_per_user
    from public.coupons where upper(code) = upper(trim(p_coupon_code)) and active = true
      and (starts_at is null or starts_at <= now()) and (expires_at is null or expires_at > now());
    if v_coupon_id is null then raise exception 'Coupon is not active'; end if;
    if upper(trim(p_coupon_code)) = 'RAKE10' and v_quantity < 3 then raise exception 'Add at least 3 games to use RAKE10'; end if;
    if v_total < coalesce(v_coupon_minimum, 0) then raise exception 'Coupon minimum order is not met'; end if;
    select count(*) into v_coupon_uses from public.coupon_usage where coupon_id = v_coupon_id;
    if v_coupon_usage_limit is not null and v_coupon_uses >= v_coupon_usage_limit then raise exception 'Coupon usage limit reached'; end if;
    if auth.uid() is not null and v_coupon_per_user is not null and (select count(*) from public.coupon_usage where coupon_id = v_coupon_id and user_id = auth.uid()) >= v_coupon_per_user then raise exception 'Coupon already used'; end if;
    v_discount := least(v_total, case when v_coupon_type = 'percentage' then v_total * v_coupon_value / 100 else v_coupon_value end);
  end if;

  insert into public.orders (game_id, variant_type, customer_name, customer_whatsapp, payment_status, order_status, total_price, cart_items, user_id, payment_reference, screenshot_url)
  values (v_first_game, case when jsonb_array_length(p_items) + jsonb_array_length(p_bundles) > 1 then 'Multi-Game' when jsonb_array_length(p_bundles) = 1 then 'Bundle' else p_items->0->>'platform' end, trim(p_customer_name), p_customer_whatsapp, 'Pending', 'Pending', v_total - v_discount, v_cart_items, auth.uid(), nullif(trim(p_payment_reference), ''), nullif(trim(p_payment_proof_path), ''))
  returning id into v_id;
  v_reference := 'RKX-' || to_char(now(), 'YYMM') || '-' || lpad(v_id::text, 6, '0');
  update public.orders set order_reference = v_reference where id = v_id;
  if v_coupon_id is not null and auth.uid() is not null then insert into public.coupon_usage (coupon_id, user_id, order_id) values (v_coupon_id, auth.uid(), v_id); end if;
  return v_reference;
end;
$$;

revoke all on function public.create_store_order(text,text,jsonb,jsonb,text,text,text) from public;
grant execute on function public.create_store_order(text,text,jsonb,jsonb,text,text,text) to anon, authenticated;

create table if not exists public.customer_proofs (
  id bigint generated by default as identity primary key,
  image_url text not null,
  caption text,
  proof_type text not null default 'testimonial' check (proof_type in ('whatsapp','payment','testimonial')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.marquee_messages (
  id bigint generated by default as identity primary key,
  message text not null check (char_length(message) between 3 and 160),
  icon_key text not null default 'spark',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.store_categories (
  id bigint generated by default as identity primary key,
  name text not null unique,
  icon_key text not null default 'gamepad',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.customer_proofs enable row level security;
alter table public.marquee_messages enable row level security;
alter table public.store_categories enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "approved proofs public read" on public.customer_proofs;
create policy "approved proofs public read" on public.customer_proofs for select using (approved = true or public.is_admin());
drop policy if exists "proofs admin write" on public.customer_proofs;
create policy "proofs admin write" on public.customer_proofs for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public reads active marquee" on public.marquee_messages;
create policy "public reads active marquee" on public.marquee_messages for select using (active = true or public.is_admin());
drop policy if exists "admins manage marquee" on public.marquee_messages;
create policy "admins manage marquee" on public.marquee_messages for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public reads active categories" on public.store_categories;
create policy "public reads active categories" on public.store_categories for select using (active = true or public.is_admin());
drop policy if exists "admins manage categories" on public.store_categories;
create policy "admins manage categories" on public.store_categories for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins read admin users" on public.admin_users;
create policy "admins read admin users" on public.admin_users for select using (public.is_admin());

create unique index if not exists marquee_messages_message_unique
  on public.marquee_messages (lower(message));

insert into public.marquee_messages (message, icon_key, sort_order) values
  ('New games added weekly', 'gamepad', 10),
  ('Fast assisted delivery', 'zap', 20),
  ('Buy 3+ games and save 10% with RAKE10', 'cart', 30),
  ('Join the Rakexura WhatsApp community', 'message', 40)
on conflict do nothing;

insert into public.store_categories (name, icon_key, sort_order) values
  ('Action','swords',10), ('Open World','map',20), ('Racing','car',30), ('RPG','wand',40),
  ('Horror','ghost',50), ('Sports','trophy',60), ('Fighting','crosshair',70), ('Simulation','bike',80)
on conflict (name) do nothing;

insert into public.coupons (code, discount_type, discount_value, minimum_order, per_user_limit, active)
values ('RAKE10','percentage',10,0,1,true)
on conflict (code) do update set discount_type='percentage', discount_value=10, active=true;

notify pgrst, 'reload schema';
