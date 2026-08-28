-- ====================================================================
-- Migration: 202608280001_fix_security_linter_warnings.sql
-- Description: Fix sentinel_vault and subscriptions RLS policies and convert is_admin to security invoker
-- ====================================================================

-- 1. Fix sentinel_vault RLS (Admin / Service Role only)
ALTER TABLE IF EXISTS public.sentinel_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public delete to sentinel_vault" ON public.sentinel_vault;
DROP POLICY IF EXISTS "Allow public insert to sentinel_vault" ON public.sentinel_vault;
DROP POLICY IF EXISTS "Allow public update to sentinel_vault" ON public.sentinel_vault;
DROP POLICY IF EXISTS "Allow public select to sentinel_vault" ON public.sentinel_vault;
DROP POLICY IF EXISTS "Admin only sentinel vault access" ON public.sentinel_vault;

CREATE POLICY "Admin only sentinel vault access" ON public.sentinel_vault 
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Fix subscriptions table RLS
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow public delete subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow public insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow public select subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Public read active subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admin manage subscriptions" ON public.subscriptions;

CREATE POLICY "Public read active subscriptions" ON public.subscriptions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admin manage subscriptions" ON public.subscriptions 
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Fix is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 4. Harden create_store_order search_path
ALTER FUNCTION public.create_store_order(text, text, jsonb, jsonb, text, text, text) 
  SET search_path = public, pg_temp;
