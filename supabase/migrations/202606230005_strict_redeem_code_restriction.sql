-- Phase 14: Strict redeem code (coupon) creation restrictions.
-- Enforce that only admin roles can perform write operations (INSERT, UPDATE, DELETE) on public.coupons.

alter table public.coupons enable row level security;

drop policy if exists "admin manages coupons" on public.coupons;
create policy "admin manages coupons" on public.coupons 
  for all 
  using (public.is_admin()) 
  with check (public.is_admin());

-- Customers can only read active, non-expired coupons to validate them in the cart.
drop policy if exists "customers select coupons" on public.coupons;
create policy "customers select coupons" on public.coupons
  for select
  using (active = true and (expires_at is null or expires_at > now()));

notify pgrst, 'reload schema';
