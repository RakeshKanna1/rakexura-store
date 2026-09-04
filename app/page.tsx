import { Reveal } from "@/components/animations/reveal";
import { FireflyCanvas } from "@/components/animations/firefly-canvas";
import { ReviewWall } from "@/components/reviews/review-wall";
import { BundleShelf } from "@/components/store/bundle-shelf";
import { CategoryRail } from "@/components/store/category-rail";
import { CustomerProofWall } from "@/components/store/customer-proof-wall";
import { DeliveryGuarantee } from "@/components/store/delivery-guarantee";
import { HeroCarousel } from "@/components/store/hero-carousel";
import { FaqPreview } from "@/components/store/faq-preview";
import { FlashSaleBlock } from "@/components/store/flash-sale";
import { GameShelf } from "@/components/store/game-shelf";
import { HowToOrder } from "@/components/store/how-to-order";
import { LiveDeliveryTicker } from "@/components/store/live-delivery-ticker";
import { RecentlyViewedShelf } from "@/components/store/recently-viewed";
import { TrustStats } from "@/components/store/trust-stats";
import { WhatsAppCommunity } from "@/components/store/whatsapp-community";
import { WhatsAppCta } from "@/components/store/whatsapp-cta";
import { OfferMarquee } from "@/components/store/offer-marquee";
import { getBundles, getCustomerProofs, getFlashSales, getGames, getRecentDeliveries, getReviews, getTotalCompletedOrdersCount } from "@/lib/supabase/queries";
import { lowestPrice, isPreorderActive } from "@/lib/utils";

export const revalidate = 60;

export default async function Home() {
  const [games, bundles, reviews, sales, deliveries, proofs, totalOrdersCount] = await Promise.all([
    getGames(),
    getBundles(),
    getReviews(10),
    getFlashSales(),
    getRecentDeliveries(),
    getCustomerProofs(24),
    getTotalCompletedOrdersCount(),
  ]);
  
  const now = Date.now();
  const liveFlashSales = sales.filter(
    (s) => s.active && (!s.starts_at || new Date(s.starts_at).getTime() <= now) && (!s.ends_at || new Date(s.ends_at).getTime() > now)
  );

  // 1. Identify active Flash Sale games & prioritize them at the front of the Spotlight Banner
  const flashGameIds = new Set(liveFlashSales.map((s) => s.game_id));
  const flashGames = games.filter((g) => flashGameIds.has(g.id));
  const hero = games.filter((game) => game.show_in_hero && !flashGameIds.has(game.id));
  const fallbackHero = games.filter((g) => !g.is_subscription && !flashGameIds.has(g.id));
  const heroGames = [...flashGames, ...(hero.length ? hero : fallbackHero)].slice(0, 10);

  const featured = games.filter((game) => (game.show_in_featured || game.featured_deal) && !game.is_subscription).slice(0, 12);
  const trending = games.filter((game) => game.show_in_trending && !game.is_subscription).slice(0, 12);
  const bestSellers = trending.length ? trending : games.filter((game) => (game.featured_deal || game.show_in_trending) && !game.is_subscription).slice(0, 12);
  const budget = games.filter((game) => lowestPrice(game) > 0 && lowestPrice(game) <= 299 && !game.is_subscription).slice(0, 12);
  const subscriptions = games.filter((game) => game.is_subscription).slice(0, 12);
  const upcoming = games.filter((game) => isPreorderActive(game) && !game.is_subscription).slice(0, 12);
  const arrivals = [...games].filter((game) => !game.is_subscription).sort((a, b) => b.id - a.id).slice(0, 12);
  const highlightGames = featured.length ? featured : games.filter((g) => !g.is_subscription);

  return <>
    <OfferMarquee />
    <div className="crystal-grid-bg bg-black overflow-hidden pb-12 relative">
      {/* Signature warm gold atmospheric ambient aura behind the hero and storefront */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[520px] bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(250,204,21,0.12),transparent_70%),radial-gradient(ellipse_40%_35%_at_80%_10%,rgba(245,158,11,0.06),transparent_60%)] filter blur-2xl" />
      
      {/* Dynamic Animated Sparkles, Shimmering Diamonds & Fireflies Canvas */}
      <FireflyCanvas />

      <div className="shell pt-5 md:pt-8">
        <HeroCarousel games={heroGames} flashSales={liveFlashSales} />
        <LiveDeliveryTicker deliveries={deliveries} />
        <WhatsAppCommunity />
        <TrustStats totalOrders={totalOrdersCount} />
        {liveFlashSales.length > 0 && <Reveal><FlashSaleBlock sales={liveFlashSales} /></Reveal>}
        {upcoming.length > 0 && <Reveal><GameShelf title="Pre-order games" subtitle="Secure your copy of upcoming titles" games={upcoming} href="/games?category=Pre-order" rows={1} /></Reveal>}
        <Reveal><GameShelf title="Gamer's choice" subtitle="Popular picks selected by Rakexura players" games={highlightGames} href="/games?sort=featured" rows={2} /></Reveal>
        <Reveal><CategoryRail /></Reveal>
        <Reveal><GameShelf title="Deals under ₹299" subtitle="Strong games without stretching your budget" games={budget} href="/games?maxPrice=299" rows={1} /></Reveal>
        {subscriptions.length > 0 && <Reveal><GameShelf title="Game Pass and subscriptions" subtitle="Memberships and gaming services" games={subscriptions} href="/subscriptions" rows={1} /></Reveal>}
        <Reveal><GameShelf title="Best sellers" subtitle="The titles players keep choosing" games={bestSellers.length ? bestSellers : games} href="/games?sort=bestselling" rows={2} /></Reveal>
        <Reveal><BundleShelf bundles={bundles} /></Reveal>
        <Reveal><GameShelf title="New arrivals" subtitle="Fresh additions to the Rakexura catalog" games={arrivals} href="/games?sort=newest" rows={2} /></Reveal>
        <RecentlyViewedShelf games={games} />
        <Reveal><CustomerProofWall proofs={proofs} /></Reveal>
        <ReviewWall reviews={reviews} />
        <Reveal><HowToOrder /></Reveal>
        <DeliveryGuarantee />
        <FaqPreview />
        <WhatsAppCta />
      </div>
    </div>
  </>;
}
