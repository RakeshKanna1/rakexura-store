-- Database Performance & Speed Indexes for Rakexura Store
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query

-- 1. Orders Table Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_reference ON orders(order_reference);

-- 2. Games Catalog Indexes
CREATE INDEX IF NOT EXISTS idx_games_archived ON games(archived);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

-- 3. Reviews & Wishlist Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_game_id ON reviews(game_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_game_id ON wishlist(game_id);

-- 4. Notifications & Cart Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
