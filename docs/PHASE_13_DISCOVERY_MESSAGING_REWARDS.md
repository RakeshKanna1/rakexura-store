# Phase 13: Discovery, Messaging, and Rewards

## Supabase migration

Run this file in the Supabase SQL Editor:

`supabase/migrations/202606230001_phase13_rewards_and_messaging.sql`

It adds automatic rank calculation and awards 100 points once when an authenticated customer's order first becomes Delivered or Completed.

Ranks:

- Bronze: 0–499 points
- Silver: 500–1,499 points
- Gold: 1,500–2,999 points
- Diamond: 3,000+ points

## Admin tools

- `/admin/messages`: create new-game, offer, and giveaway announcements. In-app messages can be sent to every registered customer. WhatsApp messages open as customer-specific prepared chats.
- `/admin/rewards`: customer leaderboard, rank analysis, and manual reward adjustments.

## WhatsApp limitation

A normal `wa.me` link cannot silently send a message. WhatsApp requires the admin to press Send. Fully automatic delivery/status/promotional messages require:

- Meta WhatsApp Business Cloud API
- A registered business phone number ID
- A permanent access token stored only as a server environment variable
- Approved message templates for messages outside the customer-service window

The application continues creating automatic in-app order notifications even without the WhatsApp API.

## Google and Discord login

The application OAuth flow is implemented. Both providers must also be enabled in Supabase:

1. Supabase Dashboard → Authentication → Providers.
2. Enable Google and enter its client ID and secret.
3. Enable Discord and enter its client ID and secret.
4. Add `https://YOUR-DOMAIN/auth/callback` to the provider redirect configuration.
5. Add the production domain under Supabase Authentication → URL Configuration.

## Public social links

Set these in `.env.local` and in the Vercel project environment variables:

```env
NEXT_PUBLIC_WHATSAPP_CHANNEL_URL=https://whatsapp.com/channel/YOUR_CHANNEL_ID
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/YOUR_USERNAME
```

Redeploy after changing Vercel environment variables.
