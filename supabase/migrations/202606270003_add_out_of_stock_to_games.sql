-- Add out_of_stock column to games table
alter table public.games add column if not exists out_of_stock boolean default false;
