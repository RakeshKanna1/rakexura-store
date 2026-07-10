-- Migration: 202607100003_enterprise_extensions.sql
-- Create audit logs table and full text search functions.

-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  affected_entity text NOT NULL,
  entity_id text,
  ip_address text,
  user_agent text,
  details jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies (Only Admins can view/insert audit logs)
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 2. PostgreSQL Full-Text Search Function for Games Catalog Scalability
CREATE OR REPLACE FUNCTION public.search_games(p_query text)
RETURNS SETOF public.games LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.games
  WHERE coalesce(archived, false) = false
    AND (
      to_tsvector('english', coalesce(title, '') || ' ' || coalesce(tagline, '') || ' ' || coalesce(description, ''))
      @@ plainto_tsquery('english', p_query)
    )
  ORDER BY title;
$$;
