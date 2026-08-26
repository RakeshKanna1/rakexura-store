import type { Metadata } from "next";
import { Catalog } from "@/components/store/catalog";
import { getGames, getBundles } from "@/lib/supabase/queries";
import { BackButton } from "@/components/layout/back-button";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Browse Games", description: "Browse Rakexura's PC game catalog by title, genre, and platform." };
export const revalidate = 60;

export default async function GamesPage() {
  const [games, bundles] = await Promise.all([getGames(), getBundles()]);
  return (
    <div className="page-shell py-6 sm:py-10">
      <BackButton href="/" label="Back to Store" className="mb-3 sm:mb-4" />
      <header className="mb-5 sm:mb-10 max-w-3xl">
        <p className="text-[11px] sm:text-xs font-black uppercase tracking-[.16em] text-[#facc15] mb-1 sm:mb-2">Rakexura catalog</p>
        <h1 className="mb-2 sm:mb-3 text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">Find your next game.</h1>
        <p className="section-copy text-xs sm:text-sm text-[#8991a6] leading-relaxed">Live prices, available platforms, bundles, and personal order support in one place.</p>
      </header>
      <Suspense fallback={<div className="h-64 sm:h-96 w-full flex items-center justify-center text-xs sm:text-sm font-bold text-neutral-400">Loading catalog...</div>}>
        <Catalog games={games} bundles={bundles} />
      </Suspense>
    </div>
  );
}
