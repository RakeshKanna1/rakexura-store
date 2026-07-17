-- Migration: 202607180002_summer_sale_campaigns.sql
-- Add support for promotional sale campaigns (e.g. Summer Sale, Winter Sale) and game price overrides.

  
-- 1. Create Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL check (char_length(name) between 3 and 100),
  slug text NOT NULL UNIQUE check (char_length(slug) between 3 and 100),
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  banner_image text,
  theme_color text DEFAULT '#facc15' check (theme_color IS NOT NULL AND char_length(theme_color) between 4 and 7),
  active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  check (starts_at < ends_at)
);

-- 2. Create Campaign Game Overrides Table
CREATE TABLE IF NOT EXISTS public.campaign_games (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campaign_id bigint NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  game_id bigint NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  campaign_price numeric(10,2) NOT NULL check (campaign_price >= 0),
  stock_limit integer check (stock_limit IS NULL OR stock_limit >= 0),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(campaign_id, game_id)
);

-- Index lookup on campaigns and games for high performance
CREATE INDEX IF NOT EXISTS campaign_games_lookup_idx ON public.campaign_games(campaign_id, game_id);
CREATE INDEX IF NOT EXISTS campaigns_active_dates_idx ON public.campaigns(active, starts_at, ends_at);

-- 3. Enable RLS on both tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_games ENABLE ROW LEVEL SECURITY;

-- 4. Set up security policies
-- Public read access for active campaigns
CREATE POLICY "Public read active campaigns" ON public.campaigns
  FOR SELECT USING (active = true OR (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')));

-- Public read access for campaign overrides
CREATE POLICY "Public read campaign overrides" ON public.campaign_games
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_games.campaign_id 
      AND (campaigns.active = true OR (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))
    )
  );

-- Admin full write access
CREATE POLICY "Admin write campaigns" ON public.campaigns
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admin write campaign overrides" ON public.campaign_games
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
