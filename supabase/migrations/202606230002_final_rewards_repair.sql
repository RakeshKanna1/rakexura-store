-- Final rewards access repair. Safe to run after every previous Rakexura migration.

alter table public.user_rewards enable row level security;
alter table public.reward_transactions enable row level security;

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

notify pgrst, 'reload schema';
