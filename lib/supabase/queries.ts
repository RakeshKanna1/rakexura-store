import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { fallbackGames } from "@/lib/fallback-data";
import type { Bundle, CustomerProof, FlashSale, Game, RecentDelivery, Review } from "@/types/store";

/* -------------------------------------------------------------------------- */
/*                            Supabase Static Client                          */
/* -------------------------------------------------------------------------- */

let staticClient: ReturnType<typeof createSupabaseClient> | null = null;

function getStaticClient() {
  if (staticClient) return staticClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cwvfgxdhearouclomjeq.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  staticClient = createSupabaseClient(url, key);
  return staticClient;
}

const GAME_CATALOG_COLUMNS = [
  "id",
  "title",
  "slug",
  "tagline",
  "developer",
  "publisher",
  "description",
  "cover_image",
  "banner_image",
  "trailer_url",
  "card_video_url",
  "sale_price",
  "original_price",
  "available_platforms",
  "archived",
  "genres",
  "tags",
  "key_features",
  "is_premium",
  "premium_theme",
  "preorder",
  "is_subscription",
  "steam_price",
  "epic_price",
  "offline_price",
  "online_price",
  "xbox_price",
  "geforce_price",
  "price_1m",
  "price_2m",
  "price_3m",
  "price_6m",
  "price_12m",
  "duration",
  "offer_enabled",
  "offer_end_date",
  "out_of_stock",
  "featured_deal",
  "show_in_hero",
  "show_in_featured",
  "show_in_trending",
  "show_in_recommended",
  "reseller_price"
].join(",");

/* -------------------------------------------------------------------------- */
/*                                Games & Catalog                             */
/* -------------------------------------------------------------------------- */

/**
 * Fetch all active games and subscriptions for catalog browsing.
 */
export const getGames = unstable_cache(
  async (): Promise<Game[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return fallbackGames;
    const supabase = getStaticClient();
    const { data, error } = await supabase
      .from("games")
      .select(GAME_CATALOG_COLUMNS)
      .or("archived.is.null,archived.eq.false")
      .order("title");

    if (error || !data?.length) return fallbackGames;
    return data as Game[];
  },
  ["games-list"],
  { revalidate: 60, tags: ["games"] }
);

/**
 * Fetch a single game by its ID with full details.
 */
export const getGame = (id: number) =>
  unstable_cache(
    async (): Promise<Game | null> => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return fallbackGames.find((game) => game.id === id) ?? null;
      }
      const supabase = getStaticClient();
      const { data, error } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        return fallbackGames.find((game) => game.id === id) ?? null;
      }
      return data as Game;
    },
    ["game-detail", String(id)],
    { revalidate: 60, tags: ["games", `game-${id}`] }
  )();

/**
 * Full-text search for games using PostgreSQL FTS.
 */
export async function searchCatalog(query: string): Promise<Game[]> {
  const term = query.toLowerCase().trim();
  if (!term) return [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return fallbackGames.filter(
      (g) => g.title.toLowerCase().includes(term) || (g.tagline || "").toLowerCase().includes(term)
    );
  }

  const supabase = getStaticClient();
  const { data, error } = await supabase.rpc("search_games" as never, { p_query: query } as never);
  if (error || !data) {
    return fallbackGames.filter(
      (g) => g.title.toLowerCase().includes(term) || (g.tagline || "").toLowerCase().includes(term)
    );
  }
  return data as unknown as Game[];
}

/* -------------------------------------------------------------------------- */
/*                                Bundles & Deals                             */
/* -------------------------------------------------------------------------- */

/**
 * Fetch all active game bundles with included titles.
 */
export const getBundles = unstable_cache(
  async (): Promise<Bundle[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
    const supabase = getStaticClient();
    const { data } = await supabase
      .from("bundles")
      .select("*, bundle_games(games(id,title))")
      .eq("active", true)
      .or(`offer_end_date.is.null,offer_end_date.gt.${new Date().toISOString()}`)
      .order("id", { ascending: false });
    return (data ?? []) as Bundle[];
  },
  ["bundles-list"],
  { revalidate: 60, tags: ["bundles"] }
);

/**
 * Fetch a single bundle by ID.
 */
export const getBundle = (id: number) =>
  unstable_cache(
    async (): Promise<Bundle | null> => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
      const supabase = getStaticClient();
      const { data } = await supabase
        .from("bundles")
        .select("*, bundle_games(games(id,title))")
        .eq("id", id)
        .eq("active", true)
        .or(`offer_end_date.is.null,offer_end_date.gt.${new Date().toISOString()}`)
        .maybeSingle();
      return data as Bundle | null;
    },
    ["bundle-detail", String(id)],
    { revalidate: 60, tags: ["bundles", `bundle-${id}`] }
  )();

/**
 * Fetch active flash sales with linked game info.
 */
export const getFlashSales = unstable_cache(
  async (): Promise<FlashSale[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
    const supabase = getStaticClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("flash_sales")
      .select("*, games(id,title,cover_image)")
      .eq("active", true)
      .lte("starts_at", now)
      .gt("ends_at", now)
      .order("ends_at")
      .limit(6);
    return (data ?? []) as FlashSale[];
  },
  ["flash-sales-list"],
  { revalidate: 60, tags: ["games", "flash-sales"] }
);

/* -------------------------------------------------------------------------- */
/*                            Reviews & Testimonials                          */
/* -------------------------------------------------------------------------- */

/**
 * Fetch approved customer reviews across the platform.
 */
export const getReviews = unstable_cache(
  async (limit = 8): Promise<Review[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
    const supabase = getStaticClient();
    const { data } = await supabase
      .from("reviews")
      .select("*, games(title)")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as Review[];
  },
  ["reviews-list"],
  { revalidate: 60, tags: ["reviews", "approved-reviews"] }
);

/**
 * Fetch approved customer reviews for a specific game.
 */
export const getGameReviews = (gameId: number, limit = 10) =>
  unstable_cache(
    async (): Promise<Review[]> => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
      const supabase = getStaticClient();
      const { data } = await supabase
        .from("reviews")
        .select("*, games(title)")
        .eq("game_id", gameId)
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      return (data ?? []) as Review[];
    },
    ["game-reviews-list", String(gameId), String(limit)],
    { revalidate: 60, tags: ["reviews", "approved-reviews", `game-reviews-${gameId}`] }
  )();

/**
 * Fetch approved customer payment/WhatsApp proof cards.
 */
export const getCustomerProofs = unstable_cache(
  async (): Promise<CustomerProof[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
    const supabase = getStaticClient();
    const { data } = await supabase
      .from("customer_proofs")
      .select("id,image_url,caption,proof_type,created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(8);
    return (data || []) as CustomerProof[];
  },
  ["customer-proofs"],
  { revalidate: 10, tags: ["proofs"] }
);

/* -------------------------------------------------------------------------- */
/*                         Storefront Feeds & Metadata                        */
/* -------------------------------------------------------------------------- */

/**
 * Fetch recent delivery notifications ticker.
 */
export const getRecentDeliveries = unstable_cache(
  async (): Promise<RecentDelivery[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
    const supabase = getStaticClient();
    const { data } = await supabase
      .from("recent_deliveries")
      .select("id,game_title,public_label,delivered_at")
      .order("delivered_at", { ascending: false })
      .limit(10);
    return (data ?? []) as RecentDelivery[];
  },
  ["recent-deliveries-list"],
  { revalidate: 60, tags: ["deliveries"] }
);

export interface MarqueeMessage {
  id?: number;
  message: string;
  icon_key: string;
}

/**
 * Fetch top offer marquee announcements.
 */
export const getMarqueeMessages = unstable_cache(
  async (): Promise<MarqueeMessage[]> => {
    const fallback: MarqueeMessage[] = [
      { id: 1, icon_key: "cart", message: "BUY 3+ GAMES & SAVE 10% WITH RAKE10" },
      { id: 2, icon_key: "gamepad", message: "ONIMUSHA AVAILABLE FOR PRE-ORDER" },
      { id: 3, icon_key: "spark", message: "NEW GAMES ADDED" },
      { id: 4, icon_key: "message", message: "JOIN THE RAKEXURA WHATSAPP COMMUNITY" },
      { id: 5, icon_key: "flame", message: "PRE-ORDER NOW" },
    ];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return fallback;
    const supabase = getStaticClient();
    const { data } = await supabase
      .from("marquee_messages")
      .select("id,message,icon_key")
      .eq("active", true)
      .order("sort_order");
    if (!data?.length) return fallback;
    return data as MarqueeMessage[];
  },
  ["marquee-messages-list"],
  { revalidate: 60, tags: ["marquee", "offers"] }
);

export interface StoreCategory {
  id: number;
  name: string;
  icon_key: string;
}

/**
 * Fetch active store genre/category tags.
 */
export const getStoreCategories = unstable_cache(
  async (): Promise<StoreCategory[]> => {
    const fallback: Array<{ name: string; icon_key: string }> = [
      { name: "Action", icon_key: "swords" },
      { name: "Open World", icon_key: "map" },
      { name: "Racing", icon_key: "car" },
      { name: "RPG", icon_key: "wand" },
      { name: "Horror", icon_key: "ghost" },
      { name: "Sports", icon_key: "trophy" },
      { name: "Fighting", icon_key: "crosshair" },
      { name: "Simulation", icon_key: "bike" },
      { name: "Shooter", icon_key: "crosshair" },
      { name: "Survival", icon_key: "ghost" },
      { name: "Strategy", icon_key: "map" },
      { name: "Adventure", icon_key: "map" },
    ];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return fallback.map((cat, index) => ({ id: index, ...cat }));
    }
    const supabase = getStaticClient();
    const { data } = await supabase
      .from("store_categories")
      .select("id,name,icon_key")
      .eq("active", true)
      .order("sort_order");
    if (!data?.length) {
      return fallback.map((cat, index) => ({ id: index, ...cat }));
    }
    return data as StoreCategory[];
  },
  ["store-categories-list"],
  { revalidate: 60, tags: ["categories"] }
);



