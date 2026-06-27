-- Final checkout notification repair.
-- Fixes live schemas where public.profiles was created without an email column.

alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = lower(u.email)
from auth.users u
where p.id = u.id
  and (p.email is null or p.email = '');

create index if not exists profiles_email_idx
  on public.profiles (lower(email));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    case when lower(coalesce(new.email, '')) = '12k21rakeshkannam@gmail.com' then 'admin' else 'customer' end
  )
  on conflict (id) do update
  set email = coalesce(excluded.email, public.profiles.email),
      display_name = coalesce(public.profiles.display_name, excluded.display_name),
      role = case when lower(coalesce(new.email, '')) = '12k21rakeshkannam@gmail.com' then 'admin' else public.profiles.role end,
      updated_at = now();

  insert into public.user_rewards (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create or replace function public.notify_owner_of_new_order()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_owner uuid;
begin
  if new.order_reference is null or old.order_reference is not null then
    return new;
  end if;

  select u.id into v_owner
  from auth.users u
  where lower(coalesce(u.email, '')) = '12k21rakeshkannam@gmail.com'
  limit 1;

  if v_owner is not null then
    insert into public.notifications (user_id, title, message, type, link)
    values (
      v_owner,
      'New order received',
      coalesce(new.customer_name, 'A customer') || ' created order ' || new.order_reference || ' for Rs. ' || coalesce(new.total_price, 0)::text || '.',
      'order',
      '/admin/orders'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_owner_of_new_order_trigger on public.orders;
create trigger notify_owner_of_new_order_trigger
after update of order_reference on public.orders
for each row execute function public.notify_owner_of_new_order();

notify pgrst, 'reload schema';
