-- Phase 13: customer ranks, delivery rewards, and safe admin announcements.

create unique index if not exists reward_delivery_order_unique
  on public.reward_transactions (order_id)
  where reason = 'Delivered order';

create or replace function public.refresh_reward_level()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.level := case
    when new.points >= 3000 then 'Diamond'
    when new.points >= 1500 then 'Gold'
    when new.points >= 500 then 'Silver'
    else 'Bronze'
  end;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists refresh_reward_level_trigger on public.user_rewards;
create trigger refresh_reward_level_trigger
before insert or update of points on public.user_rewards
for each row execute function public.refresh_reward_level();

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

drop trigger if exists award_delivered_order_points_trigger on public.orders;
create trigger award_delivered_order_points_trigger
after update of order_status on public.orders
for each row execute function public.award_delivered_order_points();

drop policy if exists "admin manages rewards" on public.user_rewards;
create policy "admin manages rewards"
on public.user_rewards for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin manages reward transactions" on public.reward_transactions;
create policy "admin manages reward transactions"
on public.reward_transactions for all
using (public.is_admin())
with check (public.is_admin());

-- Recalculate existing ranks without changing point balances.
update public.user_rewards set points = points;

notify pgrst, 'reload schema';
