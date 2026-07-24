-- Sync email column in profiles table from auth.users
alter table public.profiles add column if not exists email text;

-- Update handle_new_user trigger function to always store email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case
      when new.email_confirmed_at is not null
        and lower(coalesce(new.email, '')) = '12k21rakeshkannam@gmail.com'
      then 'admin'
      else 'customer'
    end,
    new.email
  )
  on conflict (id) do update
  set display_name = coalesce(public.profiles.display_name, excluded.display_name),
      email = coalesce(excluded.email, public.profiles.email),
      role = case
        when lower(coalesce(new.email, '')) = '12k21rakeshkannam@gmail.com'
          and new.email_confirmed_at is not null
        then 'admin'
        else public.profiles.role
      end,
      updated_at = now();

  insert into public.user_rewards (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

-- Secure function to retrieve auth user emails for admin communications
create or replace function public.get_customer_emails()
returns table (id uuid, email text)
language sql
security definer
as $$
  select u.id, u.email::text
  from auth.users u;
$$;

-- Backfill profiles.email from auth.users for existing accounts
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email <> u.email);
