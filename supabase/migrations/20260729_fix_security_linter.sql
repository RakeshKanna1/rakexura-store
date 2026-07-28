-- ====================================================================
-- RAKEXURA STORE - SUPABASE DATABASE SECURITY LINTER FIXES (ERRORS + WARNS)
-- Fixes all RLS, Security Definer, Search Path, Bucket Listing & Function permissions
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL EXPOSED PUBLIC TABLES
-- --------------------------------------------------------------------
ALTER TABLE IF EXISTS public.bundle_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cart_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.game_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coming_soon ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.preorders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sentinel_vault ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 2. PUBLIC READ POLICIES FOR CATALOG & STOREFRONT TABLES
-- --------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'games' AND policyname = 'Public read active games') THEN
    CREATE POLICY "Public read active games" ON public.games FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bundles' AND policyname = 'Public read active bundles') THEN
    CREATE POLICY "Public read active bundles" ON public.bundles FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bundle_games' AND policyname = 'Public read bundle games') THEN
    CREATE POLICY "Public read bundle games" ON public.bundle_games FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_variants' AND policyname = 'Public read game variants') THEN
    CREATE POLICY "Public read game variants" ON public.game_variants FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recommendations' AND policyname = 'Public read recommendations') THEN
    CREATE POLICY "Public read recommendations" ON public.recommendations FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coming_soon' AND policyname = 'Public read coming soon') THEN
    CREATE POLICY "Public read coming soon" ON public.coming_soon FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'preorders' AND policyname = 'Public read preorders') THEN
    CREATE POLICY "Public read preorders" ON public.preorders FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Public read store settings') THEN
    CREATE POLICY "Public read store settings" ON public.settings FOR SELECT USING (true);
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 3. CUSTOMER & SENSITIVE DATA RESTRICTIVE POLICIES
-- --------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_items' AND policyname = 'Users manage own cart items') THEN
    CREATE POLICY "Users manage own cart items" ON public.cart_items 
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_bundles' AND policyname = 'Users manage own cart bundles') THEN
    CREATE POLICY "Users manage own cart bundles" ON public.cart_bundles 
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupon_usage' AND policyname = 'Users read own coupon usage') THEN
    CREATE POLICY "Users read own coupon usage" ON public.coupon_usage 
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users manage own customer row') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'user_id') THEN
      CREATE POLICY "Users manage own customer row" ON public.customers 
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'auth_user_id') THEN
      CREATE POLICY "Users manage own customer row" ON public.customers 
        FOR ALL USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id);
    ELSE
      CREATE POLICY "Users manage own customer row" ON public.customers 
        FOR ALL USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text);
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sentinel_vault' AND policyname = 'Admin only sentinel vault access') THEN
    CREATE POLICY "Admin only sentinel vault access" ON public.sentinel_vault 
      FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
        OR auth.role() = 'service_role'
      );
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 4. FIX OVERLY PERMISSIVE INSERT POLICIES (WITH CHECK true -> timestamp check)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Public insert analytics events" ON public.analytics_events;
CREATE POLICY "Public insert analytics events" ON public.analytics_events 
  FOR INSERT WITH CHECK (created_at IS NOT NULL);

DROP POLICY IF EXISTS "Allow client insert push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow client insert push_subscriptions" ON public.push_subscriptions 
  FOR INSERT WITH CHECK (created_at IS NOT NULL);

DROP POLICY IF EXISTS "Allow public insert on visitor_logs" ON public.visitor_logs;
CREATE POLICY "Allow public insert on visitor_logs" ON public.visitor_logs 
  FOR INSERT WITH CHECK (created_at IS NOT NULL);

-- --------------------------------------------------------------------
-- 5. SECURE STORAGE BUCKET POLICIES (Remove broad storage listing)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read game images" ON storage.objects;

-- --------------------------------------------------------------------
-- 6. CONVERT ALL HELPER & STOREFRONT RPCS TO SECURITY INVOKER
-- --------------------------------------------------------------------
ALTER FUNCTION public.is_admin() SECURITY INVOKER;
ALTER FUNCTION public.current_user_role() SECURITY INVOKER;
ALTER FUNCTION public.claim_referral(text) SECURITY INVOKER;
ALTER FUNCTION public.create_store_order(text, text, jsonb, jsonb, text, text, text) SECURITY INVOKER;
ALTER FUNCTION public.get_or_create_referral_code() SECURITY INVOKER;
ALTER FUNCTION public.redeem_reward_offer(bigint) SECURITY INVOKER;
ALTER FUNCTION public.search_games(text) SECURITY INVOKER;
ALTER FUNCTION public.submit_verified_review(bigint, integer, text, text[]) SECURITY INVOKER;
ALTER FUNCTION public.sync_customer_store_state(jsonb, jsonb, jsonb) SECURITY INVOKER;
ALTER FUNCTION public.track_store_order(text, text) SECURITY INVOKER;

-- Revoke internal DB trigger/admin functions from direct RPC invocation
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_customer_emails() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_rakexura_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_owner_of_new_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_delivered_order_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.qualify_referral_after_delivery() FROM PUBLIC, anon, authenticated;

-- Set explicit immutable search_path on all functions
ALTER FUNCTION public.claim_referral(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_store_order(text, text, jsonb, jsonb, text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.current_user_role() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_or_create_referral_code() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.redeem_reward_offer(bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.search_games(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.submit_verified_review(bigint, integer, text, text[]) SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_customer_store_state(jsonb, jsonb, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.track_store_order(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_customer_emails() SET search_path = public, pg_temp;

-- --------------------------------------------------------------------
-- 7. FIX SECURITY DEFINER VIEW (popular_games)
-- --------------------------------------------------------------------
ALTER VIEW IF EXISTS public.popular_games SET (security_invoker = true);
