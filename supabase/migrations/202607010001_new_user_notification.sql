-- Add notified_owner_signup column to profiles table to prevent duplicate owner notifications
alter table public.profiles add column if not exists notified_owner_signup boolean default false;
