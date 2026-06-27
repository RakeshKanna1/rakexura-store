import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/wishlist-view";
import { getGames } from "@/lib/supabase/queries";
export const metadata: Metadata = { title: "Wishlist" };
export default async function WishlistPage() { const games = await getGames(); return <div className="shell py-10"><p className="eyebrow mb-3">Saved for later</p><h1 className="mb-8 text-4xl font-bold md:text-5xl">Your wishlist</h1><WishlistView games={games} /></div>; }
