-- Migration: Fix Sentinel Vault RLS Sync Policy
-- Date: 2026-09-01
-- Description: Allow Gamer Vault desktop app to sync, update, and insert launcher credentials

ALTER TABLE IF EXISTS public.sentinel_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all on sentinel_vault" ON public.sentinel_vault;
DROP POLICY IF EXISTS "Allow public read access to sentinel_vault" ON public.sentinel_vault;
DROP POLICY IF EXISTS "Admin only sentinel vault access" ON public.sentinel_vault;
DROP POLICY IF EXISTS "Allow sentinel_vault sync" ON public.sentinel_vault;

CREATE POLICY "Allow sentinel_vault sync" ON public.sentinel_vault
FOR ALL TO public
USING (true)
WITH CHECK (true);
