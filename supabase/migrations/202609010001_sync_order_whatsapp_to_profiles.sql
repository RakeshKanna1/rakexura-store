-- Migration: Automatically sync customer WhatsApp number from orders to profiles
-- 1. Backfill existing profiles from latest orders
UPDATE public.profiles p
SET whatsapp = o.customer_whatsapp,
    updated_at = NOW()
FROM (
  SELECT DISTINCT ON (user_id) user_id, customer_whatsapp
  FROM public.orders
  WHERE customer_whatsapp IS NOT NULL AND customer_whatsapp != ''
  ORDER BY user_id, created_at DESC
) o
WHERE p.id = o.user_id
  AND (p.whatsapp IS NULL OR p.whatsapp = '');

-- 2. Trigger function to automatically update profiles.whatsapp on order creation or update
CREATE OR REPLACE FUNCTION public.sync_order_whatsapp_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.customer_whatsapp IS NOT NULL AND NEW.customer_whatsapp != '' THEN
    UPDATE public.profiles
    SET whatsapp = NEW.customer_whatsapp,
        updated_at = NOW()
    WHERE id = NEW.user_id
      AND (whatsapp IS NULL OR whatsapp = '' OR whatsapp != NEW.customer_whatsapp);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_order_whatsapp_to_profile_trigger ON public.orders;
CREATE TRIGGER sync_order_whatsapp_to_profile_trigger
AFTER INSERT OR UPDATE OF customer_whatsapp, user_id ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_order_whatsapp_to_profile();
