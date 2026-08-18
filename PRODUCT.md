# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are PC gamers in India seeking authentic PC game titles (Steam, Epic Games, Rockstar, Ubisoft, EA) with affordable INR pricing, instant automated digital delivery, and accessible Indian payment options (UPI, QR, Cards, Netbanking). Secondary users include gamers requesting specific titles not yet listed and seeking WhatsApp-assisted customer support.

## Product Purpose

Rakexura Store is a high-performance, premium digital PC gaming marketplace. It provides gamers with a fast, secure, and visually immersive experience to discover, purchase, track, and activate digital PC games, curated bundles, subscriptions, and flash deals with instant order fulfillment and automated delivery verification.

## Positioning

A curated, high-trust, gamer-first PC game marketplace offering authentic digital delivery with verified order tracking, transparent INR pricing, curated limited-time flash deals, customer loyalty rewards points, and responsive WhatsApp support.

## Operating Context

- Responsive Web application tailored for desktop, tablet, and mobile browsers.
- Real-time order tracking with unique `RKX-YYYY-XXXX` references and automated receipt dispatch.
- Authentication powered by Supabase SSR with Google OAuth, Discord OAuth, 6-digit email OTP codes, and password login.
- Real-time storefront synchronization via Supabase channels (flash sales countdowns, live delivery ticker).
- Store management through a protected administrator dashboard (`/admin`) and user library/orders hub (`/dashboard`).

## Capabilities and Constraints

- **Catalog & Discovery:** Dynamic game catalog with search, platform tags (Steam, Epic, Rockstar), genre filters, bundles, and limited-time flash sales.
- **Cart & Checkout:** Persistent multi-item cart, bundle cart, coupon discounts (`RAKE10`), and multi-gateway checkout.
- **Delivery & Tracking:** Live order status pipeline with automatic delivery notifications, invoice generation, and tracking lookup (`/track`).
- **Communication & Email:** Transnational email pipeline via Resend & Nodemailer with responsive Epic Games/Apple-styled templates (receipts, OTP codes, review requests, store deals, admin alerts).
- **Customer Support & Community:** WhatsApp chat assistance, game request submission system, and verified customer review wall with loyalty point bonuses.

## Brand Commitments

- **Brand Name:** Rakexura Store
- **Visual Identity:** Cinematic gaming aesthetic with deep obsidian backgrounds (`#050505`, `#08090c`), luminous gold accents (`#facc15`), vibrant purple highlights (`#8b5cf6`), and crisp emerald success signals (`#00d68f`).
- **Typography:** Modern clean sans-serif (Geist / Inter) with monospace accent fonts for codes, keys, and invoice IDs.
- **Voice & Tone:** Confident, energetic, trustworthy, and gamer-centric.

## Evidence on Hand

- Production Next.js 15 App Router storefront with TypeScript, Tailwind CSS, Supabase Auth, and PostgreSQL backend.
- High-resolution game cover and hero spotlight assets in `public/Assets/` and Supabase Storage.
- Active customer review system with 5-star ratings and loyalty rewards integration.

## Product Principles

1. **Instant Clarity & Trust:** Deliver unambiguous pricing in INR, clear platform badges, and verified order tracking.
2. **Speed & Smoothness:** 60/120fps hardware-accelerated interactions, frictionless 1-tap checkout, and fast sub-100ms page transitions.
3. **Cinematic Game-First Craft:** Let the game artwork and limited-time deals shine with dark obsidian surfaces and gold neon accents.
4. **Reliable Frictionless Support:** Provide instant verification via 6-digit OTP codes and accessible WhatsApp order assistance.

## Accessibility & Inclusion

- WCAG AA contrast on text, buttons, and status indicators.
- Responsive mobile touch targets (minimum 44px) with momentum touch scrolling.
- Reduced motion support (`prefers-reduced-motion`) across Framer Motion animations.
- Screen-reader accessible form labels, aria attributes, and keyboard-navigable dialogs.
