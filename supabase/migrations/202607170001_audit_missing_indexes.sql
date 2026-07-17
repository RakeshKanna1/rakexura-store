-- Migration: 202607170001_audit_missing_indexes.sql
-- Add optimized database indexes on frequently queried foreign keys identified during the query audit.

-- Index support ticket conversations for fast loading
CREATE INDEX IF NOT EXISTS support_messages_ticket_id_idx ON public.support_messages(ticket_id);

-- Index reward redemptions by user for rewards history lookup
CREATE INDEX IF NOT EXISTS reward_redemptions_user_id_idx ON public.reward_redemptions(user_id);

-- Index push subscriptions by user for fast notification targeting
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);
