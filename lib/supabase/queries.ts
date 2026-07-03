import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { fallbackGames } from "@/lib/fallback-data";
import type { Bundle, CustomerProof, FlashSale, Game, RecentDelivery, Review } from "@/types/store";

function getStaticClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const getGames = unstable_cache(
  async (): Promise<Game[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return fallbackGames;
    const supabase = getStaticClient();
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .or("archived.is.null,archived.eq.false")
      .order("title");
    if (error || !data?.length) return fallbackGames;
    return data as Game[];
  },
  ["games-list"],
  { revalidate: 60, tags: ["games"] }
);

export const getGame = unstable_cache(
  async (id: number): Promise<Game | null> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return fallbackGames.find((game) => game.id === id) ?? null;
    const supabase = getStaticClient();
    const { data } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
    if (!data) {
      return fallbackGames.find((game) => game.id === id) ?? null;
    }
    return data as Game | null;
  },
  ["game-detail"],
  { revalidate: 60, tags: ["games"] }
);

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

export const getBundle = unstable_cache(
  async (id: number): Promise<Bundle | null> => {
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
  ["bundle-detail"],
  { revalidate: 60, tags: ["bundles"] }
);

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
  { revalidate: 60, tags: ["reviews"] }
);

export const getGameReviews = unstable_cache(
  async (gameId: number, limit = 10): Promise<Review[]> => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
    const supabase = getStaticClient();
    const { data } = await supabase.from("reviews").select("*, games(title)").eq("game_id", gameId).eq("approved", true).order("created_at", { ascending: false }).limit(limit);
    return (data ?? []) as Review[];
  },
  ["game-reviews-list"],
  { revalidate: 60, tags: ["reviews"] }
);

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
    return (data ?? []) as CustomerProof[];
  },
  ["customer-proofs-list"],
  { revalidate: 60, tags: ["proofs"] }
);
