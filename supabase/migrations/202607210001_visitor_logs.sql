-- Create visitor_logs table for tracking live website visitors and page analytics
CREATE TABLE IF NOT EXISTS public.visitor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    user_email TEXT,
    path TEXT NOT NULL,
    referrer TEXT,
    device_type TEXT DEFAULT 'Desktop',
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anonymous and authenticated) to insert visitor logs
CREATE POLICY "Allow public insert on visitor_logs"
    ON public.visitor_logs FOR INSERT
    WITH CHECK (true);

-- Allow admins to read visitor logs
CREATE POLICY "Allow admin read on visitor_logs"
    ON public.visitor_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create performance indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_visitor_logs_created_at ON public.visitor_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visitor_id ON public.visitor_logs (visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_path ON public.visitor_logs (path);
