-- Phase 11: owner access, checkout storage, and customer avatars.
-- Safe to run more than once through the Supabase migration runner.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case
      when new.email_confirmed_at is not null
        and lower(coalesce(new.email, '')) = '12k21rakeshkannam@gmail.com'
      then 'admin'
      else 'customer'
    end
  )
  on conflict (id) do update
  set display_name = coalesce(public.profiles.display_name, excluded.display_name),
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

create or replace function public.activate_rakexura_owner()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt()->>'email', ''));
begin
  if auth.uid() is null or v_email <> '12k21rakeshkannam@gmail.com' then
    raise exception 'This account is not the configured Rakexura owner';
  end if;

  insert into public.profiles (id, display_name, role, updated_at)
  values (auth.uid(), split_part(v_email, '@', 1), 'admin', now())
  on conflict (id) do update
  set role = 'admin', updated_at = now();

  return exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
end;
$$;

revoke all on function public.activate_rakexura_owner() from public;
grant execute on function public.activate_rakexura_owner() to authenticated;

-- Promote the existing verified owner account when this migration is applied.
update public.profiles p
set role = 'admin', updated_at = now()
from auth.users u
where p.id = u.id
  and lower(coalesce(u.email, '')) = '12k21rakeshkannam@gmail.com'
  and u.email_confirmed_at is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "customers upload payment proofs" on storage.objects;
create policy "customers upload payment proofs"
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'payment-proofs');

drop policy if exists "admins read payment proofs" on storage.objects;
create policy "admins read payment proofs"
on storage.objects for select to authenticated
using (bucket_id = 'payment-proofs' and public.is_admin());

drop policy if exists "customers remove failed payment proofs" on storage.objects;
create policy "customers remove failed payment proofs"
on storage.objects for delete to authenticated
using (bucket_id = 'payment-proofs' and owner_id = auth.uid()::text);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read avatars" on storage.objects;
create policy "public read avatars"
on storage.objects for select to public
using (bucket_id = 'avatars');

drop policy if exists "customers upload own avatar" on storage.objects;
create policy "customers upload own avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "customers update own avatar" on storage.objects;
create policy "customers update own avatar"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "customers delete own avatar" on storage.objects;
create policy "customers delete own avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

insert into public.coupons (code, discount_type, discount_value, minimum_order, per_user_limit, active)
values ('RAKE10', 'percentage', 10, 0, 1, true)
on conflict (code) do update
set discount_type = excluded.discount_type,
    discount_value = excluded.discount_value,
    active = true;
