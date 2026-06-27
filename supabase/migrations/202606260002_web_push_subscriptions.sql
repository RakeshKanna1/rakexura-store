-- Phase 15: Add Web Push Subscriptions table and RLS policies
create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Policies for public/authenticated users
create policy "Allow client insert push_subscriptions" on public.push_subscriptions
  for insert with check (true);

create policy "Allow users select own push_subscriptions" on public.push_subscriptions
  for select using (user_id = auth.uid() or user_id is null);

create policy "Allow users delete own push_subscriptions" on public.push_subscriptions
  for delete using (user_id = auth.uid() or user_id is null);

-- Policies for admin
create policy "Admin reads all push_subscriptions" on public.push_subscriptions
  for select using (public.is_admin());

create policy "Admin deletes all push_subscriptions" on public.push_subscriptions
  for delete using (public.is_admin());

-- Notify PostgREST to reload schema
notify pgrst, 'reload schema';
