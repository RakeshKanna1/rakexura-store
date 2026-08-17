-- Migration 202608170001_auto_delete_expired_coupons.sql
-- Automatically purges coupons whose expiry date and time have passed.

-- 1. Create a function to purge expired coupons
create or replace function public.purge_expired_coupons()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_count integer := 0;
begin
  -- Remove usage tracking for expired coupons first (preserves referential integrity)
  delete from public.coupon_usage
  where coupon_id in (
    select id from public.coupons where expires_at is not null and expires_at <= now()
  );

  -- Delete expired coupons
  with deleted as (
    delete from public.coupons
    where expires_at is not null and expires_at <= now()
    returning id
  )
  select count(*) into v_count from deleted;

  return v_count;
end;
$$;

-- 2. Ensure foreign key on coupon_usage cascades on delete if not already configured
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'coupon_usage_coupon_id_fkey'
  ) then
    alter table public.coupon_usage
      drop constraint coupon_usage_coupon_id_fkey,
      add constraint coupon_usage_coupon_id_fkey
        foreign key (coupon_id) references public.coupons(id) on delete cascade;
  end if;
exception when others then
  null;
end $$;
