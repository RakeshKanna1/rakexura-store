import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { BundleShelf } from "@/components/store/bundle-shelf";
import { GameShelf } from "@/components/store/game-shelf";
import { OnboardingHint } from "@/components/common/onboarding-hint";
import { getBundles, getGames } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Your Cart" };

export default async function CartPage() {
  const [games, bundles] = await Promise.all([getGames(), getBundles()]);
  return (
    <div className="page-shell py-10">
      <header className="mb-8">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">Your cart</h1>
      </header>
      <div className="mb-5">
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
