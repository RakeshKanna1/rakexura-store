-- Migration 202607030002_subscription_double_points.sql
-- Upgrades the award_delivered_order_points function to check if the order contains a subscription game.
-- If any game in the order is a subscription (is_subscription = true), award 200 points instead of 100 points.

create or replace function public.award_delivered_order_points()
returns trigger language plpgsql security definer set search_path = public
as $$
declare 
  inserted_count integer := 0;
  v_points integer := 100;
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

  -- Check if any game in this order has is_subscription = true
  if exists (
    select 1 
    from jsonb_array_elements(coalesce(new.cart_items, '[]'::jsonb)) line
    join public.games g on g.id = (line->>'game_id')::bigint
    where line->>'type' = 'game' and g.is_subscription = true
  ) then
    v_points := 200;
  else
    v_points := 100;
  end if;

  insert into public.reward_transactions (user_id, points, reason, order_id)
  values (new.user_id, v_points, 'Delivered order', new.id)
  on conflict do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    insert into public.user_rewards (user_id, points)
    values (new.user_id, v_points)
    on conflict (user_id) do update set points = public.user_rewards.points + v_points;
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
