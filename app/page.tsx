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
import { OfferMarquee } from "@/components/store/offer-marquee";
import { RecentlyViewedShelf } from "@/components/store/recently-viewed";
import { TrustStats } from "@/components/store/trust-stats";
import { WhatsAppCommunity } from "@/components/store/whatsapp-community";
import { WhatsAppCta } from "@/components/store/whatsapp-cta";
import { WhatsAppFloat } from "@/components/common/whatsapp-float";
import { getBundles, getCustomerProofs, getFlashSales, getGames, getRecentDeliveries, getReviews } from "@/lib/supabase/queries";
import { lowestPrice } from "@/lib/utils";




export const revalidate = 60;

export default async function Home() {
  const [games, bundles, reviews, sales, deliveries, proofs] = await Promise.all([getGames(), getBundles(), getReviews(10), getFlashSales(), getRecentDeliveries(), getCustomerProofs()]);
  const hero = games.filter((game) => game.show_in_hero && !game.is_subscription).slice(0, 10);
  const featured = games.filter((game) => (game.show_in_featured || game.featured_deal) && !game.is_subscription).slice(0, 12);
  const trending = games.filter((game) => game.show_in_trending && !game.is_subscription).slice(0, 12);
  const bestSellers = games.filter((game) => (game.featured_deal || game.show_in_trending) && !game.is_subscription).slice(0, 12);
  const budget = games.filter((game) => lowestPrice(game) > 0 && lowestPrice(game) <= 299 && !game.is_subscription).slice(0, 12);
  const subscriptions = games.filter((game) => game.is_subscription).slice(0, 12);
  const upcoming = games.filter((game) => game.preorder && !game.is_subscription).slice(0, 12);
  const arrivals = [...games].filter((game) => !game.is_subscription).sort((a, b) => b.id - a.id).slice(0, 12);
  const heroGames = hero.length ? hero : games.filter((g) => !g.is_subscription).slice(0, 8);
  const highlightGames = featured.length ? featured : games.filter((g) => !g.is_subscription);

  return <>
    <OfferMarquee />
    <div className="crystal-grid-bg bg-black overflow-hidden pb-12 relative">
      {/* Subtle brand color gradient glows to match logo signature colors */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.015),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(250,204,21,0.005),transparent_50%)]" />
      
      {/* Dynamic Animated Sparkles, Shimmering Diamonds & Fireflies Canvas */}
      <FireflyCanvas />

      <div className="shell pt-5 md:pt-8">
        <HeroCarousel games={heroGames} />
        <LiveDeliveryTicker deliveries={deliveries} />
        <WhatsAppCommunity />
        <Reveal className="mt-6"><TrustStats /></Reveal>
        {upcoming.length > 0 && <Reveal><GameShelf title="Pre-order games" subtitle="Secure your copy of upcoming titles" games={upcoming} /></Reveal>}
        <Reveal><GameShelf title="Gamer's choice" subtitle="Popular picks selected by Rakexura players" games={highlightGames.slice(0, 12)} /></Reveal>
        <Reveal><CategoryRail /></Reveal>
        <Reveal><FlashSaleBlock sales={sales} /></Reveal>
        <Reveal><GameShelf title="Deals under Rs. 299" subtitle="Strong games without stretching your budget" games={budget} /></Reveal>
        {subscriptions.length > 0 && <Reveal><GameShelf title="Game Pass and subscriptions" subtitle="Memberships and gaming services" games={subscriptions} /></Reveal>}
        <Reveal><GameShelf title="Best sellers" subtitle="The titles players keep choosing" games={bestSellers.length ? bestSellers : games.slice(0, 12)} /></Reveal>
        <Reveal><BundleShelf bundles={bundles} /></Reveal>
        <Reveal><GameShelf title="Trending now" subtitle="Games players are checking out" games={trending.length ? trending : games.slice().reverse().slice(0, 12)} /></Reveal>
        <Reveal><GameShelf title="New arrivals" subtitle="Fresh additions to the Rakexura catalog" games={arrivals} /></Reveal>
        <RecentlyViewedShelf games={games} />
        <CustomerProofWall proofs={proofs} />
        <ReviewWall reviews={reviews} />
        <Reveal><HowToOrder /></Reveal>
        <DeliveryGuarantee />
        <FaqPreview />
        <WhatsAppCta />
      </div>
    </div>
    <WhatsAppFloat />
  </>;
}
