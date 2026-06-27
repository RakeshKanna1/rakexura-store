-- Add premium_theme column to games table
alter table public.games add column if not exists premium_theme text default 'royal';
