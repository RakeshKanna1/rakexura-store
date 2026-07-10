-- Migration: 202607100001_scalability_indexes.sql
-- Add optimized production indexes to enhance query performance.

-- Index games lookups and filters
CREATE INDEX IF NOT EXISTS games_slug_idx ON public.games(slug);
CREATE INDEX IF NOT EXISTS games_archived_idx ON public.games(archived);
CREATE INDEX IF NOT EXISTS games_created_at_idx ON public.games(created_at desc);

-- Index bundles filters
CREATE INDEX IF NOT EXISTS bundles_active_idx ON public.bundles(active);

-- Index reviews approval and sorting
CREATE INDEX IF NOT EXISTS reviews_game_id_idx ON public.reviews(game_id);
CREATE INDEX IF NOT EXISTS reviews_approved_created_at_idx ON public.reviews(approved, created_at desc);

-- Index orders sorting
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at desc);

-- Index profile roles
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- Composite index on user notifications
CREATE INDEX IF NOT EXISTS notifications_user_id_read_idx ON public.notifications(user_id, read);

-- Index recent deliveries and proofs
CREATE INDEX IF NOT EXISTS recent_deliveries_delivered_at_idx ON public.recent_deliveries(delivered_at desc);
CREATE INDEX IF NOT EXISTS customer_proofs_approved_created_at_idx ON public.customer_proofs(approved, created_at desc);
