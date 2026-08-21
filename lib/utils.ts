import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function gameUrl(game: { id: number | string; title?: string } | null | undefined): string {
  if (!game) return "/games";
  const idStr = String(game.id);
  if (!game.title) return `/games/${idStr}`;
  const slug = slugify(game.title);
  return slug ? `/games/${slug}-${idStr}` : `/games/${idStr}`;
}

export function parseGameId(idOrSlug: string): number {
  if (!idOrSlug) return 0;
  const match = idOrSlug.match(/-(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  const parsed = parseInt(idOrSlug, 10);
  return isNaN(parsed) ? 0 : parsed;
}


export function assetUrl(value?: string | null) {
  if (!value) return "/Assets/RakeLogo.png";
  if (/^(https?:|data:|\/)/.test(value)) return value;
  return `/${value.replace(/\\/g, "/")}`;
}

export function lowestPrice(game: {
  steam_price?: number | null;
  epic_price?: number | null;
  offline_price?: number | null;
  online_price?: number | null;
  xbox_price?: number | null;
  geforce_price?: number | null;
  price_1m?: number | null;
  price_2m?: number | null;
  price_3m?: number | null;
  price_6m?: number | null;
  price_12m?: number | null;
  sale_price?: number | null;
}) {
  const prices = [
    game.price_1m,
    game.price_2m,
    game.price_3m,
    game.price_6m,
    game.price_12m,
    game.steam_price,
    game.epic_price,
    game.offline_price,
    game.online_price,
    game.xbox_price,
    game.geforce_price,
  ]
    .map(Number)
    .filter((price) => price > 0);
  return prices.length ? Math.min(...prices) : Number(game.sale_price ?? 0);
}

export function isHighEndDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  // Disable heavy animations on all mobile and tablet screen sizes to guarantee 60fps scrolling
  if (window.innerWidth < 1024) return false;

  const cores = navigator.hardwareConcurrency || 4;
  // @ts-expect-error - deviceMemory is a non-standard experimental property on navigator
  const memory = navigator.deviceMemory || 4;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    return cores >= 6; // iPhone 11 Pro/12/13/14/15/etc. are all high-end
  }

  // Android/Chrome: 8+ cores or 6GB+ RAM
  return cores >= 8 || memory >= 6;
}

const ABBREVIATIONS: Record<string, string> = {
  gta: "grand theft auto",
  gta5: "grand theft auto v",
  gtav: "grand theft auto v",
  gta4: "grand theft auto iv",
  gtaiv: "grand theft auto iv",
  rdr: "red dead redemption",
  rdr2: "red dead redemption 2",
  cod: "call of duty",
  ac: "assassins creed",
  nfs: "need for speed",
  gow: "god of war",
  mc: "minecraft",
  pes: "efootball",
  pubg: "playerunknowns battlegrounds",
  cs: "counter strike",
  spiderman: "spider-man",
  tlou: "the last of us",
  dmc: "devil may cry",
  re: "resident evil",
  ff: "final fantasy",
  hl: "half life",
};

export function matchesSearchQuery(
  title: string,
  query: string,
  tagline?: string | null,
  description?: string | null,
  genres?: string[] | null
): boolean {
  const value = query.trim().toLowerCase();
  if (!value) return true;

  const cleanQuery = value.replace(/[^a-z0-9]/g, "");
  if (!cleanQuery) return true;

  const expandedQuery = ABBREVIATIONS[cleanQuery] || value;
  const cleanExpandedQuery = expandedQuery.replace(/[^a-z0-9]/g, "");

  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 1. Direct match on cleaned title (case-insensitive substring)
  if (cleanTitle.includes(cleanQuery) || cleanTitle.includes(cleanExpandedQuery) || title.toLowerCase().includes(value)) {
    return true;
  }

  // 2. Initials matching (e.g. gta -> grand theft auto, rdr -> red dead redemption)
  const matchesInitials = (titleText: string, qText: string) => {
    const words = titleText.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length < 2) return false;
    const initials = words.map((w) => w[0]).join("");
    const initialsNoNumbers = words
      .map((w) => w[0])
      .filter((c) => /[a-z]/i.test(c))
      .join("");
    const cleanQ = qText.replace(/[^a-z0-9]/g, "");
    return initials.startsWith(cleanQ) || initialsNoNumbers.startsWith(cleanQ) || initials.includes(cleanQ);
  };

  if (matchesInitials(title, cleanQuery) || matchesInitials(title, cleanExpandedQuery)) {
    return true;
  }

  // 3. Fallback on standard text matching (for tags, descriptions, tagline, genres)
  const fullText = `${tagline || ""} ${description || ""} ${(genres || []).join(" ")}`.toLowerCase();
  if (fullText.includes(value) || fullText.includes(expandedQuery)) {
    return true;
  }

  return false;
}

export function isDiamondOrPlatinumCoupon(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return (
    normalized.startsWith("DIAM") ||
    normalized.startsWith("PLAT") ||
    normalized.includes("DIAMOND") ||
    normalized.includes("PLATINUM")
  );
}
