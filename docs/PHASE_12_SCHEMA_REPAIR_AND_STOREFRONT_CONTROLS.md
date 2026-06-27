# Rakexura Phase 12: Schema Repair and Storefront Controls

## What the diagnostic confirmed

- The owner exists in Supabase Auth but had no `profiles` row.
- `admin_users` existed but was empty.
- `create_store_order` still used the old four-argument signature.
- The frontend calls the newer seven-argument order function.
- The payment, avatar, game image, and review storage buckets already exist.
- Google OAuth is not enabled in Supabase.
- Storefront announcement and category tables did not exist.

## Apply this repair

Open Supabase **SQL Editor**, paste the complete contents of:

`supabase/migrations/202606220004_phase12_schema_repair_and_storefront_controls.sql`

Run it once. The file is safe to run again if the first attempt is interrupted.

This migration:

- Creates and promotes the owner profile to `admin`.
- Repairs future profile creation.
- Replaces the checkout RPC with the signature used by the application.
- Preserves database-side prices, coupon limits, quantities, bundles, and order security.
- Adds missing game-content fields.
- Adds admin-controlled homepage announcements and categories.
- Adds customer proof storage metadata and appropriate RLS policies.
- Reloads the PostgREST schema cache.

## After running the SQL

1. Refresh Rakexura.
2. Sign out and sign in again if the old customer role is still displayed.
3. Open `/admin`; the owner account should enter without reactivation.
4. Open `/admin/storefront` to manage announcements and categories.
5. Submit a small test checkout. It should return an `RKX-...` order reference.

## Google login

In Supabase go to **Authentication > Providers > Google**, enable Google, and add the Google OAuth client ID and secret. Add these redirect URLs in Google Cloud and Supabase:

- `http://localhost:3000/auth/callback`
- `https://YOUR-DOMAIN/auth/callback`

The Rakexura Google login button is already implemented. Supabase currently rejects it because the provider is disabled.

## Verification completed

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run build` passed with 33 routes.
