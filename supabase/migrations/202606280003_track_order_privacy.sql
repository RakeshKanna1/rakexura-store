-- Phase 16: Track Order Privacy System
-- Drop the existing track_store_order function first
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
  account_access text,
  user_id uuid,
  auth_required boolean
)
language sql security definer set search_path = public
as $$
  select 
    o.id, 
    coalesce(o.order_reference, 'RKX-' || o.id), 
    coalesce(o.order_status, o.payment_status, 'Pending'), 
    case 
      when o.user_id is not null 
        and (auth.uid() is null or (auth.uid() != o.user_id and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')))
      then null 
      else o.total_price 
    end, 
    o.created_at, 
    case 
      when o.user_id is not null 
        and (auth.uid() is null or (auth.uid() != o.user_id and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')))
      then '[]'::jsonb 
      else coalesce(o.cart_items, '[]'::jsonb) 
    end, 
    case 
      when o.user_id is not null 
        and (auth.uid() is null or (auth.uid() != o.user_id and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')))
      then 'Protected Customer' 
      else o.customer_name 
    end,
    case 
      when o.user_id is not null 
        and (auth.uid() is null or (auth.uid() != o.user_id and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')))
      then 'Bronze' 
      else coalesce(ur.level, 'Bronze') 
    end,
    case 
      when o.user_id is not null 
        and (auth.uid() is null or (auth.uid() != o.user_id and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')))
      then null 
      else o.account_access 
    end,
    o.user_id,
    (o.user_id is not null and (auth.uid() is null or (auth.uid() != o.user_id and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')))) as auth_required
  from public.orders o
  left join public.user_rewards ur on ur.user_id = o.user_id
  where (o.order_reference = trim(p_order_reference) or o.id::text = regexp_replace(p_order_reference, '[^0-9]', '', 'g'))
    and right(regexp_replace(o.customer_whatsapp, '[^0-9]', '', 'g'), length(regexp_replace(p_phone_suffix, '[^0-9]', '', 'g'))) = regexp_replace(p_phone_suffix, '[^0-9]', '', 'g')
    and length(regexp_replace(p_phone_suffix, '[^0-9]', '', 'g')) >= 10
  limit 1;
$$;

grant execute on function public.track_store_order(text,text) to anon, authenticated;

notify pgrst, 'reload schema';
