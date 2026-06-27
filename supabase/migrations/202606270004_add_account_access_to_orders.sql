-- Phase 14: Add Account Access Column to Orders Table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS account_access text;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
