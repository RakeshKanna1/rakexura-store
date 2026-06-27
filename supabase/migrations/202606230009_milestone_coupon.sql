-- Phase 18: Register RAKETHREE milestone coupon
insert into public.coupons (code, discount_type, discount_value, minimum_order, active)
values ('RAKETHREE', 'percentage', 10, 0, true)
on conflict (code) do nothing;
