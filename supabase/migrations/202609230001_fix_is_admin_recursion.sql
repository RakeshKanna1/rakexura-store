-- Fix infinite recursion in is_admin() caused by SECURITY INVOKER with public.profiles RLS.
-- When is_admin() was set to SECURITY INVOKER, querying any table protected by is_admin() (like customer_proofs)
-- or profiles triggered the "profiles read own" policy, which calls is_admin() recursively.
-- This caused PostgreSQL error 54001: "stack depth limit exceeded" and caused customer_proofs to return empty.
-- is_admin() MUST be SECURITY DEFINER (with secure search_path) to bypass RLS when checking role='admin'.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
