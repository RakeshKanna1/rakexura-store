# Rakexura 2026 Phase 11/12 Completion

## Completed

- Secure Gmail-based owner activation without a shared admin password
- Visible admin entry for the owner on desktop and mobile profile
- Idempotent private `payment-proofs` storage setup
- Customer avatar upload, compression, storage, and profile display
- Quantity controls for games and bundles in cart and cart drawer
- Correct quantity-aware totals and cart badges
- Buy Now flow from the game details page
- Three-game coupon eligibility guidance
- Admin bundle builder with included-game selection, preview, price, and live toggle
- Admin release/preorder date control
- Admin customer-proof uploader and moderation actions
- Autoplay customer proof rail on the homepage
- Google and Discord OAuth UI plus deployment configuration guide
- Rakexura violet identity accents with Epic-style neutral surfaces
- Production lint, typecheck, and build verification

## Required Supabase Step

Run this migration in Supabase SQL Editor before testing checkout, avatars, or owner activation:

`supabase/migrations/202606220003_phase11_owner_storage_and_profiles.sql`

Then sign in with the verified owner Gmail and open `/admin`.

## Provider Setup

Google and Discord buttons require their client IDs and secrets in Supabase Authentication > Providers. No provider secrets belong in browser code.

## Verification

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run build`: passed
