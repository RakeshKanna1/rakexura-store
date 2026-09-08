-- Migration: Fix activation_slots column default
-- If an admin does not specify activation slots, it should be NULL (Available slots) rather than defaulting to 0 (Out of slots).

ALTER TABLE public.games ALTER COLUMN activation_slots DROP DEFAULT;
ALTER TABLE public.games ALTER COLUMN activation_slots SET DEFAULT NULL;

-- Update existing games that were marked with default 0 so they show as available
UPDATE public.games
SET activation_slots = NULL
WHERE activation_slots = 0 AND (out_of_stock IS FALSE OR out_of_stock IS NULL);
