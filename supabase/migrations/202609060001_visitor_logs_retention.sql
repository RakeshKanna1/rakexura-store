-- Migration: 202609060001_visitor_logs_retention.sql
-- Description: Automatically purges visitor logs older than retention_days (default 30 days) to prevent storage bloat.

-- 1. Ensure admins have explicit DELETE permission on visitor_logs table via RLS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'visitor_logs' AND policyname = 'Allow admin delete on visitor_logs'
  ) THEN
    CREATE POLICY "Allow admin delete on visitor_logs" ON public.visitor_logs
      FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- 2. Create high-performance index for filtering old timestamps if not already present
CREATE INDEX IF NOT EXISTS idx_visitor_logs_created_at_asc 
  ON public.visitor_logs (created_at ASC);

-- 3. Create cleanup function with explicit search_path and SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.purge_old_visitor_logs(retention_days integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted_count integer := 0;
BEGIN
  -- Safety guard: minimum retention is 1 day to prevent accidental wiping of all logs
  IF retention_days < 1 THEN
    retention_days := 1;
  END IF;

  WITH deleted AS (
    DELETE FROM public.visitor_logs
    WHERE created_at < NOW() - (retention_days || ' days')::interval
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_count FROM deleted;

  RETURN v_deleted_count;
END;
$$;

-- 4. Grant execute permissions to authenticated and service_role, revoke from public & anon
REVOKE EXECUTE ON FUNCTION public.purge_old_visitor_logs(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_old_visitor_logs(integer) TO authenticated, service_role;

-- 5. If pg_cron extension is available, schedule automatic daily cleanup at 03:00 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('daily_purge_old_visitor_logs');
    PERFORM cron.schedule(
      'daily_purge_old_visitor_logs',
      '0 3 * * *', -- Everyday at 03:00 UTC
      'SELECT public.purge_old_visitor_logs(30);'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Gracefully ignore if pg_cron is not enabled or lacks schema permissions
  NULL;
END $$;
