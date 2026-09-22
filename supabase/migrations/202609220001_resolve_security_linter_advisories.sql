-- ====================================================================
-- Migration: 202609220001_resolve_security_linter_advisories.sql
-- Description: Resolve Supabase Security Advisories
-- 1. Fix sentinel_vault permissive RLS policy (remove ALL TO public WITH CHECK true)
-- 2. Convert is_admin to SECURITY INVOKER
-- 3. Revoke direct RPC execution from trigger function sync_order_whatsapp_to_profile
-- 4. Revoke public/anon/authenticated execution from sensitive internal functions:
--    - get_admin_user_ids (admin enumeration)
--    - get_order_for_invoice (customer PII leakage)
--    - get_user_push_subscriptions (push notification credentials)
--    - purge_old_visitor_logs (unauthorized log deletion)
-- ====================================================================

-- 1. Fix sentinel_vault RLS policies
ALTER TABLE IF EXISTS public.sentinel_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow sentinel_vault sync" ON public.sentinel_vault;
DROP POLICY IF EXISTS "Allow anon all on sentinel_vault" ON public.sentinel_vault;
DROP POLICY IF EXISTS "Allow public read access to sentinel_vault" ON public.sentinel_vault;
DROP POLICY IF EXISTS "Admin only sentinel vault access" ON public.sentinel_vault;
DROP POLICY IF EXISTS "Allow public read sentinel_vault" ON public.sentinel_vault;
DROP POLICY IF EXISTS "Admin only sentinel vault write" ON public.sentinel_vault;

-- Allow public/client reading of sentinel vault (e.g. desktop/mobile sync)
CREATE POLICY "Allow public read sentinel_vault" ON public.sentinel_vault
  FOR SELECT TO public
  USING (true);

-- Restrict mutations (insert, update, delete) to authenticated administrators
CREATE POLICY "Admin only sentinel vault write" ON public.sentinel_vault 
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Convert is_admin() to SECURITY INVOKER
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

-- 3. Revoke direct RPC execution on internal trigger function sync_order_whatsapp_to_profile
REVOKE EXECUTE ON FUNCTION public.sync_order_whatsapp_to_profile() FROM PUBLIC, anon, authenticated;

-- 4. Protect get_admin_user_ids (used only server-side by notifications route)
REVOKE EXECUTE ON FUNCTION public.get_admin_user_ids() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_ids() TO service_role;

-- 5. Protect get_order_for_invoice (prevents anonymous/authenticated PII scraping)
REVOKE EXECUTE ON FUNCTION public.get_order_for_invoice(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_for_invoice(text) TO service_role;

-- 6. Protect get_user_push_subscriptions (prevents unauthorized push token exfiltration)
REVOKE EXECUTE ON FUNCTION public.get_user_push_subscriptions(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_push_subscriptions(uuid) TO service_role;

-- 7. Protect purge_old_visitor_logs (prevents regular signed-in users from wiping visitor logs)
REVOKE EXECUTE ON FUNCTION public.purge_old_visitor_logs(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_visitor_logs(integer) TO service_role;

-- 8. Harden Storage Bucket Policies
-- Remove overly permissive policies that allowed unrestricted public access/writes
DROP POLICY IF EXISTS "Public Access payment-proofs" ON storage.objects;
DROP POLICY IF EXISTS "Public upload game images" ON storage.objects;

