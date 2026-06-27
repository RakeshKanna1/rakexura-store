# RAKEXURA PHASE 10 — PREMIUM CUSTOMER EXPERIENCE + EASY ADMIN + ANIMATED STORE POLISH

## ROLE

You are the Lead Frontend Engineer, Product Designer, Motion Designer, Supabase Engineer, and UX Architect for Rakexura.

The current project is technically strong, but it feels too clean, too technical, and not simple enough for customers and store owner operations.

Your job is to make Rakexura feel like a premium official gaming store while keeping it easy to manage.

Do not remove important existing business logic.

Keep the current Next.js 15 + Supabase structure, but redesign the frontend experience, admin access flow, purchase/payment flow, and customer-facing design.

---

# MAIN GOAL

Transform Rakexura into a premium, animated, dark gaming marketplace inspired by:

- Epic Games Store
- Steam Store
- PCGamesForCheap
- CheapPCGames
- Modern gaming ecommerce stores

Reference competitor site:

https://cheappcgames.shop/

Also use the visual references from the provided screenshots:
- PCGamesForCheap layout
- Epic Games Store layout
- compact game cards
- proof wall
- offer marquee
- dark yellow/neon highlights
- premium sidebar
- simple customer experience

The website must feel official, trusted, animated, responsive, and easy to use.

---

# CURRENT PROBLEMS TO FIX

## 1. Website feels too technical and too clean

The current UI is clean, but it does not feel emotional, gaming-focused, or premium enough.

Fix this by adding:

- darker black Epic-style background
- stronger gaming contrast
- compact game cards
- animated sections
- glowing hover effects
- customer proof wall
- offer marquee
- more ecommerce-style sections
- less SaaS-looking dashboard feel on public pages

---

## 2. Admin login is too difficult

Current admin access depends on email role configuration and keeps showing customer role.

Make admin access easier for the store owner while keeping it secure.

Required:

- Keep Supabase Auth for security.
- Add a simple Admin Setup / Owner Promote screen.
- If logged-in email matches configured owner email from environment variable, automatically promote to admin.
- Add env variable:

```env
NEXT_PUBLIC_OWNER_EMAIL=12k21rakeshkannam@gmail.com
```

- When owner logs in, ensure `public.profiles.role = 'admin'`.
- Add a clear button:

```text
Activate Admin Access
```

- Admin access should not require manually running SQL every time.
- Admin should be discoverable only to admin users.
- Customer users must not see admin links.
- Remove confusing role errors and replace with simple guidance.

Example message:

```text
You are logged in as customer.
If you are the store owner, click Activate Admin Access or contact support.
```

---

## 3. Add premium loading screen

Create a branded loading screen while opening the website.

Requirements:

- Rakexura logo in center
- dark black background
- subtle neon glow
- animated progress ring
- text:

```text
RAKEXURA
Loading premium games...
```

- Should appear on first load and route transitions.
- Must not feel slow.
- Respect reduced motion settings.

---

## 4. Homepage needs offer marquee

Add a moving offer marquee / ticker at the top of homepage.

Example:

```text
🔥 GTA V From ₹130 • 🎮 New Games Added Weekly • ⚡ Instant Delivery After Purchase • 🛒 Buy 3+ Games & Get 10% OFF • Use Code: RAKE10 • 💬 Join WhatsApp Community
```

Requirements:

- Smooth infinite horizontal movement
- Pause on hover
- Admin editable from settings if possible
- Mobile responsive
- Should feel like gaming ecommerce site

---

## 5. Search bar needs dropdown recommendations

Current search is too basic.

Add premium search dropdown.

When user types, show:

- matching games
- price
- platform
- thumbnail
- quick view
- add to cart
- recent searches
- trending searches
- no result state with “Request this game”

Design should feel like Epic/Steam search.

---

## 6. Payment / game purchase flow is not working properly

Audit and fix purchase/payment flow.

Required:

- Add to cart must work for games and bundles
- Cart totals must update correctly
- Coupon should validate correctly
- Checkout should create order correctly
- QR upload/payment proof upload must work
- Order reference should generate correctly
- Tracking should work after checkout
- WhatsApp checkout message should work
- Admin should see payment proof
- Admin can approve/reject/deliver order
- Delivered order should appear in My Games Library

If any Supabase RPC or policy blocks this, fix it with migrations.

---

## 7. Game cards are too large and too clean

Make game cards compact like PCGamesForCheap / Steam shelves.

Desktop card requirements:

- smaller width
- strong cover image
- title
- sale price
- old price
- discount badge
- platform pills
- cart icon button
- wishlist icon
- quick view
- hover glow

Mobile card requirements:

- 2 cards per row where possible
- compact height
- readable price
- sticky add button if needed
- no oversized blank spacing

Use horizontal shelves for:

- Upcoming Games
- Gamer’s Choice
- Deals Under ₹299
- Game Pass / Subscriptions
- Best Sellers
- New Arrivals
- Bundles
- Trending Now

---

## 8. Color theme does not suit

Current blue highlight feels too SaaS-like.

Change to darker Epic-style black with warm neon highlights.

Use:

Background:

```css
#050505
#080a0f
#0d1117
```

Cards:

```css
#11131a
#151922
```

Primary Accent:

```css
#facc15
```

Secondary Accent:

```css
#ffffff
```

Optional Glow:

```css
rgba(250, 204, 21, 0.35)
```

Keep purple only as small Rakexura brand accent if needed.

Avoid too much blue.

---

# DESIGN STYLE TO IMPLEMENT

## Public Store

Style should be:

- dark
- premium
- official
- gaming-heavy
- compact
- animated
- trust-focused

Use inspiration from:

- Epic Games Store sidebar + hero
- PCGamesForCheap yellow gaming highlights
- Steam compact product shelves
- ecommerce product cards

---

# HOMEPAGE REQUIRED SECTIONS

## 1. Offer Marquee

Top scrolling offer bar.

## 2. Search + Quick Actions

Search bar with dropdown suggestions.

Wishlist, cart, tracking.

## 3. Cinematic Hero

Large hero with:

- game artwork
- CTA
- price
- wishlist
- slider arrows
- progress indicator
- right-side newly launched games
- optional video background

## 4. WhatsApp Community Banner

Yellow premium banner:

```text
Join our WhatsApp Community
Get latest deals, game drops & exclusive offers directly on WhatsApp.
```

Button:

```text
Join Community
```

## 5. Upcoming Games / Pre-order

Horizontal compact shelf.

## 6. Gamer’s Choice

Horizontal product carousel.

## 7. Browse by Category

Action, Open World, Racing, RPG, Horror, Sports, Fighting, Simulation.

## 8. Customer Proof Wall

Show WhatsApp screenshots and delivery proofs.

Title:

```text
Trusted by Real Gamers
```

Subtitle:

```text
Real purchase screenshots from customers who bought from Rakexura.
```

## 9. Game Pass / Subscriptions

Separate section for Xbox Game Pass, Ubisoft+, EA Play, etc.

## 10. Deals Under ₹299

Compact shelf.

## 11. FAQ Preview

Compact accordion.

## 12. Footer

Add:

- Logo
- quick links
- support links
- WhatsApp support
- payment methods
- trust badges
- newsletter box

---

# ANIMATION REQUIREMENTS

Use:

- Framer Motion
- GSAP
- Lenis
- SwiperJS

Add:

- loading screen animation
- route transition
- hero image parallax
- card hover glow
- card slide-in
- section reveal
- marquee animation
- search dropdown animation
- cart drawer animation
- modal animation
- checkout step animation
- admin dashboard fade/slide
- proof wall carousel
- counter animations

Do not overdo animation on mobile.

Respect reduced motion.

---

# ADMIN EXPERIENCE

The admin dashboard must be powerful but easy.

## Admin Login

Fix role problem.

Implement:

- Owner email auto admin promotion
- Admin access button
- clear admin status
- no manual SQL required after setup
- admin shortcut only for admins
- friendly access state
- remove confusing customer-role loop

## Admin Dashboard

Keep existing features but simplify UX:

- Overview
- Orders
- Games
- Customers
- Coupons
- Reviews
- Requests
- Support
- Media
- Analytics

## Admin Game Editor

Add:

- direct image upload
- image cropping
- cover preview
- banner preview
- drag/drop upload
- automatic image compression
- category selector
- platform selector
- pricing controls
- offer toggle
- homepage placement controls

## Media Manager

Add:

- upload images
- crop images
- organize by folder
- copy URL
- delete unused files
- preview media

---

# PAYMENT FLOW FIX

Audit all checkout code.

Fix:

- cart item persistence
- bundle cart
- price verification
- coupon validation
- payment proof upload
- order creation
- order reference
- tracking link
- admin proof viewing
- order approval
- delivered library population

Add visible guidance:

```text
Step 1: Scan QR and pay
Step 2: Upload payment screenshot
Step 3: Submit order
Step 4: Track delivery
```

Add WhatsApp fallback button.

---

# CUSTOMER EXPERIENCE IMPROVEMENTS

Make everything simple.

Customers should understand:

- what to buy
- how to pay
- how delivery works
- how to track order
- how to contact support

Add:

- sticky WhatsApp button
- order process cards
- verified seller badge
- delivery guarantee
- safe payment notice
- FAQ shortcuts
- support shortcut

---

# FEATURES TO PRESERVE

Do not remove:

- homepage
- catalog
- product pages
- bundles
- wishlist
- cart
- checkout
- payment proof upload
- order tracking
- reviews
- verified reviews
- customer dashboard
- my games library
- rewards
- referrals
- coupons
- notifications
- support tickets
- game requests
- admin dashboard
- media manager
- analytics
- Supabase RLS
- PWA
- SEO
- Vercel deployment

---

# FEATURES TO ADD OR IMPROVE

Add / improve:

- loading screen
- offer marquee
- compact game cards
- search recommendation dropdown
- customer proof wall
- WhatsApp community banner
- game pass/subscription section
- better footer
- direct image upload and cropping
- easier admin owner access
- payment flow repair
- admin media manager improvements
- automated browser tests
- edge rate limiting
- structured error reporting
- uptime monitoring
- database backup alerts
- transactional email/WhatsApp only after consent and provider credentials

---

# NEXT IMPLEMENTATION SLICES

## Slice 1 — Public Store Visual Redesign

- Darker Epic-style theme
- Yellow/white neon accents
- compact cards
- homepage offer marquee
- proof wall
- WhatsApp community banner
- footer redesign

## Slice 2 — Motion Upgrade

- loading screen
- GSAP hero reveal
- Lenis smooth scroll
- Swiper shelves
- Framer page/card transitions
- hover glow and compact card animations

## Slice 3 — Search Upgrade

- dropdown recommendations
- recent searches
- trending searches
- quick add to cart
- request game if no result

## Slice 4 — Admin Access Simplification

- owner email auto admin promotion
- admin shortcut only for admins
- friendly access state
- remove confusing customer-role loop

## Slice 5 — Payment Flow Repair

- verify cart
- verify checkout
- verify payment proof upload
- verify order creation
- verify tracking
- verify admin approval
- verify My Games population

## Slice 6 — Media Manager

- image upload
- crop
- compress
- preview
- copy URL

## Slice 7 — Testing + Monitoring

- Playwright tests for signup, login, checkout, tracking, admin moderation, mobile navigation
- structured error logs
- uptime monitoring
- backup alert plan

---

# RESPONSIVE REQUIREMENTS

Desktop:

- Epic-style layout
- compact shelves
- sidebar or top navigation
- animated hero
- proof wall

Tablet:

- optimized grid
- swipe shelves

Mobile:

- bottom navigation
- 2-column compact cards where possible
- thumb-friendly buttons
- fast checkout
- reduced animations
- sticky WhatsApp support

---

# PERFORMANCE REQUIREMENTS

Keep:

- Lighthouse 90+
- optimized images
- lazy loading
- route-level code splitting
- compressed assets
- no unnecessary heavy animations
- no layout shift

---

# SECURITY REQUIREMENTS

Do not break RLS.

Keep:

- secure Supabase Auth
- protected admin routes
- private payment proof uploads
- role-based access
- server-side price verification
- safe coupon validation
- no service role key in frontend
- no hardcoded admin password

---

# FINAL EXPECTED RESULT

Rakexura must feel like:

- official game-selling platform
- trusted Indian gaming marketplace
- easy for customers
- easy for owner/admin
- premium animated Epic-style store
- more visually exciting than current version
- simpler than current technical dashboard feel
- better than PCGamesForCheap and CheapPCGames in design, UX, animation, and trust

Make the project easier to use, more animated, more premium, darker, compact, and sales-focused.

Do not only improve code.

Improve the full product experience.
