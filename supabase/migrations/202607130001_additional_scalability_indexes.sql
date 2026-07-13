-- Migration: 202607130001_additional_scalability_indexes.sql
-- Add optimized database indexes on frequently queried foreign key relationships.

CREATE INDEX IF NOT EXISTS customer_library_user_id_idx ON public.customer_library(user_id);
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS coupon_usage_user_id_coupon_id_idx ON public.coupon_usage(user_id, coupon_id);
CREATE INDEX IF NOT EXISTS reward_transactions_user_id_idx ON public.reward_transactions(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON public.support_tickets(user_id);
