import { createClient } from "@/lib/supabase/server";
import { fallbackGames } from "@/lib/fallback-data";
import type { Bundle, CustomerProof, FlashSale, Game, RecentDelivery, Review } from "@/types/store";

export async function getGames(): Promise<Game[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return fallbackGames;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .or("archived.is.null,archived.eq.false")
    .order("title");
  if (error || !data?.length) return fallbackGames;
  return data as Game[];
}

export async function getGame(id: number): Promise<Game | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return fallbackGames.find((game) => game.id === id) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
  if (!data) {
    return fallbackGames.find((game) => game.id === id) ?? null;
  }
  return data as Game | null;
}

export async function getBundles(): Promise<Bundle[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("bundles")
    .select("*, bundle_games(games(id,title))")
    .eq("active", true)
    .or("offer_end_date.is.null,offer_end_date.gt." + new Date().toISOString())
    .order("id", { ascending: false });
  return (data ?? []) as Bundle[];
}

export async function getBundle(id: number): Promise<Bundle | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bundles")
    .select("*, bundle_games(games(id,title))")
    .eq("id", id)
    .eq("active", true)
    .or("offer_end_date.is.null,offer_end_date.gt." + new Date().toISOString())
    .maybeSingle();
  return data as Bundle | null;
}

export async function getReviews(limit = 8): Promise<Review[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, games(title)")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Review[];
}

export async function getGameReviews(gameId: number, limit = 10): Promise<Review[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select("*, games(title)").eq("game_id", gameId).eq("approved", true).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as Review[];
}

export async function getFlashSales(): Promise<FlashSale[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("flash_sales").select("*, games(*)").eq("active", true).lte("starts_at", new Date().toISOString()).gt("ends_at", new Date().toISOString()).order("ends_at").limit(6);
  return (data ?? []) as FlashSale[];
}

export async function getRecentDeliveries(): Promise<RecentDelivery[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("recent_deliveries").select("id,game_title,public_label,delivered_at").order("delivered_at", { ascending: false }).limit(10);
  return (data ?? []) as RecentDelivery[];
}

export async function getCustomerProofs(): Promise<CustomerProof[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("customer_proofs").select("id,image_url,caption,proof_type,created_at").eq("approved", true).order("created_at", { ascending: false }).limit(8);
  return (data ?? []) as CustomerProof[];
}
