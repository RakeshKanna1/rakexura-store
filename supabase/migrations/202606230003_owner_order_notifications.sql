-- Notify the Rakexura owner inside the app whenever checkout creates an order reference.

create or replace function public.notify_owner_of_new_order()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_owner uuid;
begin
  if new.order_reference is null or old.order_reference is not null then
    return new;
  end if;

  select id into v_owner
  from public.profiles
  where lower(coalesce(email, '')) = '12k21rakeshkannam@gmail.com'
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
