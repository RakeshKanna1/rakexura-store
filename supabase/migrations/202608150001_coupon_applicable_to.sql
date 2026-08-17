-- Migration: Add applicable_to scope to coupons table
-- Values: 'both' (default: valid on all items), 'subscription' (valid only on subscriptions), 'normal' (valid only on regular games)

alter table public.coupons 
add column if not exists applicable_to text not null default 'both' check (applicable_to in ('both', 'subscription', 'normal'));

comment on column public.coupons.applicable_to is 'Scope of the coupon: both (All items), subscription (Only subscriptions), normal (Only standard games)';
