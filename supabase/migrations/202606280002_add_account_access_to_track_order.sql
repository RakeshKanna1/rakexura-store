-- Phase 15: Add account_access to track_store_order function return
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
  customer_rank text,
  account_access text
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
    coalesce(ur.level, 'Bronze'),
    o.account_access
  from public.orders o
  left join public.user_rewards ur on ur.user_id = o.user_id
  where (o.order_reference = trim(p_order_reference) or o.id::text = regexp_replace(p_order_reference, '[^0-9]', '', 'g'))
    and right(regexp_replace(o.customer_whatsapp, '[^0-9]', '', 'g'), length(regexp_replace(p_phone_suffix, '[^0-9]', '', 'g'))) = regexp_replace(p_phone_suffix, '[^0-9]', '', 'g')
    and length(regexp_replace(p_phone_suffix, '[^0-9]', '', 'g')) >= 10
  limit 1;
$$;

grant execute on function public.track_store_order(text,text) to anon, authenticated;

notify pgrst, 'reload schema';
