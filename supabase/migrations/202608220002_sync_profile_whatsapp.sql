-- Sync whatsapp column in profiles table from auth.users metadata and past orders
-- 1. Update handle_new_user trigger function to always store whatsapp from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role, email, whatsapp)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    CASE
      WHEN new.email_confirmed_at IS NOT NULL
        AND lower(COALESCE(new.email, '')) = '12k21rakeshkannam@gmail.com'
      THEN 'admin'
      ELSE 'customer'
    END,
    new.email,
    COALESCE(
      NULLIF(TRIM(new.raw_user_meta_data->>'whatsapp'), ''),
      NULLIF(TRIM(new.raw_user_meta_data->>'phone'), ''),
      NULLIF(TRIM(new.phone), '')
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET display_name = COALESCE(public.profiles.display_name, excluded.display_name),
      email = COALESCE(excluded.email, public.profiles.email),
      whatsapp = COALESCE(public.profiles.whatsapp, excluded.whatsapp),
      role = CASE
        WHEN lower(COALESCE(new.email, '')) = '12k21rakeshkannam@gmail.com'
          AND new.email_confirmed_at IS NOT NULL
        THEN 'admin'
        ELSE public.profiles.role
      END,
      updated_at = now();

  INSERT INTO public.user_rewards (user_id) VALUES (new.id) ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;

-- 2. Backfill profiles.whatsapp from auth.users metadata for all existing accounts
UPDATE public.profiles p
SET whatsapp = COALESCE(
  p.whatsapp,
  NULLIF(TRIM(u.raw_user_meta_data->>'whatsapp'), ''),
  NULLIF(TRIM(u.raw_user_meta_data->>'phone'), ''),
  NULLIF(TRIM(u.phone), '')
)
FROM auth.users u
WHERE p.id = u.id AND p.whatsapp IS NULL;

-- 3. Backfill from past orders if profile whatsapp is still missing
UPDATE public.profiles p
SET whatsapp = o.customer_whatsapp
FROM (
  SELECT DISTINCT ON (user_id) user_id, customer_whatsapp
  FROM public.orders
  WHERE user_id IS NOT NULL AND NULLIF(TRIM(customer_whatsapp), '') IS NOT NULL
  ORDER BY user_id, created_at DESC
) o
WHERE p.id = o.user_id AND p.whatsapp IS NULL;
