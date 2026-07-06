"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { assetUrl, formatPrice } from "@/lib/utils";
import type { FlashSale } from "@/types/store";

function remaining(end: string, now: number) {
  const distance = Math.max(0, new Date(end).getTime() - now);
  return { h: Math.floor(distance / 3_600_000), m: Math.floor((distance / 60_000) % 60), s: Math.floor((distance / 1000) % 60) };
}

export function FlashSaleBlock({ sales }: { sales: FlashSale[] }) {
  const [items, setItems] = useState(sales);
  const [now, setNow] = useState(Date.now());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const supabase = createClient();
    const channel = supabase.channel("flash-sales-storefront").on("postgres_changes", { event: "UPDATE", schema: "public", table: "flash_sales" }, (payload) => {
      const update = payload.new as Partial<FlashSale> & { id: number };
      setItems((current) => current.map((item) => item.id === update.id ? { ...item, ...update } : item));
    }).on("postgres_changes", { event: "DELETE", schema: "public", table: "flash_sales" }, (payload) => {
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
        <span className="flex items-center gap-2 text-sm text-[#ffca55]"><Clock3 size={17} /> Prices expire automatically</span>
      </div>
      <div className="touch-row hide-scrollbar grid auto-cols-[82%] grid-flow-col gap-4 overflow-x-auto md:auto-cols-[46%] xl:auto-cols-[31%]">
        {active.map((sale) => {
          const timer = mounted ? remaining(sale.ends_at, now) : { h: 0, m: 0, s: 0 };
          const game = sale.games;
          if (!game) return null;
          return (
            <Link href={`/games/${game.id}`} key={sale.id} className="premium-panel group grid min-h-56 grid-cols-[40%_1fr] overflow-hidden rounded-md">
              <div className="relative">
                <Image src={assetUrl(game.cover_image)} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-col justify-center p-5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#ffca55]">Limited deal</span>
                <h3 className="mt-2 line-clamp-2 font-black">{game.title}</h3>
                <strong className="mt-4 text-2xl">{formatPrice(sale.sale_price)}</strong>
                <div className="mt-4 flex gap-1.5">
                  {[[timer.h, "H"], [timer.m, "M"], [timer.s, "S"]].map(([value, label]) => (
                    <span key={label} className="min-w-11 rounded bg-black/35 px-2 py-2 text-center text-xs">
                      <b className="block text-white">
                        {mounted ? String(value).padStart(2, "0") : "--"}
                      </b>
                      <small className="text-[#7f879d]">{label}</small>
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
