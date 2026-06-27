-- Add Sports, Shooter, Survival, Strategy, Adventure to store_categories
INSERT INTO public.store_categories (name, icon_key, sort_order, active) VALUES
  ('Action', 'swords', 10, true),
  ('Open World', 'map', 20, true),
  ('Racing', 'car', 30, true),
  ('RPG', 'wand', 40, true),
  ('Horror', 'ghost', 50, true),
  ('Sports', 'trophy', 60, true),
  ('Fighting', 'crosshair', 70, true),
  ('Simulation', 'bike', 80, true),
  ('Shooter', 'crosshair', 90, true),
  ('Survival', 'ghost', 100, true),
  ('Strategy', 'map', 110, true),
  ('Adventure', 'map', 120, true)
ON CONFLICT (name) DO UPDATE SET 
  active = true,
  icon_key = EXCLUDED.icon_key;
