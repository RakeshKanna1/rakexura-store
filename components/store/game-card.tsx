"use client";

import { useEffect, useState, PointerEvent } from "react";
import { motion } from "framer-motion";
import { Eye, Heart, ShoppingCart, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assetUrl, formatPrice, isHighEndDevice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import type { Game, Platform } from "@/types/store";

function gamePrice(game: Game) {
  const prices = [game.steam_price, game.epic_price, game.offline_price, game.online_price, game.xbox_price, game.geforce_price]
    .map(Number)
    .filter((value) => value > 0);

  return prices.length ? Math.min(...prices) : 0;
}

function platformPrice(game: Game, platform: Platform) {
  if (platform === "Epic") return Number(game.epic_price ?? 0);
  if (platform === "Offline") return Number(game.offline_price ?? 0);
  if (platform === "Online") return Number(game.online_price ?? 0);
  if (platform === "Xbox") return Number(game.xbox_price ?? 0);
  if (platform === "Nvidia GeForce") return Number(game.geforce_price ?? 0);
  return Number(game.steam_price ?? 0);
}

function defaultPlatform(game: Game): Platform {
  const available = availablePlatforms(game);

  return available.reduce((best, platform) => {
    const price = platformPrice(game, platform) || Number.POSITIVE_INFINITY;
    const bestPrice = platformPrice(game, best) || Number.POSITIVE_INFINITY;
    return price < bestPrice ? platform : best;
  }, available[0] ?? "Steam");
}

export function availablePlatforms(game: Game): Platform[] {
  const listed = game.available_platforms?.filter((platform) => platformPrice(game, platform) > 0);
  if (listed?.length) return listed;

  return (["Steam", "Epic", "Offline", "Online", "Xbox", "Nvidia GeForce"] as Platform[]).filter((platform) => platformPrice(game, platform) > 0);
}

interface GameCardInnerProps {
  game: Game;
  priority: boolean;
  onQuickView?: (game: Game) => void;
  add: (game: Game, platform: Platform) => void;
  toggleWishlist: (id: number) => void;
  saved: boolean;
  price: number;
  original: number;
  discount: number;
  platforms: Platform[];
}

function GameCardInner({
  game,
  priority,
  onQuickView,
  add,
  toggleWishlist,
  saved,
  price,
  original,
  discount,
  platforms,
}: GameCardInnerProps) {
  const router = useRouter();
  const handleMouseEnter = () => {
    router.prefetch(`/games/${game.id}`);
  };

  return (
    <>
      {game.is_premium && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          <div 
            className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-[#d4af37]/45 to-transparent opacity-60 group-hover:transition-all group-hover:duration-1000 group-hover:translate-x-[300%]" 
            style={{
              left: "-50%",
              transition: "transform 1.2s ease-in-out",
            }}
          />
        </div>
      )}
      <Link href={`/games/${game.id}`} prefetch={false} onMouseEnter={handleMouseEnter} className="block aspect-[4/5] overflow-hidden bg-[#08090c]">
        <Image
          src={assetUrl(game.cover_image)}
          alt={game.title}
          width={440}
          height={550}
          priority={priority}
          sizes="(max-width: 768px) 170px, 240px"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
      </Link>

      <div className="absolute left-2 top-2 flex flex-col gap-1 items-start z-10">
        {game.is_premium && <span className="rounded bg-gradient-to-r from-[#b8860b] to-[#d4af37] px-2 py-0.5 text-[8px] font-black text-black uppercase tracking-wider shadow shadow-black/80">Premium</span>}
        {game.preorder && <span className="rounded bg-purple-600 px-2 py-1 text-[9px] font-black text-white uppercase tracking-wider shadow shadow-black/50">Pre-order</span>}
        {discount > 0 && <span className="rounded bg-[#facc15] px-2 py-1 text-[10px] font-black text-black">-{discount}%</span>}
        {game.online_activation && <span className="rounded bg-[#00d68f] px-2 py-1 text-[9px] font-black text-white uppercase tracking-wider shadow shadow-black/50">Online Activation</span>}
        {game.out_of_stock && <span className="rounded bg-red-600 px-2 py-1 text-[9px] font-black text-white uppercase tracking-wider shadow shadow-black/50">Out of Stock</span>}
      </div>

      <div className="absolute right-2 top-2 flex gap-1.5">
        <button
          suppressHydrationWarning={true}
          onClick={() => {
            toggleWishlist(game.id);
            toast(saved ? "Removed from wishlist" : "Saved to wishlist");
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/70 backdrop-blur-md hover:scale-110 hover:border-white/30 hover:bg-black/90 active:scale-90 transition-all duration-200"
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={15} fill={saved ? "#facc15" : "none"} className={saved ? "text-[#facc15]" : ""} />
        </button>

        {onQuickView && (
          <button
            onClick={() => onQuickView(game)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/70 backdrop-blur-md hover:scale-110 hover:border-white/30 hover:bg-black/90 active:scale-90 transition-all duration-200"
            aria-label={`Quick view ${game.title}`}
          >
            <Eye size={15} />
          </button>
        )}
      </div>

      <div className="p-3">
        <p className="mb-1.5 truncate text-[9px] font-bold uppercase tracking-wide text-[#81889a]">{game.is_subscription ? "Service Membership" : (game.genres?.slice(0, 2).join(" / ") || "PC Game")}</p>

        <Link href={`/games/${game.id}`} prefetch={false} onMouseEnter={handleMouseEnter} className="line-clamp-2 min-h-10 text-sm font-bold leading-5">
          {game.title}
        </Link>

        <div className="mt-2 flex flex-wrap gap-1">
          {platforms.slice(0, 3).map((platform) => (
            <span key={platform} className="rounded border border-white/[.08] px-1.5 py-1 text-[8px] font-black uppercase text-[#9ca3b4]">
              {game.is_subscription ? (game.duration ? game.duration : (platform === "Steam" ? "1 Month" : platform === "Epic" ? "3 Months" : "12 Months")) : platform}
            </span>
          ))}
        </div>

        <p className="mt-1.5 text-[9px] text-[#8991a6]/80 font-medium leading-none">Add three more games to attain a code</p>

        <div className="mt-3 flex items-end justify-between gap-2">
          <span className="min-w-0">
            <strong className="block text-sm text-[#facc15]">{price ? formatPrice(price) : "Ask"}</strong>
            {original > price && <del className="block text-[9px] text-[#646b7b]">{formatPrice(original)}</del>}
          </span>

          <button
            suppressHydrationWarning={true}
            onClick={() => {
              if (game.out_of_stock) {
                toast.info("This game is currently out of stock. Please check back later, we will notify you once it becomes available!", {
                  duration: 5000,
                });
                return;
              }
              add(game, defaultPlatform(game));
              toast.success(`${game.title} added to cart`);
            }}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded border transition-all duration-200 hover:scale-110 active:scale-90 ${
              game.out_of_stock
                ? "border-red-500/30 text-red-500 hover:bg-red-500/10"
                : "border-[#facc15]/30 text-[#facc15] hover:bg-[#facc15] hover:text-black hover:border-transparent"
            }`}
            aria-label={game.out_of_stock ? "Out of Stock" : `Add ${game.title} to cart`}
          >
            {game.out_of_stock ? <X size={14} /> : <ShoppingCart size={15} />}
          </button>
        </div>
      </div>
    </>
  );
}

export function GameCard({
  game,
  priority = false,
  onQuickView,
}: {
  game: Game;
  priority?: boolean;
  onQuickView?: (game: Game) => void;
}) {
  const add = useCartStore((state) => state.add);
  const toggleWishlist = useCartStore((state) => state.toggleWishlist);
  const saved = useCartStore((state) => state.wishlistIds.includes(game.id));
  const price = gamePrice(game);
  const original = Number(game.original_price ?? 0);
  const discount = original > price && price > 0 ? Math.round((1 - price / original) * 100) : 0;
  const platforms = availablePlatforms(game);

  const [isMobile, setIsMobile] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 && !isHighEndDevice());
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const props: GameCardInnerProps = {
    game,
    priority,
    onQuickView,
    add,
    toggleWishlist,
    saved: mounted && saved,
    price,
    original,
    discount,
    platforms,
  };

  const move = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;

    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
  };

  const showDesktopEffects = !isMobile;

  const mouseEvents = showDesktopEffects ? {
    onPointerMove: move,
  } : {};

  const animateProps = showDesktopEffects ? {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: 0.42, ease: [0.2, 0.7, 0.2, 1] as [number, number, number, number] }
  } : {};

  const baseCardClasses = "spotlight-card group relative overflow-hidden rounded-md border transition-all duration-500 ease-out";
  const hoverTranslate = showDesktopEffects ? "hover:-translate-y-1.5" : "";
  
  const themeClasses = game.is_premium
    ? `border-[#d4af37]/30 bg-[#16130b] ${showDesktopEffects ? "border-[#d4af37]/35 hover:border-[#d4af37]/80 hover:shadow-[0_0_30px_rgba(212,175,55,0.28),0_14px_38px_rgba(0,0,0,0.5)]" : ""}`
    : `border-white/[.08] bg-[#11131a] ${showDesktopEffects ? "hover:border-[#facc15]/35 hover:bg-[#151922] hover:shadow-[0_0_30px_rgba(139,92,246,0.14),0_14px_38px_rgba(0,0,0,0.45)]" : "hover:border-[#facc15]/35 hover:bg-[#151922]"}`;

  return (
    <motion.article
      className={`${baseCardClasses} ${hoverTranslate} ${themeClasses}`}
      {...animateProps}
      {...mouseEvents}
    >
      <GameCardInner {...props} />
    </motion.article>
  );
}

