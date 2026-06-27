-- Upgrade trigger to exempt gifted orders from points and format library entry as gifted

create or replace function public.award_delivered_order_points()
returns trigger language plpgsql security definer set search_path = public
as $$
declare inserted_count integer := 0;
begin
  if new.user_id is null
    or lower(coalesce(new.order_status, '')) not in ('delivered', 'completed')
    or lower(coalesce(old.order_status, '')) in ('delivered', 'completed') then
    return new;
  end if;

  -- Skip giving points for gifted or giveaway orders
  if new.payment_reference = 'GIFTED' or new.payment_reference = 'GIVEAWAY' then
    return new;
  end if;

  insert into public.reward_transactions (user_id, points, reason, order_id)
  values (new.user_id, 100, 'Delivered order', new.id)
  on conflict do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    insert into public.user_rewards (user_id, points)
    values (new.user_id, 100)
    on conflict (user_id) do update set points = public.user_rewards.points + 100;
  end if;
  return new;
end;
$$;

create or replace function public.handle_order_status_change()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_titles text;
begin
  if new.order_status is not distinct from old.order_status then return new; end if;

  if new.user_id is not null then
    insert into public.notifications (user_id, title, message, type, link)
    values (
      new.user_id,
      case when new.payment_reference = 'GIFTED' or new.payment_reference = 'GIVEAWAY' then 'Gift Received!' else 'Order ' || coalesce(new.order_reference, '#' || new.id) end,
      case when new.payment_reference = 'GIFTED' or new.payment_reference = 'GIVEAWAY' then 'You have received a game giveaway gift from the owner!' else 'Your order status is now ' || coalesce(new.order_status, 'updated') || '.' end,
      'order',
      '/dashboard/orders'
    );
  end if;

  if lower(coalesce(new.order_status, '')) in ('delivered', 'completed')
    and lower(coalesce(old.order_status, '')) not in ('delivered', 'completed') then
    if new.user_id is not null then
      insert into public.customer_library (user_id, game_id, order_id, platform, activation_guide, delivery_notes)
      select 
        new.user_id, 
        (line->>'game_id')::bigint, 
        new.id, 
        case when new.payment_reference = 'GIFTED' or new.payment_reference = 'GIVEAWAY' then 'Gifted' else coalesce(line->>'platform', 'Steam') end, 
        g.activation_instructions, 
        case when new.payment_reference = 'GIFTED' or new.payment_reference = 'GIVEAWAY' then 'Gifted by owner · Platform: ' || coalesce(line->>'platform', 'Steam') else 'Delivered through Rakexura order ' || coalesce(new.order_reference, '#' || new.id) end
      from jsonb_array_elements(coalesce(new.cart_items, '[]'::jsonb)) line
      join public.games g on g.id = (line->>'game_id')::bigint
      where line->>'type' = 'game'
      on conflict (user_id, game_id, platform) do nothing;

      insert into public.customer_library (user_id, game_id, order_id, platform, activation_guide, delivery_notes)
      select 
        new.user_id, 
        bg.game_id, 
        new.id, 
        case when new.payment_reference = 'GIFTED' or new.payment_reference = 'GIVEAWAY' then 'Gifted' else 'Bundle' end, 
        g.activation_instructions, 
        case when new.payment_reference = 'GIFTED' or new.payment_reference = 'GIVEAWAY' then 'Gifted by owner · Bundle content' else 'Delivered in bundle order ' || coalesce(new.order_reference, '#' || new.id) end
      from jsonb_array_elements(coalesce(new.cart_items, '[]'::jsonb)) line
      join public.bundle_games bg on bg.bundle_id = (line->>'bundle_id')::bigint
      join public.games g on g.id = bg.game_id
      where line->>'type' = 'bundle'
      on conflict (user_id, game_id, platform) do nothing;
    end if;

    select string_agg(line->>'title', ', ') into v_titles
    from jsonb_array_elements(coalesce(new.cart_items, '[]'::jsonb)) line;
    
    if coalesce(new.payment_reference, '') not in ('GIFTED', 'GIVEAWAY') then
      insert into public.recent_deliveries (order_id, game_title, public_label)
      values (new.id, coalesce(v_titles, 'Game order'), left(coalesce(new.customer_name, 'Customer'), 1) || '***')
      on conflict (order_id) do nothing;
    end if;
  end if;

  return new;
end; $$;

-- Allow admins to insert orders directly for gifted giveaways
drop policy if exists "admin inserts orders" on public.orders;
create policy "admin inserts orders" on public.orders for insert with check (public.is_admin());

-- Add xbox_price, geforce_price, and duration columns to games table
alter table public.games add column if not exists xbox_price numeric;
alter table public.games add column if not exists geforce_price numeric;
alter table public.games add column if not exists duration text;

-- Add online_price and online_activation columns to games table
alter table public.games add column if not exists online_price numeric;
alter table public.games add column if not exists online_activation boolean default false;























