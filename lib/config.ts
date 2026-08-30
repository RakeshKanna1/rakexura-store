/**
 * Rakexura Store Global Configuration
 * Central source of truth for site constants, owner metadata, and contact handles.
 */

export const SITE_CONFIG = {
  name: "Rakexura",
  tagline: "Premium Digital Game Store",
  currency: "₹",
  ownerEmail: (process.env.OWNER_EMAIL ?? process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "12k21rakeshkannam@gmail.com").trim().toLowerCase(),
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695").trim(),
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://rakexura-store.vercel.app").trim(),
  supportEmail: (process.env.SUPPORT_EMAIL ?? "support@rakexura.com").trim(),
} as const;

export const OWNER_EMAIL = SITE_CONFIG.ownerEmail;
export const WHATSAPP_NUMBER = SITE_CONFIG.whatsappNumber;
