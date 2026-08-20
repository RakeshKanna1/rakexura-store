import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/wishlist-view";
import { getGames } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const games = await getGames();
  return (
    <div className="page-shell py-10">
      <header className="mb-10 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#facc15]">Saved for later</p>
        <h1 className="mb-4 text-4xl font-black sm:text-6xl">Your Wishlist.</h1>
        <p className="section-copy">Keep track of games you want to purchase later. Your saved titles sync across your devices.</p>
      </header>
      <WishlistView games={games} />
    </div>
  );
}
