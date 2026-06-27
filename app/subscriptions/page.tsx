import type { Metadata } from "next";
import { getGames } from "@/lib/supabase/queries";
import { GameCard } from "@/components/store/game-card";

export const metadata: Metadata = { 
  title: "Gaming Subscriptions", 
  description: "Get Xbox Game Pass, EA Play, Ubisoft+, and other premium gaming services on Rakexura." 
};
export const revalidate = 60;

export default async function SubscriptionsPage() {
  const games = await getGames();
  const subscriptions = games.filter((game) => game.is_subscription);

  return (
    <div className="page-shell py-10">
      <header className="mb-10 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#facc15]">Services & Memberships</p>
        <h1 className="mb-4 text-4xl font-black sm:text-6xl">Gaming Subscriptions.</h1>
        <p className="section-copy">
          Xbox Game Pass Ultimate, EA Play, Ubisoft+, and more. Buy monthly, quarterly, or annual access with immediate delivery support.
        </p>
      </header>

      {subscriptions.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {subscriptions.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="my-20 text-center border border-white/5 bg-white/[0.01] rounded-xl p-16">
          <h2 className="text-xl font-bold text-white">No subscriptions active</h2>
          <p className="text-[#8991a6] mt-2 max-w-md mx-auto text-sm leading-relaxed">
            There are no membership plans available in the catalog right now. Check back later or ask Rakexura support on WhatsApp to request a subscription.
          </p>
        </div>
      )}
    </div>
  );
}
