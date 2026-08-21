"use client";

import { PointerEvent } from "react";
import { Eye, ShoppingCart, X, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assetUrl, formatPrice, gameUrl } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { triggerFlyToCart } from "@/components/common/fly-to-cart-animator";
import type { Game, Platform } from "@/types/store";
import { WishlistButton } from "./wishlist-button";
import { PlatformIcon } from "./platform-icon";
import { ResellerIcon } from "@/components/ui/reseller-badge";

function gamePrice(game: Game) {
  const prices = [
    game.price_1m,
    game.price_2m,
    game.price_3m,
    game.price_6m,
    game.price_12m,
    game.steam_price,
    game.epic_price,
    game.offline_price,
    game.online_price,
    game.xbox_price,
    game.geforce_price,
  ]
    .map(Number)
    .filter((value) => value > 0);

  return prices.length ? Math.min(...prices) : 0;
}

export function availablePlatforms(game: Game): Platform[] {
  if (game.is_subscription) {
    const raw = (game.available_platforms ?? []).filter(Boolean) as Platform[];
    const subOnly = raw.filter((p) => p.includes("Month") || p.includes("Year") || p.includes("Days"));
    if (subOnly.length) return subOnly;

    const subPlans: Array<[Platform, unknown]> = [
      ["1 Month", game.price_1m ?? game.xbox_price ?? game.steam_price],
      ["2 Months", game.price_2m],
      ["3 Months", game.price_3m],
      ["6 Months", game.price_6m],
      ["12 Months", game.price_12m],
    ];
    const subListed = subPlans.filter(([, value]) => Number(value ?? 0) > 0).map(([platform]) => platform);
    if (subListed.length) return subListed;
    return ["1 Month"];
  }

  const custom = (game.available_platforms ?? []).filter(Boolean) as Platform[];
  if (custom.length) return custom;

  const legacy: Array<[Platform, unknown]> = [
    ["Steam", game.steam_price],
    ["Epic", game.epic_price],
    ["Offline", game.offline_price],
    ["Online", game.online_price],
    ["Xbox", game.xbox_price],
    ["Nvidia GeForce", game.geforce_price],
  ];
  const listed = legacy.filter(([, value]) => Number(value ?? 0) > 0).map(([platform]) => platform);
  if (listed.length) return listed;
  return ["Steam"];
}

interface GameCardInnerProps {
  game: Game;
  priority: boolean;
  onQuickView?: (game: Game) => void;
  add: (game: Game, platform: Platform) => void;
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
  price,
  original,
  discount,
  platforms,
}: GameCardInnerProps) {
  const router = useRouter();
  const handleMouseEnter = () => {
    router.prefetch(gameUrl(game));
  };

  const lines = useCartStore((state) => state.lines);
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen);
  const isReseller = useCartStore((state) => state.isReseller);
  const resellerDiscount = useCartStore((state) => state.resellerDiscount);

  const isWholesaleActive = Boolean(isReseller && resellerDiscount > 0 && price > 0);
  const wholesalePrice = isWholesaleActive ? Math.max(0, Math.round(price * (1 - resellerDiscount / 100))) : price;

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
      <Link 
        href={gameUrl(game)} 
        prefetch={false} 
        onMouseEnter={handleMouseEnter}
        className="block aspect-[3/4] w-full shrink-0 overflow-hidden bg-[#08090c] relative"
      >
        <Image
          src={assetUrl(game.cover_image)}
          alt={game.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-transparent opacity-70" />

        {discount > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-[#8b5cf6] px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-[0_0_12px_rgba(139,92,246,0.5)] z-10">
            -{discount}%
          </span>
        )}
      </Link>

      <div className="absolute right-2.5 top-2.5 flex gap-1.5 z-10">
        <WishlistButton gameId={game.id} size={14} variant="card" />

        {onQuickView && (
          <button
            type="button"
            suppressHydrationWarning={true}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(game);
            }}
            className="group/eyebtn flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-black/75 backdrop-blur-md hover:scale-110 hover:border-white/40 hover:bg-black/90 active:scale-90 transition-all duration-200 text-white cursor-pointer"
            aria-label={`Quick view ${game.title}`}
          >
            <Eye size={14} className="eye-icon-blink" />
          </button>
        )}
      </div>

      <div className="p-3.5 flex flex-col justify-between flex-1 min-h-0">
        <div>
          <p className="mb-1 truncate text-[9px] font-extrabold uppercase tracking-wider text-[#81889a]">{game.is_subscription ? "Service Membership" : (game.genres?.slice(0, 2).join(" / ") || "PC Game")}</p>

          <Link href={gameUrl(game)} prefetch={false} onMouseEnter={handleMouseEnter} className="line-clamp-2 min-h-[2.5rem] text-sm font-extrabold leading-snug text-white group-hover:text-[#facc15] transition-colors">
            {game.title}
          </Link>

          <div className="mt-2 flex items-center gap-1 overflow-hidden min-h-[22px]">
            {game.online_activation && (
              <span className="inline-flex shrink-0 items-center rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black uppercase text-emerald-400">
                Online
              </span>
            )}
            {platforms.slice(0, 3).map((platform) => (
              <span key={platform} className="inline-flex shrink-0 items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[8px] font-black uppercase text-[#a7adbb]">
                <PlatformIcon platform={platform} className="h-2.5 w-2.5 shrink-0 text-[#a7adbb]" />
                <span>{game.is_subscription && game.duration ? game.duration : platform}</span>
              </span>
            ))}
          </div>

          <div className="mt-2.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-center">
            {isWholesaleActive ? (
              <p className="truncate text-[9px] font-bold text-[#e0ce9a] flex items-center justify-center gap-1">
                <Zap size={11} className="text-[#e0ce9a] shrink-0" />
                <span>{resellerDiscount}% Wholesale Margin Active</span>
              </p>
            ) : (
              <p className="truncate text-[9px] font-medium text-[#8991a6]">Buy 3 games & get 10% off with RAKE10</p>
            )}
          </div>
        </div>

        <div className="mt-3.5 flex items-end justify-between gap-2 border-t border-white/[0.06] pt-2.5">
          {isWholesaleActive ? (
            <span className="min-w-0">
              <div className="flex items-center gap-1.5">
                <strong className="block text-base font-black bg-gradient-to-r from-[#fff5d6] via-[#e8d59e] to-[#d6bd78] bg-clip-text text-transparent">{formatPrice(wholesalePrice)}</strong>
                <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-b from-[#1a1722] to-[#0f0c18] border border-[#e0ce9a]/25 px-1.5 py-0.5 text-[8.5px] font-black tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] select-none">
                  <ResellerIcon className="w-2.5 h-2.5 shrink-0" />
                  <span className="bg-gradient-to-r from-[#fff5d6] via-[#e8d59e] to-[#d6bd78] bg-clip-text text-transparent font-bold">
                    -{resellerDiscount}%
                  </span>
                </span>
              </div>
              <del className="block text-[10px] text-[#646b7b] font-semibold">{formatPrice(price)} Retail</del>
            </span>
          ) : (
            <span className="min-w-0">
              <strong className="block text-base font-black text-[#facc15]">{price ? formatPrice(price) : "Ask"}</strong>
              {original > price && <del className="block text-[10px] text-[#646b7b] font-semibold">{formatPrice(original)}</del>}
            </span>
          )}

          <button
            suppressHydrationWarning={true}
            onClick={(e) => {
              if (game.out_of_stock) {
                toast.info("This game is currently out of stock. Please check back later, we will notify you once it becomes available!", {
                  duration: 5000,
                });
                return;
              }
              const alreadyInCart = lines.some((l) => l.game.id === game.id);
              if (alreadyInCart) {
                toast.info(`${game.title} is already in your cart!`);
                setDrawerOpen(true);
                return;
              }
              triggerFlyToCart(assetUrl(game.cover_image), e.currentTarget);
              add(game, platforms[0] ?? "Steam");
              toast.success(`${game.title} added to cart`);
            }}
            className={`grid h-8.5 w-8.5 shrink-0 place-items-center rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
              game.out_of_stock
                ? "border-red-500/30 text-red-500 hover:bg-red-500/10"
                : "border-[#facc15]/40 bg-[#facc15]/10 text-[#facc15] hover:bg-[#facc15] hover:text-black hover:border-transparent shadow-sm"
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
  const price = gamePrice(game);
  const original = Number(game.original_price ?? 0);
  const discount = original > price && price > 0 ? Math.round((1 - price / original) * 100) : 0;
  const platforms = availablePlatforms(game);

  const props: GameCardInnerProps = {
    game,
    priority,
    onQuickView,
    add,
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

  const themeClasses = game.is_premium
    ? "border-[#d4af37]/35 bg-[#14110a]/90 hover:border-[#d4af37]/80 hover:shadow-[0_12px_40px_rgba(212,175,55,0.28)]"
    : "border-white/[0.08] bg-[#0c0d16]/90 hover:border-[#facc15]/40 hover:bg-[#15171e] hover:shadow-[0_12px_40px_rgba(250,204,21,0.14)]";

  return (
    <article
      onPointerMove={move}
      className={`spotlight-card group relative flex h-full flex-col overflow-hidden rounded-xl border transition-colors duration-200 md:transition-all md:duration-300 md:hover:-translate-y-1.5 transform-gpu shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] ${themeClasses}`}
    >
      <GameCardInner {...props} />
    </article>
  );
}

