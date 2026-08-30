"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { assetUrl, calculateResellerPrice, formatPrice, gameUrl, lowestPrice } from "@/lib/utils";
import type { FlashSale } from "@/types/store";
import { BorderGlow } from "@/components/animations/border-glow";
import { useCartStore } from "@/stores/cart-store";
import { availablePlatforms } from "./game-card";

function remaining(end: string, now: number) {
  const distance = Math.max(0, new Date(end).getTime() - now);
  const d = Math.floor(distance / (1000 * 60 * 60 * 24));
  const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((distance % (1000 * 60)) / 1000);
  return { d, h, m, s };
}

export function FlashSaleBlock({ sales }: { sales: FlashSale[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(sales);
  const [now, setNow] = useState(Date.now());
  const [mounted, setMounted] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const rawIsReseller = useCartStore((state) => state.isReseller);
  const resellerDiscount = useCartStore((state) => state.resellerDiscount);
  const resellerDiscountType = useCartStore((state) => state.resellerDiscountType);
  const isReseller = mounted && rawIsReseller;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const el = scrollRef.current;
    if (!el) return;

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    setIsGrabbing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = scrollRef.current;
    if (!el) return;

    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.3;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handlePointerUpOrLeave = () => {
    isDraggingRef.current = false;
    setIsGrabbing(false);
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  };

  const handleCardClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    setMounted(true);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const supabase = createClient();
    const channel = supabase
      .channel("flash-sales-storefront")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "flash_sales" }, (payload: { new: Record<string, unknown> }) => {
        const item = payload.new as unknown as FlashSale;
        setItems((current) => [item, ...current.filter((c) => c.id !== item.id)]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "flash_sales" }, (payload: { new: Record<string, unknown> }) => {
        const update = payload.new as Partial<FlashSale> & { id: number };
        setItems((current) => current.map((item) => item.id === update.id ? { ...item, ...update } : item));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "flash_sales" }, (payload: { old: Record<string, unknown> }) => {
        const removed = payload.old as { id?: number };
        setItems((current) => current.filter((item) => item.id !== removed.id));
      })
      .subscribe();
    return () => { window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, []);

  const active = useMemo(() => {
    if (!mounted) return items.filter((sale) => sale.active);
    return items.filter(
      (sale) =>
        sale.active &&
        (!sale.starts_at || new Date(sale.starts_at).getTime() <= now) &&
        (!sale.ends_at || new Date(sale.ends_at).getTime() > now)
    );
  }, [items, now, mounted]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;

      if (Math.abs(e.deltaY) > 0 || Math.abs(e.deltaX) > 0) {
        e.preventDefault();
        e.stopPropagation();

        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        el.scrollLeft += delta * 1.05;
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [active]);

  if (!active.length) return null;

  return (
    <section className="section-space select-none">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Ends soon</p>
          <h2 className="section-title mt-2">Flash sale</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-2 text-xs sm:text-sm font-bold text-[#facc15]">
            <Clock3 size={16} /> Prices expire automatically
          </span>
          {active.length > 3 && (
            <div className="flex items-center gap-1.5">
              <button
                suppressHydrationWarning={true}
                type="button"
                onClick={() => scroll("left")}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 hover:border-[#facc15]/30 hover:bg-[#facc15]/10 hover:text-[#facc15] transition active:scale-95 cursor-pointer"
                aria-label="Previous flash sale items"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                suppressHydrationWarning={true}
                type="button"
                onClick={() => scroll("right")}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 hover:border-[#facc15]/30 hover:bg-[#facc15]/10 hover:text-[#facc15] transition active:scale-95 cursor-pointer"
                aria-label="Next flash sale items"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrLeave}
        onPointerLeave={handlePointerUpOrLeave}
        onPointerCancel={handlePointerUpOrLeave}
        className={`touch-row hide-scrollbar grid auto-cols-[85%] sm:auto-cols-[380px] md:auto-cols-[430px] xl:auto-cols-[32%] grid-flow-col gap-3.5 sm:gap-4 overflow-x-auto ${
          isGrabbing ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
          scrollBehavior: isGrabbing ? "auto" : "smooth",
        }}
      >
        {active.map((sale) => {
          const timer = mounted ? remaining(sale.ends_at, now) : { d: 0, h: 0, m: 0, s: 0 };
          const game = sale.games;
          if (!game) return null;

          const directSalePrice = Number(sale.sale_price || sale.price_1m || 0);
          const rawPrice = directSalePrice > 0 ? directSalePrice : lowestPrice({ ...game, active_flash_sale: sale });
          const isMarkup = resellerDiscountType === "markup_flat" || resellerDiscountType === "markup_percentage";
          const resellerCalc =
            isReseller && isMarkup && resellerDiscount > 0
              ? calculateResellerPrice(rawPrice, resellerDiscount, resellerDiscountType)
              : null;

          const timeBlocks: Array<[number, string]> = [
            [timer.d, "D"],
            [timer.h, "H"],
            [timer.m, "M"],
            [timer.s, "S"],
          ];

          const discountPercent =
            game.original_price && game.original_price > rawPrice
              ? Math.round(((game.original_price - rawPrice) / game.original_price) * 100)
              : null;

          const gamePlatforms = availablePlatforms(game);

          return (
            <div key={sale.id} className="snap-start will-change-transform transform-gpu h-full">
              <BorderGlow
                edgeSensitivity={40}
                glowColor="45 100 50"
                backgroundColor="#0c0c0c"
                borderRadius={6}
                glowRadius={28}
                glowIntensity={1.2}
                colors={['#facc15', '#eab308', '#8b5cf6']}
                className="w-full h-full"
              >
                <Link
                  href={gameUrl(game)}
                  draggable={false}
                  onClickCapture={handleCardClickCapture}
                  className="group grid grid-cols-[115px_1fr] sm:grid-cols-[170px_1fr] md:grid-cols-[190px_1fr] overflow-hidden w-full h-full select-none"
                >
                  <div className="relative w-full h-full min-h-[155px] sm:min-h-[190px] overflow-hidden bg-[#07090e] border-r border-white/10">
                    <Image 
                      src={assetUrl(game.cover_image)} 
                      alt={game.title} 
                      fill 
                      sizes="(max-width: 640px) 120px, 200px"
                      className="object-cover object-center transition duration-500 group-hover:scale-105" 
                    />
                  </div>
                  <div className="flex flex-col justify-between p-3 sm:p-4 md:p-5 flex-1 min-w-0">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/20 px-1.5 sm:px-2 py-0.5 rounded">
                          Limited deal
                        </span>
                        {discountPercent && (
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 sm:px-2 py-0.5 rounded">
                            -{discountPercent}%
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 sm:mt-2.5 truncate sm:line-clamp-2 font-black text-white text-sm sm:text-base md:text-lg group-hover:text-[#facc15] transition-colors">{game.title}</h3>
                      {resellerCalc ? (
                        <div className="mt-1.5 sm:mt-2.5 flex items-baseline gap-1.5 flex-wrap">
                          <strong className="text-base sm:text-2xl font-black text-[#facc15] font-mono">
                            {formatPrice(resellerCalc.price)}
                          </strong>
                          <span className="text-[10px] sm:text-xs text-[#8991a6]">
                            (Flash: {formatPrice(rawPrice)})
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1.5 sm:mt-2.5 flex items-baseline gap-1.5 flex-wrap">
                          {game.is_subscription && <span className="text-[10px] sm:text-xs text-[#8991a6] font-bold">From</span>}
                          <strong className="text-base sm:text-2xl font-black text-[#facc15]">{formatPrice(rawPrice)}</strong>
                          {game.original_price && game.original_price > rawPrice && (
                            <span className="text-[10px] sm:text-xs text-[#8991a6] line-through font-semibold">
                              {formatPrice(game.original_price)}
                            </span>
                          )}
                        </div>
                      )}
                      {game.is_subscription && (
                        <div className="mt-1 sm:mt-2 flex flex-wrap gap-1 text-[9px] sm:text-[10px]">
                          {gamePlatforms.includes("1 Month") && sale.sale_price ? <span className="rounded bg-white/[0.06] border border-white/10 px-1.5 py-0.5 font-bold text-white">1M: ₹{sale.sale_price}</span> : null}
                          {gamePlatforms.includes("2 Months") && sale.price_2m ? <span className="rounded bg-white/[0.06] border border-white/10 px-1.5 py-0.5 font-bold text-white">2M: ₹{sale.price_2m}</span> : null}
                          {gamePlatforms.includes("3 Months") && sale.price_3m ? <span className="rounded bg-[#facc15]/15 border border-[#facc15]/30 px-1.5 py-0.5 font-bold text-[#facc15]">3M: ₹{sale.price_3m}</span> : null}
                          {gamePlatforms.includes("6 Months") && sale.price_6m ? <span className="rounded bg-white/[0.06] border border-white/10 px-1.5 py-0.5 font-bold text-white">6M: ₹{sale.price_6m}</span> : null}
                          {gamePlatforms.includes("12 Months") && sale.price_12m ? <span className="rounded bg-white/[0.06] border border-white/10 px-1.5 py-0.5 font-bold text-white">12M: ₹{sale.price_12m}</span> : null}
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 sm:mt-4 flex items-center gap-1 sm:gap-1.5 w-full">
                      {timeBlocks.map(([value, label]) => (
                        <div key={String(label)} className="flex-1 rounded bg-[#0a0d14] py-1 px-0.5 sm:py-1.5 sm:px-1 text-center border border-white/10">
                          <b suppressHydrationWarning className="block text-[11px] sm:text-sm font-black text-white font-mono leading-tight">
                            {mounted ? String(value).padStart(2, "0") : "--"}
                          </b>
                          <small className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold text-[#8991a6] block leading-none mt-0.5">{label}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              </BorderGlow>
            </div>
          );
        })}
      </div>
    </section>
  );
}
