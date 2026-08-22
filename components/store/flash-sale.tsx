"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { assetUrl, calculateResellerPrice, formatPrice, gameUrl } from "@/lib/utils";
import type { FlashSale } from "@/types/store";
import { BorderGlow } from "@/components/animations/border-glow";
import { useCartStore } from "@/stores/cart-store";

function remaining(end: string, now: number) {
  const distance = Math.max(0, new Date(end).getTime() - now);
  const d = Math.floor(distance / (1000 * 60 * 60 * 24));
  const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((distance % (1000 * 60)) / 1000);
  return { d, h, m, s };
}

export function FlashSaleBlock({ sales }: { sales: FlashSale[] }) {
  const [items, setItems] = useState(sales);
  const [now, setNow] = useState(Date.now());
  const [mounted, setMounted] = useState(false);

  const rawIsReseller = useCartStore((state) => state.isReseller);
  const resellerDiscount = useCartStore((state) => state.resellerDiscount);
  const resellerDiscountType = useCartStore((state) => state.resellerDiscountType);
  const isReseller = mounted && rawIsReseller;

  useEffect(() => {
    setMounted(true);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const supabase = createClient();
    const channel = supabase.channel("flash-sales-storefront").on("postgres_changes", { event: "UPDATE", schema: "public", table: "flash_sales" }, (payload: { new: Record<string, unknown> }) => {
      const update = payload.new as Partial<FlashSale> & { id: number };
      setItems((current) => current.map((item) => item.id === update.id ? { ...item, ...update } : item));
    }).on("postgres_changes", { event: "DELETE", schema: "public", table: "flash_sales" }, (payload: { old: Record<string, unknown> }) => {
      const removed = payload.old as { id?: number };
      setItems((current) => current.filter((item) => item.id !== removed.id));
    }).subscribe();
    return () => { window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, []);

  const active = useMemo(() => items.filter((sale) => sale.active && (!mounted || (new Date(sale.starts_at).getTime() <= now && new Date(sale.ends_at).getTime() > now))), [items, now, mounted]);
  if (!active.length) return null;

  return (
    <section className="section-space">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Ends soon</p>
          <h2 className="section-title mt-2">Flash sale</h2>
        </div>
        <span className="flex items-center gap-2 text-sm font-bold text-[#facc15]">
          <Clock3 size={17} /> Prices expire automatically
        </span>
      </div>
      <div
        className="touch-row hide-scrollbar grid auto-cols-[82%] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-proximity md:auto-cols-[46%] xl:auto-cols-[31%]"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
      >
        {active.map((sale) => {
          const timer = mounted ? remaining(sale.ends_at, now) : { d: 0, h: 0, m: 0, s: 0 };
          const game = sale.games;
          if (!game) return null;

          const activeDurationPrices = [sale.sale_price, sale.price_2m, sale.price_3m, sale.price_6m, sale.price_12m]
            .map(Number)
            .filter((p) => p > 0);
          const rawPrice = activeDurationPrices.length > 0 ? activeDurationPrices[0] : Number(sale.sale_price || 0);
          const isMarkup = resellerDiscountType === "markup_flat" || resellerDiscountType === "markup_percentage";
          const resellerCalc =
            isReseller && isMarkup && resellerDiscount > 0
              ? calculateResellerPrice(rawPrice, resellerDiscount, resellerDiscountType)
              : null;

          const timeBlocks = timer.d > 0
            ? [[timer.d, "D"], [timer.h, "H"], [timer.m, "M"], [timer.s, "S"]]
            : [[timer.h, "H"], [timer.m, "M"], [timer.s, "S"]];

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
                <Link href={gameUrl(game)} className="group grid min-h-56 grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] overflow-hidden w-full h-full">
                  <div className="relative w-full h-full min-h-[190px] overflow-hidden bg-[#07090e] border-r border-white/10 flex items-center justify-center">
                    <Image 
                      src={assetUrl(game.cover_image)} 
                      alt={game.title} 
                      fill 
                      sizes="(max-width: 640px) 140px, 180px"
                      className="object-cover object-center transition duration-500 group-hover:scale-105" 
                    />
                  </div>
                  <div className="flex flex-col justify-center p-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#facc15]">
                        Limited deal
                      </span>
                      {game.is_subscription ? (
                        <span className="text-[10px] font-bold text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/25 px-1.5 py-0.5 rounded">
                          Subscription Pass
                        </span>
                      ) : game.duration ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded">
                          {game.duration}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-2 line-clamp-2 font-black text-white group-hover:text-[#facc15] transition-colors">{game.title}</h3>
                    {resellerCalc ? (
                      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                        <strong className="text-2xl font-black text-[#facc15] font-mono">
                          {formatPrice(resellerCalc.price)}
                        </strong>
                        <span className="text-xs text-[#8991a6]">
                          (Flash: {formatPrice(rawPrice)})
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-baseline gap-1.5">
                        {game.is_subscription && <span className="text-xs text-[#8991a6] font-bold">From</span>}
                        <strong className="text-2xl font-black text-[#facc15]">{formatPrice(rawPrice)}</strong>
                      </div>
                    )}
                    {game.is_subscription && (
                      <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                        {sale.sale_price ? <span className="rounded bg-black/50 border border-white/10 px-1.5 py-0.5 font-bold text-white">1M: ₹{sale.sale_price}</span> : null}
                        {sale.price_2m ? <span className="rounded bg-black/50 border border-white/10 px-1.5 py-0.5 font-bold text-white">2M: ₹{sale.price_2m}</span> : null}
                        {sale.price_3m ? <span className="rounded bg-[#facc15]/15 border border-[#facc15]/30 px-1.5 py-0.5 font-bold text-[#facc15]">3M: ₹{sale.price_3m}</span> : null}
                        {sale.price_6m ? <span className="rounded bg-black/50 border border-white/10 px-1.5 py-0.5 font-bold text-white">6M: ₹{sale.price_6m}</span> : null}
                        {sale.price_12m ? <span className="rounded bg-black/50 border border-white/10 px-1.5 py-0.5 font-bold text-white">12M: ₹{sale.price_12m}</span> : null}
                      </div>
                    )}
                    <div className="mt-4 flex gap-1.5 flex-wrap">
                      {timeBlocks.map(([value, label]) => (
                        <span key={String(label)} className="min-w-10 rounded bg-black/35 px-2 py-2 text-center text-xs border border-white/5">
                          <b className="block text-white">
                            {mounted ? String(value).padStart(2, "0") : "--"}
                          </b>
                          <small className="text-[#7f879d]">{label}</small>
                        </span>
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
