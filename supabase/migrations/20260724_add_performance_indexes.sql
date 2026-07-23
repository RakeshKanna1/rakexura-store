-- Database Performance & Speed Indexes for Rakexura Store
-- Eliminates missing index warnings and prevents full table scans

-- 1. Orders Table Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_reference ON orders(order_reference);

-- 2. Order Items Table Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_game_id ON order_items(game_id);

-- 3. Games Catalog Indexes
CREATE INDEX IF NOT EXISTS idx_games_archived ON games(archived);
CREATE INDEX IF NOT EXISTS idx_games_category ON games(category);
CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

-- 4. Reviews & Wishlist Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_game_id ON reviews(game_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_game_id ON wishlist(game_id);

-- 5. Notifications & Cart Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
