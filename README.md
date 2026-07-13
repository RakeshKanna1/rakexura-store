# 🛍️ Rakexura 2026
### 🚀 Production-Oriented Next.js Rebuild of the Rakexura Game Marketplace

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

The retired static HTML frontend has been removed after its assets were verified inside this app.

---

## 🛠️ Tech Stack

* **Core:** Next.js 15 App Router & React 19
* **Styling & Typing:** TypeScript & Tailwind CSS v4
* **Backend Services:** Supabase Auth, PostgreSQL, Storage, Realtime-ready tables, and Row Level Security (RLS)
* **Libraries:** Framer Motion, Lenis, Swiper, Zustand, React Query, Zod, and React Hook Form

---

## 💻 Local Setup

1. Copy `.env.example` to `.env.local`
2. Add the Supabase project URL and publishable/anon key
3. Install dependencies and run:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 💾 Database Cutover

> [!CAUTION]
> **Important Cutover Rule:** Do not run the new migration against production until the new app is ready to replace the static admin.

1. Back up the Supabase database.
2. Run existing Phase 4 and Phase 5 migrations if they have not already been applied.
3. Run the following migrations in order in the **Supabase SQL Editor**:
   * `supabase/migrations/202606210001_ultimate_rebuild.sql`
   * `supabase/migrations/202606220001_phase9_security_and_modules.sql`
   * `supabase/migrations/202606220002_phase10_store_polish.sql`
   * `supabase/migrations/202606220003_phase11_owner_storage_and_profiles.sql` *(Fixes the checkout proof bucket, enables avatars, and activates the verified owner account).*
4. Create or sign in to the owner account through `/register` or `/login`.
5. Configure authentication using the checklists below.

---

## 🔐 Supabase Authentication Checklist

### 🌐 URL Configuration
In **Authentication > URL Configuration**:
* **Site URL:** Set to the deployed Rakexura origin (e.g., `https://rakeon-store.vercel.app`).
* **Redirect URLs:**
  * `http://localhost:3000/auth/callback` (for local development)
  * `https://your-domain.example/auth/callback` (for production/preview origins)

### 📧 Email Provider Setup
In **Authentication > Providers > Email**:
* **Enable Email sign-in.**
* **Confirm email:** Keep enabled for production. Registration will display inbox/spam instruction instead of immediate sign-in. For local testing, this can be disabled.
* **Email Templates:** Use `{{ .ConfirmationURL }}` in confirmation and magic-link email templates. *Do not hardcode a localhost URL in a production template.*
* **SMTP:** Configure custom SMTP before public launch to improve delivery.
* **Capabilities:** The login screen supports password login, resend confirmation, and passwordless magic links. The callback validates and sends admin accounts to `/admin` by default.

---

## 🛡️ Admin & Owner Access

> [!NOTE]
> Passwords remain inside Supabase Auth and must not be stored in source code. There is no shared or hardcoded admin password.

### 1. Promoting an Administrator
1. Register or create the admin user in Supabase Authentication.
2. Run this once in the **Supabase SQL Editor** (replace with your email):
   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'YOUR_ADMIN_EMAIL');
   ```
3. Sign in at `/login` with that account, then open `/admin`.

### 2. Owner Activation
Phase 11 adds a secure **Activate Admin Access** button for the verified owner account. The database RPC checks the authenticated JWT email before changing the role. No service-role key or shared admin password is used by the application.

Keep these values in Vercel and local `.env.local`:
```env
NEXT_PUBLIC_OWNER_EMAIL=12k21rakeshkannam@gmail.com
OWNER_EMAIL=12k21rakeshkannam@gmail.com
```

* **Usage:** Sign in with `12k21rakeshkannam@gmail.com`, open `/admin`, and click **Activate Admin Access** if the migration did not already promote the account.

---

## 🌐 Google and Discord OAuth Setup

The login UI already supports both OAuth providers. To enable them:

1. Open Supabase **Authentication > Providers**.
2. **Google Setup:** Enable and paste the Google OAuth client ID and secret.
3. **Discord Setup:** Enable and paste the Discord application client ID and secret.
4. In both provider consoles, configure the callback URL to the Supabase callback URL.
5. In Supabase **URL Configuration > Redirect URLs**, ensure the production callback is set:
   * `https://rakeon-store.vercel.app/auth/callback`

> [!NOTE]
> The database migration is additive, but it enables RLS and removes the old assumption of unrestricted browser writes. This is the security cutover point.

---

## ☁️ Vercel Deployment

Create a new Vercel project or set the existing project Root Directory to `rakexura-2026` when the repository root is the parent folder.

### 🔑 Environment Variables
* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `NEXT_PUBLIC_SITE_URL=https://your-domain.example`
* `NEXT_PUBLIC_WHATSAPP_NUMBER=918317416695`
* `NEXT_PUBLIC_OWNER_EMAIL`
* `OWNER_EMAIL`
* `NEXT_PUBLIC_OFFER_MARQUEE` *(optional, separate messages with `|`)*

### ⚙️ Build Settings
* **Build Command:** `npm run build`
* **Output Framework:** Next.js (automatic)
* *After deployment, add `https://your-domain.example/auth/callback` to Supabase Auth redirect URLs.*

---

## 🔒 Security Model

* **Public Read:** Catalog and approved reviews are public read-only.
* **Customer Scopes:** Cart, wishlist, orders, notifications, rewards, library, and tickets are scoped to `auth.uid()`.
* **Atomic State:** Cart, bundle cart, and wishlist cloud state is replaced atomically through a validated, authenticated RPC.
* **Claims Validation:** Admin access is a `profiles.role = 'admin'` database claim checked by RLS and server routes.
* **Guest Tracking:** Guest tracking uses a security-definer RPC requiring both order reference and a 10+ digit matching phone value.
* **Checkout Security:** Checkout recalculates prices from the games table instead of trusting browser totals.
* **Media Buckets:** Payment proofs and review media use private Storage buckets with owner/admin policies and short-lived admin links.
* **Artwork Bucket:** Public game artwork uses the `game-images` bucket with admin-only write/delete policies.
* **Activation Rules:** Admin activation is restricted by a database function that verifies the authenticated owner email.

---

## 🏗️ Production Hardening & Stability

A production hardening pass has been performed to enhance security, observability, performance, and developer experience.

### 1. Server-Side Rate Limiting
Lightweight rate limiting has been integrated for key endpoints (using Upstash Redis in production, falling back to an in-memory token bucket locally):
* **Checkout API** (`/api/checkout`): Max 5 requests per 60 seconds per IP.
* **Coupon Validation** (`/api/coupons/validate`): Max 15 requests per 60 seconds per IP.
* **Review notifications** (`/api/notifications/review`): Max 5 requests per 60 seconds per IP.
* **Support / Request notifications** (`/api/notifications/request`): Max 5 requests per 60 seconds per IP.
* **Signup notifications** (`/api/notifications/new-user`): Max 5 requests per 60 seconds per IP.
* **Loyalty Freebie Request** (`/api/rewards/request-freebie`): Max 3 requests per 60 seconds per IP.

### 2. Sentry & Observability
The observability logger (`lib/security/logger.ts`) is integrated with Sentry:
* Context metadata automatically publishes tags for `route`, `request_id`, `order_id`, `operation_name`, and scopes to the authenticated `user_id`.
* Safe redaction is extended to prevent leaks of passwords, API keys, credentials, tokens, PII (name/email/phone), and **payment proofs / screenshots / URL paths**.

### 3. Server-Side Coupon Validation
A new rate-limited server-side coupon validation API (`/api/coupons/validate`) checks all coupon attributes (e.g. minimum order price rules, loyalty points thresholds, global/user usage caps, and milestone eligibility) securely on the backend before checkout.

### 4. Database Scaling
Optimized database indexes on foreign keys have been added (`supabase/migrations/202607130001_additional_scalability_indexes.sql`):
* `customer_library(user_id)`
* `referrals(referrer_id)`
* `coupon_usage(user_id, coupon_id)`
* `reward_transactions(user_id)`
* `support_tickets(user_id)`

### 5. API Response Consistency
All endpoints (checkout, health, status, notifications, rewards) return a unified response format wrapper:
* **Success:** `{ success: true, data: { ... } }`
* **Failure:** `{ success: false, error: { message: "...", code: "..." } }`
* Stack traces are safely withheld from production clients.

### 6. Health & Status
* **Health API** (`/api/health`): Performs a strict database probe query with a 3s timeout and returns explicit `database: "connected" | "disconnected"` statuses.
* **Status API** (`/api/status`): Standardized JSON response tracking active Git hashes and environment regions.

---

## ✅ Verification & Testing

Before deploying, ensure all strict checks pass successfully:

```powershell
npm run typecheck
npm run lint
npm run build
```

*All three commands must pass before deployment.*