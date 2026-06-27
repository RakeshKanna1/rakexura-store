-- Phase 14: Add Preorder and Subscription Columns to Games Table
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS preorder BOOLEAN DEFAULT false;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT false;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
