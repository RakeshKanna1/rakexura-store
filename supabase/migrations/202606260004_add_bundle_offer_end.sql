-- Alter bundles table to add created_at and offer_end_date if they do not exist
ALTER TABLE public.bundles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL;
ALTER TABLE public.bundles ADD COLUMN IF NOT EXISTS offer_end_date TIMESTAMP WITH TIME ZONE;
