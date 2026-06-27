import type { Metadata } from "next";
import { Catalog } from "@/components/store/catalog";
import { getGames } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Browse Games", description: "Browse Rakexura's PC game catalog by title, genre, and platform." };
export const revalidate = 60;

export default async function GamesPage() {
  const games = await getGames();
  return <div className="page-shell py-10"><header className="mb-10 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#facc15]">Rakexura catalog</p><h1 className="mb-4 text-4xl font-black sm:text-6xl">Find your next game.</h1><p className="section-copy">Live prices, available platforms, bundles, and personal order support in one place.</p></header><Catalog games={games} /></div>;
}
