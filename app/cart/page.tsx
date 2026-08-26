import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { BundleShelf } from "@/components/store/bundle-shelf";
import { GameShelf } from "@/components/store/game-shelf";
import { OnboardingHint } from "@/components/common/onboarding-hint";
import { getBundles, getGames } from "@/lib/supabase/queries";
import { BackButton } from "@/components/layout/back-button";

export const metadata: Metadata = { title: "Your Cart" };

export default async function CartPage() {
  const [games, bundles] = await Promise.all([getGames(), getBundles()]);
  return (
    <div className="page-shell py-6 sm:py-10">
      <BackButton href="/games" label="Continue Shopping" className="mb-3 sm:mb-4" />
      <header className="mb-5 sm:mb-8">
        <p className="text-[11px] sm:text-xs font-black uppercase tracking-[.16em] text-[#facc15] mb-1 sm:mb-2">Checkout</p>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">Your cart</h1>
      </header>
      <div className="mb-4 sm:mb-5">
        <OnboardingHint id="first-order" title="Ready for your first order?">
          Review each platform, apply a coupon if you have one, then checkout. Final prices are verified securely before the order is created.
        </OnboardingHint>
      </div>
      <div className="w-full min-w-0 max-w-full overflow-x-hidden">
        <CartView />
        <GameShelf title="Recommended add-ons" subtitle="Popular choices for the same order" games={games.slice(0, 6)} />
        <BundleShelf bundles={bundles.slice(0, 3)} />
      </div>
    </div>
  );
}
