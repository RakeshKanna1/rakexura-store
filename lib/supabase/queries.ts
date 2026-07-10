import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { fallbackGames } from "@/lib/fallback-data";
import type { Bundle, CustomerProof, FlashSale, Game, RecentDelivery, Review } from "@/types/store";

let staticClient: ReturnType<typeof createSupabaseClient> | null = null;

function getStaticClient() {
  if (staticClient) return staticClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  staticClient = createSupabaseClient(url, key);
  return staticClient;
}

export const getGames = unstable_cache(
  async (): Promise<Game[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return fallbackGames;
    const supabase = getStaticClient();
    const { data, error } = await supabase
      .from("games")
      .select("id, title, tagline, developer, publisher, description, cover_image, banner_image, sale_price, original_price, available_platforms, archived, genres, is_premium, premium_theme, preorder, is_subscription, steam_price, epic_price, offline_price, online_price, xbox_price, geforce_price, offer_enabled, offer_end_date, out_of_stock, featured_deal, show_in_hero, show_in_featured, show_in_trending, show_in_recommended")
      .or("archived.is.null,archived.eq.false")
      .order("title");
    if (error || !data?.length) return fallbackGames;
    return data as Game[];
  },
  ["games-list"],
  { revalidate: 60, tags: ["games"] }
);

export const getGame = (id: number) => unstable_cache(
  async (): Promise<Game | null> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return fallbackGames.find((game) => game.id === id) ?? null;
    const supabase = getStaticClient();
    const { data } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
    if (!data) {
      return fallbackGames.find((game) => game.id === id) ?? null;
    }
    return data as Game | null;
  },
  ["game-detail", String(id)],
  { revalidate: 60, tags: ["games", `game-${id}`] }
)();

export const getBundles = unstable_cache(
  async (): Promise<Bundle[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
    const supabase = getStaticClient();
    const { data } = await supabase
      .from("bundles")
      .select("*, bundle_games(games(id,title))")
      .eq("active", true)
      .or("offer_end_date.is.null,offer_end_date.gt." + new Date().toISOString())
      .order("id", { ascending: false });
    return (data ?? []) as Bundle[];
  },
  ["bundles-list"],
  { revalidate: 60, tags: ["bundles"] }
);

export const getBundle = (id: number) => unstable_cache(
  async (): Promise<Bundle | null> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
    const supabase = getStaticClient();
    const { data } = await supabase
      .from("bundles")
      .select("*, bundle_games(games(id,title))")
      .eq("id", id)
      .eq("active", true)
      .or("offer_end_date.is.null,offer_end_date.gt." + new Date().toISOString())
      .maybeSingle();
    return data as Bundle | null;
  },
  ["bundle-detail", String(id)],
  { revalidate: 60, tags: ["bundles", `bundle-${id}`] }
)();

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

export const getGameReviews = (gameId: number, limit = 10) => unstable_cache(
  async (): Promise<Review[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
    const supabase = getStaticClient();
    const { data } = await supabase.from("reviews").select("*, games(title)").eq("game_id", gameId).eq("approved", true).order("created_at", { ascending: false }).limit(limit);
    return (data ?? []) as Review[];
  },
  ["game-reviews-list", String(gameId), String(limit)],
  { revalidate: 60, tags: ["reviews", "approved-reviews", `game-reviews-${gameId}`] }
)();

export const getFlashSales = unstable_cache(
  async (): Promise<FlashSale[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
    const supabase = getStaticClient();
    const { data } = await supabase.from("flash_sales").select("*, games(*)").eq("active", true).lte("starts_at", new Date().toISOString()).gt("ends_at", new Date().toISOString()).order("ends_at").limit(6);
    return (data ?? []) as FlashSale[];
  },
  ["flash-sales-list"],
  { revalidate: 60, tags: ["games"] }
);

export const getRecentDeliveries = unstable_cache(
  async (): Promise<RecentDelivery[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
    const supabase = getStaticClient();
    const { data } = await supabase.from("recent_deliveries").select("id,game_title,public_label,delivered_at").order("delivered_at", { ascending: false }).limit(10);
    return (data ?? []) as RecentDelivery[];
  },
  ["recent-deliveries-list"],
  { revalidate: 60, tags: ["deliveries"] }
);

export const getCustomerProofs = unstable_cache(
  async (): Promise<CustomerProof[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
    const supabase = getStaticClient();
    const { data } = await supabase.from("customer_proofs").select("id,image_url,caption,proof_type,created_at").eq("approved", true).order("created_at", { ascending: false }).limit(8);
    return (data || []) as CustomerProof[];
  },
  ["customer-proofs"],
  { revalidate: 10, tags: ["proofs"] }
);

/**
 * Highly scalable full-text catalog search using PostgreSQL FTS.
 * Seamlessly interfaces with search_games RPC function.
 */
export async function searchCatalog(query: string): Promise<Game[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const term = query.toLowerCase().trim();
    return fallbackGames.filter(g => g.title.toLowerCase().includes(term) || (g.tagline || "").toLowerCase().includes(term));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getStaticClient() as any;
  const { data, error } = await supabase.rpc("search_games", { p_query: query });
  if (error || !data) {
    console.error("FTS search failed:", error);
    return [];
  }
  return data as Game[];
}

export interface MarqueeMessage {
  id?: number;
  message: string;
  icon_key: string;
}

export const getMarqueeMessages = unstable_cache(
  async (): Promise<MarqueeMessage[]> => {
    const fallback = [
      { icon_key: "flame", message: "GTA V from Rs. 130" },
      { icon_key: "gamepad", message: "New games added weekly" },
      { icon_key: "zap", message: "Fast assisted delivery" },
      { icon_key: "cart", message: "Buy 3+ games and save 10% with RAKE10" },
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

export const getStoreCategories = unstable_cache(
  async (): Promise<StoreCategory[]> => {
    const fallback = [
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
      { name: "Adventure", icon_key: "map" }
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


