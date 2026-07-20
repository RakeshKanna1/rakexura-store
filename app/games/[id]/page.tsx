import { Suspense, type CSSProperties } from "react";
import { preload } from "react-dom";
import type { Metadata } from "next";
import { BadgeCheck, Check, Clock, Gift, KeyRound, MonitorCog, ShieldCheck, Sparkles, Star, Zap } from "lucide-react";
import { notFound } from "next/navigation";
import { GameShelf } from "@/components/store/game-shelf";
import { MediaGallery } from "@/components/store/media-gallery";
import { ProductActions } from "@/components/store/product-actions";
import { RecentlyViewedTracker } from "@/components/store/recently-viewed";
import { assetUrl, formatPrice } from "@/lib/utils";
import { getGame, getGames, getGameReviews } from "@/lib/supabase/queries";
import type { Platform, Game } from "@/types/store";
import { BundleAddonMatrix } from "@/components/store/bundle-addon-matrix";
import { PremiumAmbientEffect } from "@/components/animations/premium-ambient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(Number(id));
  return game ? { title: game.title, description: game.description ?? game.tagline, openGraph: { images: [assetUrl(game.banner_image || game.cover_image)] } } : { title: "Game not found" };
}

function platformPrice(game: Game, platform: Platform) {
  if (platform === "Epic") return Number(game.epic_price ?? 0);
  if (platform === "Offline") return Number(game.offline_price ?? 0);
  if (platform === "Online") return Number(game.online_price ?? 0);
  if (platform === "Xbox") return Number(game.xbox_price ?? 0);
  if (platform === "Nvidia GeForce") return Number(game.geforce_price ?? 0);
  return Number(game.steam_price ?? 0);
}

function gameAccent(title: string, genres?: string[] | null) {
  const titleLower = title.toLowerCase();
  const genresLower = (genres ?? []).map((g) => g.toLowerCase());
  const identity = `${title} ${(genres ?? []).join(" ")}`.toLowerCase();

  // 1. Specific title matches
  if (titleLower.includes("xbox")) return "#107c10"; // Xbox Green
  if (titleLower.includes("nvidia") || titleLower.includes("geforce")) return "#76b900"; // Nvidia Green
  if (titleLower.includes("mafia")) return "#c2410c"; // Crimson orange / vintage red
  if (titleLower.includes("red dead") || titleLower.includes("rdr") || titleLower.includes("western")) return "#b91c1c"; // Red Dead red
  if (titleLower.includes("cyberpunk")) return "#facc15"; // Cyberpunk yellow
  if (titleLower.includes("gta") || titleLower.includes("grand theft")) return "#16a34a"; // GTA green
  if (titleLower.includes("witcher")) return "#d97706"; // Witcher amber/gold
  if (titleLower.includes("elden ring") || titleLower.includes("souls")) return "#eab308"; // Souls gold
  if (titleLower.includes("spider-man") || titleLower.includes("spiderman") || titleLower.includes("marvel")) return "#0ea5e9"; // Spider-man blue
  if (titleLower.includes("god of war")) return "#dc2626"; // God of War red
  if (titleLower.includes("forza") || titleLower.includes("need for speed") || titleLower.includes("nfs") || titleLower.includes("racing")) return "#2563eb"; // Racing blue

  // 2. Genre-based keyword matching
  if (genresLower.includes("horror") || identity.includes("zombie") || identity.includes("resident evil")) return "#dc2626"; // Horror red
  if (genresLower.includes("racing") || genresLower.includes("sports") || identity.includes("truck") || identity.includes("simulator")) return "#2563eb"; // Sports/Sim blue
  if (genresLower.includes("rpg") || identity.includes("fantasy")) return "#8b5cf6"; // RPG purple
  if (genresLower.includes("shooter") || genresLower.includes("action") || identity.includes("warfare") || identity.includes("combat")) return "#ef4444"; // Shooter/Action red
  if (genresLower.includes("strategy") || genresLower.includes("simulation")) return "#06b6d4"; // Strategy/Simulation cyan
  if (genresLower.includes("adventure") || identity.includes("tomb raider") || identity.includes("uncharted")) return "#10b981"; // Adventure green

  // Default fallback
  return "#7c3aed";
}

function getPremiumTheme(dbTheme: string | null | undefined, title: string, genres?: string[] | null) {
  if (dbTheme && ["royal", "jungle", "cyberpunk", "crimson"].includes(dbTheme)) {
    return dbTheme as "royal" | "jungle" | "cyberpunk" | "crimson";
  }

  const identity = `${title} ${(genres ?? []).join(" ")}`.toLowerCase();

  if (
    identity.includes("uncharted") || 
    identity.includes("tomb raider") || 
    identity.includes("horizon zero") ||
    identity.includes("horizon forbidden") ||
    identity.includes("green") || 
    identity.includes("forest") || 
    identity.includes("jungle") ||
    identity.includes("wood") || 
    identity.includes("wild") || 
    identity.includes("nature")
  ) {
    return "jungle";
  }

  if (
    identity.includes("cyberpunk") || 
    identity.includes("neon") || 
    identity.includes("starfield") || 
    identity.includes("sci-fi") || 
    identity.includes("space") || 
    identity.includes("future") || 
    identity.includes("cyber") || 
    identity.includes("mech") || 
    identity.includes("halo") || 
    identity.includes("destiny") ||
    identity.includes("robot")
  ) {
    return "cyberpunk";
  }

  if (
    identity.includes("mafia") || 
    identity.includes("red dead") || 
    identity.includes("rdr") || 
    identity.includes("resident evil") || 
    identity.includes("god of war") || 
    identity.includes("horror") || 
    identity.includes("zombie") || 
    identity.includes("dracula") || 
    identity.includes("vampire") || 
    identity.includes("doom") || 
    identity.includes("blood") || 
    identity.includes("elden ring") || 
    identity.includes("souls") || 
    identity.includes("witcher") ||
    identity.includes("mortal kombat") ||
    identity.includes("devil may cry")
  ) {
    return "crimson";
  }

  return "royal";
}

function getPremiumAccent(theme: string) {
  if (theme === "jungle") return "#10b981"; // Emerald green
  if (theme === "cyberpunk") return "#22d3ee"; // Neon cyan
  if (theme === "crimson") return "#ef4444"; // Crimson red
  return "#d4af37"; // Royal gold
}

function titleSize(title: string) {
  if (title.length > 30) return "text-[clamp(2.4rem,5.8vw,5.4rem)]";
  if (title.length > 20) return "text-[clamp(2.7rem,6.3vw,6rem)]";
  return "text-[clamp(3rem,7vw,6.8rem)]";
}

export async function generateStaticParams() {
  const games = await getGames();
  return games.map((game) => ({
    id: String(game.id),
  }));
}

export default async function GamePage({ params }: Props) {
  const { id } = await params;
  const game = await getGame(Number(id));
  if (!game || game.archived) notFound();

  const bannerUrl = assetUrl(game.banner_image || game.cover_image);
  preload(bannerUrl, { as: "image", fetchPriority: "high", crossOrigin: "anonymous" });

  const tags = [...(game.genres ?? []), ...(game.tags ?? [])].slice(0, 7);
  const screenshots = (game.screenshots ?? []).filter(Boolean);
  const features = game.key_features?.length ? game.key_features : game.features ?? [];
  const platforms = (game.available_platforms ?? ["Steam", "Epic"]).filter((platform) => platform !== "Offline" && platform !== "Online" && platformPrice(game, platform) > 0);
  const premiumTheme = game.is_premium ? getPremiumTheme(game.premium_theme, game.title, game.genres) : null;
  const accent = premiumTheme ? getPremiumAccent(premiumTheme) : gameAccent(game.title, game.genres);

  let backgroundStyle = "";
  if (premiumTheme === "jungle") {
    backgroundStyle = `
      radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.12), transparent 48rem),
      radial-gradient(circle at 15% 55%, rgba(212, 175, 55, 0.06), transparent 38rem),
      radial-gradient(circle at 50% -8%, rgba(16, 185, 129, 0.18), transparent 35rem),
      #020b06
    `;
  } else if (premiumTheme === "cyberpunk") {
    backgroundStyle = `
      radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.1), transparent 48rem),
      radial-gradient(circle at 15% 55%, rgba(212, 175, 55, 0.06), transparent 38rem),
      radial-gradient(circle at 50% -8%, rgba(34, 211, 238, 0.15), transparent 35rem),
      #02050b
    `;
  } else if (premiumTheme === "crimson") {
    backgroundStyle = `
      radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.1), transparent 48rem),
      radial-gradient(circle at 15% 55%, rgba(212, 175, 55, 0.06), transparent 38rem),
      radial-gradient(circle at 50% -8%, rgba(239, 68, 68, 0.15), transparent 35rem),
      #070303
    `;
  } else if (premiumTheme === "royal") {
    backgroundStyle = `
      radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.15), transparent 48rem),
      radial-gradient(circle at 15% 55%, rgba(212, 175, 55, 0.08), transparent 38rem),
      radial-gradient(circle at 50% -8%, rgba(212, 175, 55, 0.22), transparent 35rem),
      #0b0803
    `;
  } else {
    backgroundStyle = `
      radial-gradient(circle at 80% 20%, ${accent}1b, transparent 45rem),
      radial-gradient(circle at 15% 55%, ${accent}0e, transparent 35rem),
      radial-gradient(circle at 50% -8%, ${accent}16, transparent 32rem),
      #03050a
    `;
  }

  const pageStyle = {
    "--game-accent": accent,
    "--game-accent-soft": `${accent}16`,
    "--game-accent-strong": `${accent}2b`,
    background: backgroundStyle,
  } as CSSProperties;

  const heroBackground = `linear-gradient(90deg, rgba(3,5,11,0.98), rgba(3,5,11,0.72) 44%, rgba(3,5,11,0.15)), linear-gradient(0deg, rgba(3,5,11,0.92), transparent 58%)`;

  let heroBorderClass = "border-white/[0.08]";
  if (premiumTheme === "jungle") {
    heroBorderClass = "border-emerald-500/30 shadow-[0_0_35px_rgba(16,185,129,0.15)]";
  } else if (premiumTheme === "cyberpunk") {
    heroBorderClass = "border-cyan-500/30 shadow-[0_0_35px_rgba(34,211,238,0.15)]";
  } else if (premiumTheme === "crimson") {
    heroBorderClass = "border-red-500/30 shadow-[0_0_35px_rgba(239,68,68,0.15)]";
  } else if (premiumTheme === "royal") {
    heroBorderClass = "border-[#d4af37]/30 shadow-[0_0_35px_rgba(212,175,55,0.15)]";
  }

  let badgeClass = "";
  if (premiumTheme === "jungle") {
    badgeClass = "border-emerald-500/35 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
  } else if (premiumTheme === "cyberpunk") {
    badgeClass = "border-cyan-500/35 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]";
  } else if (premiumTheme === "crimson") {
    badgeClass = "border-red-500/35 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
  } else if (premiumTheme === "royal") {
    badgeClass = "border-[#d4af37]/35 bg-[#d4af37]/10 text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.15)]";
  }

  let titleGradientClass = "text-white";
  if (game.is_premium) {
    if (premiumTheme === "jungle") {
      titleGradientClass = "bg-gradient-to-r from-[#d1fae5] via-[#10b981] to-[#d1fae5] bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(16,185,129,0.35)]";
    } else if (premiumTheme === "cyberpunk") {
      titleGradientClass = "bg-gradient-to-r from-[#ecfeff] via-[#22d3ee] to-[#ecfeff] bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(34,211,238,0.35)]";
    } else if (premiumTheme === "crimson") {
      titleGradientClass = "bg-gradient-to-r from-[#fee2e2] via-[#ef4444] to-[#fee2e2] bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(239,68,68,0.35)]";
    } else {
      titleGradientClass = "bg-gradient-to-r from-[#ffe893] via-[#d4af37] to-[#ffe893] bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(212,175,55,0.3)]";
    }
  }

  let panelClass = "";
  if (game.is_premium) {
    if (premiumTheme === "jungle") {
      panelClass = "rounded-xl border border-emerald-500/15 bg-[#03150c]/60 p-6 md:p-8 shadow-[0_4px_30px_rgba(16,185,129,0.04)] backdrop-blur-md";
    } else if (premiumTheme === "cyberpunk") {
      panelClass = "rounded-xl border border-cyan-500/15 bg-[#030915]/60 p-6 md:p-8 shadow-[0_4px_30px_rgba(34,211,238,0.04)] backdrop-blur-md";
    } else if (premiumTheme === "crimson") {
      panelClass = "rounded-xl border border-red-500/15 bg-[#0d0404]/60 p-6 md:p-8 shadow-[0_4px_30px_rgba(239,68,68,0.04)] backdrop-blur-md";
    } else {
      panelClass = "rounded-xl border border-[#d4af37]/20 bg-[#16130b]/60 p-6 md:p-8 shadow-[0_4px_30px_rgba(212,175,55,0.05)] backdrop-blur-md";
    }
  }

  let featureItemClass = "border-white/[.07] bg-[#0d111c]";
  let reqPanelClass = "border-transparent";
  if (game.is_premium) {
    if (premiumTheme === "jungle") {
      featureItemClass = "border-emerald-500/15 bg-[#03150c]/40";
      reqPanelClass = "border-emerald-500/15 bg-[#03150c]/30";
    } else if (premiumTheme === "cyberpunk") {
      featureItemClass = "border-cyan-500/15 bg-[#030915]/40";
      reqPanelClass = "border-cyan-500/15 bg-[#030915]/30";
    } else if (premiumTheme === "crimson") {
      featureItemClass = "border-red-500/15 bg-[#0d0404]/40";
      reqPanelClass = "border-red-500/15 bg-[#0d0404]/30";
    } else {
      featureItemClass = "border-[#d4af37]/15 bg-[#16130b]/40";
      reqPanelClass = "border-[#d4af37]/15 bg-[#16130b]/30";
    }
  }

  let activationPanelClass = "border-white/[0.08]";
  if (game.is_premium) {
    if (premiumTheme === "jungle") {
      activationPanelClass = "border-emerald-500/25 bg-[#03150c]/50 shadow-[0_0_20px_rgba(16,185,129,0.03)]";
    } else if (premiumTheme === "cyberpunk") {
      activationPanelClass = "border-cyan-500/25 bg-[#030915]/50 shadow-[0_0_20px_rgba(34,211,238,0.03)]";
    } else if (premiumTheme === "crimson") {
      activationPanelClass = "border-red-500/25 bg-[#0d0404]/50 shadow-[0_0_20px_rgba(239,68,68,0.03)]";
    } else {
      activationPanelClass = "border-[#d4af37]/25 bg-[#16130b]/50 shadow-[0_0_20px_rgba(212,175,55,0.03)]";
    }
  }

  let tagClass = "bg-black/30 text-white";
  if (game.is_premium) {
    if (premiumTheme === "jungle") {
      tagClass = "bg-emerald-500/5 text-emerald-400 border-emerald-500/30";
    } else if (premiumTheme === "cyberpunk") {
      tagClass = "bg-cyan-500/5 text-cyan-400 border-cyan-500/30";
    } else if (premiumTheme === "crimson") {
      tagClass = "bg-red-500/5 text-red-400 border-red-500/30";
    } else {
      tagClass = "bg-[#d4af37]/5 text-[#d4af37] border-[#d4af37]/30";
    }
  }

  const trust = [
    { icon: BadgeCheck, title: "Verified listing", text: "Catalog details managed by Rakexura" },
    { icon: ShieldCheck, title: "Protected checkout", text: "Trackable order and private customer data" },
    { icon: Zap, title: "Assisted delivery", text: "Status updates from payment to delivery" },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": game.title,
    "image": assetUrl(game.cover_image),
    "description": game.description || game.tagline || "",
    "brand": {
      "@type": "Brand",
      "name": game.developer || "Rakexura",
    },
    "offers": {
      "@type": "Offer",
      "price": game.sale_price || game.original_price || 0,
      "priceCurrency": "INR",
      "availability": game.out_of_stock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "url": `${process.env.NEXT_PUBLIC_SITE_URL || "https://rakeon-store.vercel.app"}/games/${game.id}`,
    }
  };

  return <div className="game-page-theme shell relative min-w-0 overflow-x-clip pb-24 pt-7 lg:py-7" style={pageStyle}>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    {premiumTheme && <PremiumAmbientEffect theme={premiumTheme} />}
    <RecentlyViewedTracker gameId={game.id} />
    <section className={`game-detail-hero relative min-h-[560px] overflow-hidden rounded-xl border ${heroBorderClass}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={bannerUrl} 
        alt={game.title} 
        className="absolute inset-0 h-full w-full object-cover" 
        loading="eager"
        decoding="sync"
        crossOrigin="anonymous"
        {...{ fetchPriority: "high" }}
      />
      <div className="absolute inset-0" style={{ background: heroBackground }} />
      <div className="relative z-10 flex min-h-[560px] max-w-4xl flex-col justify-end p-7 md:p-14">
        {game.preorder && (
          <div className="mb-4 self-start inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 px-4 py-1.5 text-xs font-black uppercase tracking-[.18em] text-amber-300 backdrop-blur-md shadow-[0_0_25px_rgba(245,158,11,0.3)] animate-pulse">
            <Sparkles size={15} className="text-amber-400" /> Pre-Order Edition • Guaranteed Day 1 Access
          </div>
        )}
        {game.is_premium && !game.preorder && (
          <div className={`mb-4 self-start inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-black uppercase tracking-[.18em] backdrop-blur-sm animate-pulse ${badgeClass}`}>
            ★ Premium Listing
          </div>
        )}
        {game.out_of_stock && (
          <div className="mb-4 self-start inline-flex items-center gap-1.5 rounded-full border border-red-500/35 bg-red-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-[.18em] text-red-400 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse">
            ✦ Out of Stock
          </div>
        )}
        <p className="eyebrow" style={{ color: accent }}>
          {game.preorder ? "🔥 OFFICIAL PRE-ORDER RESERVATION" : game.is_premium ? "✦ RAKEXURA EXCLUSIVE ✦" : "Rakexura game page"}
        </p>
        <h1 className={`mt-5 max-w-4xl font-black leading-[.95] ${titleSize(game.title)} ${titleGradientClass}`}>{game.title}</h1>
        <p className="mt-5 text-lg text-[#d7dae4]">{game.tagline}</p>
        {tags.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className={`rounded border px-3 py-2 text-xs font-semibold backdrop-blur ${tagClass}`} style={!game.is_premium ? { borderColor: `${accent}55` } : {}}>{tag}</span>)}</div>}
      </div>
    </section>

    {game.preorder && (
      <section className="mt-8 rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-amber-950/40 p-6 md:p-8 backdrop-blur-md shadow-[0_0_40px_rgba(245,158,11,0.15)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-400/20 pb-5">
          <div>
            <span className="eyebrow text-amber-400 flex items-center gap-1.5"><Sparkles size={14} /> Official Pre-order Guarantee</span>
            <h2 className="text-2xl font-black text-white mt-1">Pre-order Launch Privileges</h2>
          </div>
          {game.release_date && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-black/40 px-4 py-2 text-xs font-bold text-amber-300">
              <Clock size={16} className="text-amber-400" />
              <span>Official Release: {new Date(game.release_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
          )}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <Zap size={18} className="text-amber-400" /> Guaranteed Day 1 Access
            </div>
            <p className="mt-2 text-xs text-[#a3abbd] leading-relaxed">Your order reservation is prioritized for immediate key dispatch on launch day.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <ShieldCheck size={18} className="text-amber-400" /> Price Lock Protection
            </div>
            <p className="mt-2 text-xs text-[#a3abbd] leading-relaxed">Lock in your price now. You will never be charged extra if launch prices rise.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <Gift size={18} className="text-amber-400" /> Pre-order DLC & Perks
            </div>
            <p className="mt-2 text-xs text-[#a3abbd] leading-relaxed">Includes publisher pre-order bonus content, early pre-loads, and extra rewards.</p>
          </div>
        </div>
      </section>
    )}

    <div className="game-detail-layout mt-8 grid gap-8 lg:grid-cols-[1fr_390px]">
      <div className="game-detail-main space-y-12">
        <section className={panelClass}>
          <p className="eyebrow mb-3" style={{ color: accent }}>{game.is_premium ? "★ PREMIUM DESCRIPTION ★" : "About this game"}</p>
          <h2 className="section-title">{game.is_premium ? "Exclusive presentation" : "Enter the experience"}</h2>
          <div className="muted mt-5 whitespace-pre-line text-base leading-8">{game.long_description || game.description || "Full game information is being prepared."}</div>
        </section>
        <MediaGallery title={game.title} trailer={game.trailer_url} screenshots={screenshots} />
        {features.length > 0 && <section><h2 className="section-title mb-5">Key features</h2><div className="grid gap-3 sm:grid-cols-2">{features.map((feature) => <div key={feature} className={`flex gap-3 rounded-md border p-4 text-sm ${featureItemClass}`}><Check size={17} className="shrink-0 text-[#00d68f]" />{feature}</div>)}</div></section>}
        <section><div className="mb-5 flex items-center gap-3"><MonitorCog size={21} style={{ color: accent }} /><h2 className="section-title">System requirements</h2></div><div className="grid gap-4 sm:grid-cols-2"><article className={`premium-panel rounded-md p-5 border ${reqPanelClass}`}><span className="text-xs font-black uppercase tracking-wider text-[#8991a6]">Minimum</span><p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#c4c9d6]">{game.minimum_requirements || "Requirements are confirmed with support before delivery."}</p></article><article className={`premium-panel rounded-md p-5 border ${reqPanelClass}`}><span className="text-xs font-black uppercase tracking-wider text-[#8991a6]">Recommended</span><p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#c4c9d6]">{game.recommended_requirements || "Use the publisher's recommended PC specification for the best experience."}</p></article></div></section>
        <section className={panelClass}>
          <h2 className="section-title mb-5">Compare platforms</h2>
          <div className="overflow-x-auto rounded-md border border-white/[.08]">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead className="bg-white/[.04] text-[#8991a6]">
                <tr>
                  <th className="p-4">Platform</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Delivery</th>
                  <th className="p-4">Availability</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((platform) => {
                  const isSharedActivation = platform === "Offline" || platform === "Online";
                  const isOutOfSlots = isSharedActivation
                    ? (typeof game.activation_slots === "number" && game.activation_slots === 0)
                    : game.out_of_stock;
                  const isLowSlots = isSharedActivation
                    ? (typeof game.activation_slots === "number" && game.activation_slots > 0 && game.activation_slots <= 3)
                    : false;
                  return (
                    <tr key={platform} className="border-t border-white/[.07]">
                      <td className="p-4 font-bold">{platform}</td>
                      <td className="p-4">{formatPrice(platformPrice(game, platform))}</td>
                      <td className="p-4 text-[#a0a8c0]">Digital assisted delivery</td>
                      <td className="p-4">
                        {isOutOfSlots ? (
                          <span className="text-red-400 font-medium">
                            {isSharedActivation ? "Out of slots" : "Out of stock"}
                          </span>
                        ) : isLowSlots ? (
                          <span className="text-amber-400 font-medium">{game.activation_slots} slots left</span>
                        ) : (
                          <span className="text-[#70efbb]">Available</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className={`premium-panel rounded-md p-6 border ${activationPanelClass}`}><div className="flex items-center gap-3"><KeyRound style={{ color: accent }} /><h2 className="section-title">Activation preview</h2></div><p className="section-copy mt-4 whitespace-pre-line">{game.activation_instructions || "After verification, your delivery message includes the game-specific activation steps and direct support access. Follow only the instructions attached to your Rakexura order."}</p></section>
        
        {/* ⭐ Customer Reviews & Ratings - Deferred */}
        <Suspense fallback={<div className="h-32 w-full skeleton rounded-md" />}>
          <ReviewsSection gameId={game.id} />
        </Suspense>
      </div>
      <aside className="game-detail-buy lg:sticky lg:top-24 lg:self-start">
        <ProductActions game={game} />
        
        {/* Bundle Matrix - Deferred */}
        <Suspense fallback={<div className="h-48 w-full skeleton rounded-md" />}>
          <BundleMatrixSection currentGame={game} />
        </Suspense>

        <div className="mt-3 grid gap-2">
          {trust.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3 rounded-md border border-white/[0.06] bg-white/[0.025] p-4">
              <Icon size={18} className="mt-0.5 shrink-0" style={{ color: accent }} />
              <div>
                <strong className="block text-xs">{title}</strong>
                <span className="mt-1 block text-[11px] leading-4 text-[#7f879d]">{text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Premium Game Details Metadata Panel */}
        {(game.release_date || game.developer || game.publisher) && (
          <div className="mt-3 rounded-md border border-white/[0.06] bg-white/[0.015] p-4 space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#8991a6] border-b border-white/[0.06] pb-2">
              Game Information
            </h3>
            <div className="space-y-2.5 text-xs">
              {game.release_date && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[#7f879d]">Release Date</span>
                  <span className="font-semibold text-white">
                    {(() => {
                      try {
                        const date = new Date(game.release_date);
                        if (isNaN(date.getTime())) return game.release_date;
                        return date.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        });
                      } catch {
                        return game.release_date;
                      }
                    })()}
                  </span>
                </div>
              )}
              {game.developer && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[#7f879d]">Developer</span>
                  <span className="font-semibold text-white truncate max-w-[65%] text-right" title={game.developer}>
                    {game.developer}
                  </span>
                </div>
              )}
              {game.publisher && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[#7f879d]">Publisher</span>
                  <span className="font-semibold text-white truncate max-w-[65%] text-right" title={game.publisher}>
                    {game.publisher}
                  </span>
                </div>
              )}
              {typeof game.activation_slots === "number" && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[#7f879d]">Activation Slots</span>
                  <span className="font-semibold text-[#ffca55]">
                    {game.activation_slots > 0 ? `${game.activation_slots} available` : "Out of slots"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>

    {/* Recommendations - Deferred */}
    <Suspense fallback={<div className="space-y-12 py-10"><ShelfSkeleton /><ShelfSkeleton /></div>}>
      <RecommendationsSection currentGame={game} />
    </Suspense>
  </div>;
}

async function ReviewsSection({ gameId }: { gameId: number }) {
  const finalReviews = await getGameReviews(gameId);

  return (
    <section className="premium-panel rounded-md p-6">
      <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
        ⭐ Customer Reviews & Ratings
      </h2>
      {finalReviews.length > 0 ? (
        <div className="space-y-4">
          {finalReviews.map((review) => (
            <div key={review.id} className="border-b border-white/[.05] pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between">
                <strong className="text-sm text-white">{review.customer_name}</strong>
                <span className="text-[11px] text-[#646b7b]">
                  {new Date(review.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex gap-1 text-[#ffb800] mt-1.5 mb-2">
                {Array.from({ length: review.rating }, (_, idx) => (
                  <Star key={idx} size={13} fill="currentColor" />
                ))}
              </div>
              <p className="text-xs text-[#d8dce7] leading-relaxed">
                {review.message}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#8991a6] bg-black/25 p-5 rounded-md border border-white/[0.05] text-center">
          No reviews available for this game yet.
        </p>
      )}
    </section>
  );
}

async function BundleMatrixSection({ currentGame }: { currentGame: Game }) {
  const games = await getGames();
  return <BundleAddonMatrix games={games} excludeId={currentGame.id} />;
}

async function RecommendationsSection({ currentGame }: { currentGame: Game }) {
  const games = await getGames();
  const related = games.filter((item) => item.id !== currentGame.id && item.genres?.some((genre) => currentGame.genres?.includes(genre))).slice(0, 6);
  const alsoBought = games.filter((item) => item.id !== currentGame.id && !related.some((relatedGame) => relatedGame.id === item.id)).slice(0, 6);

  return (
    <>
      <GameShelf title="Customers also bought" subtitle="Popular additions to the same order" games={alsoBought} />
      <GameShelf title="Related games" subtitle="More games in similar genres" games={related.length ? related : games.filter((item) => item.id !== currentGame.id).slice(0, 6)} />
    </>
  );
}

function ShelfSkeleton() {
  return (
    <div className="py-4">
      <div className="h-6 w-48 skeleton rounded mb-5" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-[320px] w-[170px] sm:w-[210px] shrink-0 skeleton rounded-md" />
        ))}
      </div>
    </div>
  );
}
