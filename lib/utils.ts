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

export function getPlatformRegularPrice(game: {
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
}, platform: string): number {
  if (platform === "1 Month") return Number(game.price_1m ?? game.xbox_price ?? game.steam_price ?? 0);
  if (platform === "2 Months") return Number(game.price_2m ?? 0);
  if (platform === "3 Months") return Number(game.price_3m ?? 0);
  if (platform === "6 Months") return Number(game.price_6m ?? 0);
  if (platform === "12 Months") return Number(game.price_12m ?? 0);
  if (platform === "Epic") return Number(game.epic_price ?? game.steam_price ?? game.sale_price ?? 0);
  if (platform === "Offline") return Number(game.offline_price ?? game.steam_price ?? game.sale_price ?? 0);
  if (platform === "Online") return Number(game.online_price ?? game.steam_price ?? game.sale_price ?? 0);
  if (platform === "Xbox") return Number(game.xbox_price ?? 0);
  if (platform === "Nvidia GeForce") return Number(game.geforce_price ?? 0);
  return Number(game.steam_price ?? game.sale_price ?? 0);
}

export function calculatePlatformPrice(
  game: {
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
    original_price?: number | null;
    is_subscription?: boolean | null;
    active_flash_sale?: {
      sale_price?: number | null;
      price_1m?: number | null;
      price_2m?: number | null;
      price_3m?: number | null;
      price_6m?: number | null;
      price_12m?: number | null;
      ends_at?: string | null;
      starts_at?: string | null;
      active?: boolean | null;
    } | null;
  },
  platform: string,
  activeFlashSale?: {
    sale_price?: number | null;
    price_1m?: number | null;
    price_2m?: number | null;
    price_3m?: number | null;
    price_6m?: number | null;
    price_12m?: number | null;
    ends_at?: string | null;
    starts_at?: string | null;
    active?: boolean | null;
  } | null
): number {
  const regular = getPlatformRegularPrice(game, platform);
  if (regular <= 0) {
    return 0;
  }

  const fs = activeFlashSale !== undefined ? activeFlashSale : game.active_flash_sale;
  if (!fs || fs.active === false) {
    return regular;
  }

  const isOngoing = (!fs.starts_at || new Date(fs.starts_at).getTime() <= Date.now()) && (!fs.ends_at || new Date(fs.ends_at).getTime() > Date.now());
  if (!isOngoing) {
    return regular;
  }

  // 1. Subscription plan durations (1M, 2M, 3M, 6M, 12M)
  if (game.is_subscription) {
    const regular1m = Number(game.price_1m ?? game.xbox_price ?? game.steam_price ?? 0);
    const flash1m = Number(fs.price_1m || fs.sale_price || 0);

    if (platform === "1 Month" && flash1m > 0) return flash1m;

    const subsDiscountRatio = regular1m > 0 && flash1m > 0 ? flash1m / regular1m : 1;

    if (platform === "2 Months") {
      if (fs.price_2m && Number(fs.price_2m) > 0) return Number(fs.price_2m);
      if (subsDiscountRatio < 1 && regular > 0) return Math.max(1, Math.round(regular * subsDiscountRatio));
    }
    if (platform === "3 Months") {
      if (fs.price_3m && Number(fs.price_3m) > 0) return Number(fs.price_3m);
      if (subsDiscountRatio < 1 && regular > 0) return Math.max(1, Math.round(regular * subsDiscountRatio));
    }
    if (platform === "6 Months") {
      if (fs.price_6m && Number(fs.price_6m) > 0) return Number(fs.price_6m);
      if (subsDiscountRatio < 1 && regular > 0) return Math.max(1, Math.round(regular * subsDiscountRatio));
    }
    if (platform === "12 Months") {
      if (fs.price_12m && Number(fs.price_12m) > 0) return Number(fs.price_12m);
      if (subsDiscountRatio < 1 && regular > 0) return Math.max(1, Math.round(regular * subsDiscountRatio));
    }
    return regular;
  }

  // 2. Standard PC Games (Steam, Epic, Offline, Online, Xbox, Nvidia)
  const flashSalePrice = Number(fs.sale_price);
  if (flashSalePrice <= 0) return regular;

  const catalogPrices = [
    Number(game.steam_price),
    Number(game.offline_price),
    Number(game.epic_price),
    Number(game.online_price),
    Number(game.xbox_price),
    Number(game.geforce_price),
    Number(game.sale_price)
  ].filter((p) => !isNaN(p) && p > 0);

  const minCatalogPrice = catalogPrices.length ? Math.min(...catalogPrices) : regular;
  const refPrice = Number(game.sale_price || minCatalogPrice || regular);

  const discountRatio = refPrice > 0 && flashSalePrice < refPrice
    ? flashSalePrice / refPrice
    : (minCatalogPrice > 0 && flashSalePrice < minCatalogPrice ? flashSalePrice / minCatalogPrice : 1);

  if (discountRatio < 1 && regular > 0) {
    return Math.max(1, Math.min(regular, Math.round(regular * discountRatio)));
  }

  if (flashSalePrice < regular) {
    return flashSalePrice;
  }

  return regular;
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
  is_subscription?: boolean | null;
  active_flash_sale?: {
    sale_price?: number | null;
    price_1m?: number | null;
    price_2m?: number | null;
    price_3m?: number | null;
    price_6m?: number | null;
    price_12m?: number | null;
    ends_at?: string | null;
    starts_at?: string | null;
    active?: boolean | null;
  } | null;
}) {
  const fs = game.active_flash_sale;
  const isFlashOngoing = Boolean(
    fs &&
    fs.active !== false &&
    (!fs.starts_at || new Date(fs.starts_at).getTime() <= Date.now()) &&
    (!fs.ends_at || new Date(fs.ends_at).getTime() > Date.now())
  );

  const platforms = game.is_subscription
    ? ["1 Month", "2 Months", "3 Months", "6 Months", "12 Months"]
    : ["Steam", "Epic", "Offline", "Online", "Xbox", "Nvidia GeForce"];

  const prices = platforms
    .map((p) => calculatePlatformPrice(game, p))
    .filter((p) => p > 0);

  if (prices.length > 0) {
    return Math.min(...prices);
  }

  if (isFlashOngoing && fs && Number(fs.sale_price || fs.price_1m) > 0) {
    return Number(fs.sale_price || fs.price_1m);
  }

  return Number(game.sale_price ?? 0);
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

export type ResellerAdjustmentType = "percentage" | "flat" | "markup_flat" | "markup_percentage";

export function calculateResellerPrice(
  basePrice: number,
  discountValue: number,
  discountType: string = "percentage"
): { price: number; label: string; diff: number; isDiscount: boolean } {
  if (basePrice <= 0 || !discountValue) {
    return { price: basePrice, label: "", diff: 0, isDiscount: true };
  }

  const numVal = Number(discountValue);

  if (discountType === "flat") {
    // - Flat cash discount (-₹X)
    const finalPrice = Math.max(0, basePrice - numVal);
    const diff = -(basePrice - finalPrice);
    return { price: finalPrice, label: `-₹${numVal}`, diff, isDiscount: true };
  }

  if (discountType === "markup_flat") {
    // + Flat cash addition (+₹X)
    const finalPrice = basePrice + numVal;
    return { price: finalPrice, label: `+₹${numVal}`, diff: numVal, isDiscount: false };
  }

  if (discountType === "markup_percentage") {
    // + Percentage addition (+X%)
    const addAmount = Math.round((basePrice * numVal) / 100);
    const finalPrice = basePrice + addAmount;
    return { price: finalPrice, label: `+${numVal}%`, diff: addAmount, isDiscount: false };
  }

  // Default: percentage discount (-X%)
  const saveAmount = Math.round((basePrice * numVal) / 100);
  const finalPrice = Math.max(0, basePrice - saveAmount);
  return { price: finalPrice, label: `-${numVal}%`, diff: -saveAmount, isDiscount: true };
}

export function getResellerBadgeText(discountValue: number | string | null | undefined, discountType?: string | null, isAdmin: boolean = false): string {
  if (!discountValue || Number(discountValue) === 0) return "Verified Reseller";
  const num = Number(discountValue);
  const type = discountType || "percentage";
  if (type === "flat") return `Reseller (-₹${num})`;
  if (type === "markup_flat") return isAdmin ? `Reseller (+₹${num})` : "Verified Reseller";
  if (type === "markup_percentage") return isAdmin ? `Reseller (+${num}%)` : "Verified Reseller";
  return `Reseller (${num}% OFF)`;
}
