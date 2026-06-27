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

export function assetUrl(value?: string | null) {
  if (!value) return "/Assets/RakeLogo.png";
  if (/^(https?:|data:|\/)/.test(value)) return value;
  return `/${value.replace(/\\/g, "/")}`;
}

export function lowestPrice(game: { steam_price?: number | null; epic_price?: number | null; offline_price?: number | null; xbox_price?: number | null; geforce_price?: number | null; sale_price?: number | null }) {
  const prices = [game.steam_price, game.epic_price, game.offline_price, game.xbox_price, game.geforce_price]
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
  if (value.length < 2) return false;

  const cleanQuery = value.replace(/[^a-z0-9]/g, "");
  const expandedQuery = ABBREVIATIONS[cleanQuery] || value;
  const cleanExpandedQuery = expandedQuery.replace(/[^a-z0-9]/g, "");

  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 1. Direct match on cleaned title (case-insensitive substring)
  if (cleanTitle.includes(cleanQuery) || cleanTitle.includes(cleanExpandedQuery)) {
    return true;
  }

  // 2. Initials matching (e.g. gta -> grand theft auto)
  const matchesInitials = (titleText: string, qText: string) => {
    const words = titleText.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length < 2) return false;
    const initials = words.map((w) => w[0]).join("");
    const initialsNoNumbers = words
      .map((w) => w[0])
      .filter((c) => /[a-z]/i.test(c))
      .join("");
    const cleanQ = qText.replace(/[^a-z0-9]/g, "");
    return initials.startsWith(cleanQ) || initialsNoNumbers.startsWith(cleanQ);
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
