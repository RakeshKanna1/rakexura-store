-- ====================================================================
-- RAKEXURA STORE - SUPABASE DATABASE SECURITY LINTER FIXES
-- Fixes all 22 RLS, Security Definer View, and Sensitive Column errors
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
  -- Games Table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'games' AND policyname = 'Public read active games') THEN
    CREATE POLICY "Public read active games" ON public.games FOR SELECT USING (true);
  END IF;

  -- Bundles Table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bundles' AND policyname = 'Public read active bundles') THEN
    CREATE POLICY "Public read active bundles" ON public.bundles FOR SELECT USING (true);
  END IF;

  -- Bundle Games Table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bundle_games' AND policyname = 'Public read bundle games') THEN
    CREATE POLICY "Public read bundle games" ON public.bundle_games FOR SELECT USING (true);
  END IF;

  -- Game Variants Table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_variants' AND policyname = 'Public read game variants') THEN
    CREATE POLICY "Public read game variants" ON public.game_variants FOR SELECT USING (true);
  END IF;

  -- Recommendations Table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recommendations' AND policyname = 'Public read recommendations') THEN
    CREATE POLICY "Public read recommendations" ON public.recommendations FOR SELECT USING (true);
  END IF;

  -- Coming Soon Table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coming_soon' AND policyname = 'Public read coming soon') THEN
    CREATE POLICY "Public read coming soon" ON public.coming_soon FOR SELECT USING (true);
  END IF;

  -- Preorders Table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'preorders' AND policyname = 'Public read preorders') THEN
    CREATE POLICY "Public read preorders" ON public.preorders FOR SELECT USING (true);
  END IF;

  -- Settings Table (Read public store settings)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Public read store settings') THEN
    CREATE POLICY "Public read store settings" ON public.settings FOR SELECT USING (true);
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 3. CUSTOMER & SENSITIVE DATA RESTRICTIVE POLICIES
-- --------------------------------------------------------------------
DO $$ 
BEGIN
  -- Cart Items: Users manage own cart items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_items' AND policyname = 'Users manage own cart items') THEN
    CREATE POLICY "Users manage own cart items" ON public.cart_items 
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Cart Bundles: Users manage own cart bundles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_bundles' AND policyname = 'Users manage own cart bundles') THEN
    CREATE POLICY "Users manage own cart bundles" ON public.cart_bundles 
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Coupon Usage: Users read own usage, service_role manages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupon_usage' AND policyname = 'Users read own coupon usage') THEN
    CREATE POLICY "Users read own coupon usage" ON public.coupon_usage 
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Customers: Users read/update own profile
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users manage own customer row') THEN
    CREATE POLICY "Users manage own customer row" ON public.customers 
      FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;

  -- Analytics Events: Insert allowed for sessions, read restricted
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'Public insert analytics events') THEN
    CREATE POLICY "Public insert analytics events" ON public.analytics_events 
      FOR INSERT WITH CHECK (true);
  END IF;

  -- Sentinel Vault (Sensitive Password Vault): Strictly Admin & Service Role Only!
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sentinel_vault' AND policyname = 'Admin only sentinel vault access') THEN
    CREATE POLICY "Admin only sentinel vault access" ON public.sentinel_vault 
      FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
        OR auth.role() = 'service_role'
      );
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 4. FIX SECURITY DEFINER VIEW (popular_games)
-- --------------------------------------------------------------------
-- Convert view to security_invoker so it executes with querying user's permissions
ALTER VIEW IF EXISTS public.popular_games SET (security_invoker = true);
