import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/wishlist-view";
import { getGames } from "@/lib/supabase/queries";
import { BackButton } from "@/components/layout/back-button";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const games = await getGames();
  return (
    <div className="page-shell py-6 sm:py-10">
      <BackButton href="/games" label="Back to Store" className="mb-3 sm:mb-4" />
      <header className="mb-5 sm:mb-10 max-w-3xl">
        <p className="eyebrow mb-1.5 sm:mb-3 text-[11px] sm:text-xs">Saved for later</p>
        <h1 className="mb-2 sm:mb-3 text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">Your Wishlist.</h1>
        <p className="section-copy text-xs sm:text-sm text-[#8991a6] leading-relaxed">Keep track of games you want to purchase later. Your saved titles sync across your devices.</p>
      </header>
      <WishlistView games={games} />
    </div>
  );
}
