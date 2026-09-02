"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { assetUrl, formatPrice } from "@/lib/utils";
import type { Bundle } from "@/types/store";

export function BundleShelf({ bundles }: { bundles: Bundle[] }) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  if (!bundles.length) return null;
  return (
    <section className="section-space w-full max-w-full overflow-hidden">
      <div className="mb-3 sm:mb-5 flex items-end justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="section-title font-black tracking-tight text-white">Combo deals</h2>
          <p className="muted mt-0.5 sm:mt-1 text-xs sm:text-sm">More games, better value in curated value bundles</p>
        </div>
        <Link href="/bundles" className="flex shrink-0 items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-[#facc15] hover:text-white transition-colors">
          <span>View all bundles</span> <ArrowRight size={12} />
        </Link>
      </div>
      <div
        className="hide-scrollbar grid w-full max-w-full auto-cols-[86%] sm:auto-cols-[70%] grid-flow-col gap-3 sm:gap-4 overflow-x-auto md:grid-flow-row md:grid-cols-2 md:overflow-visible"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
      >
        {bundles.map((bundle, index) => {
          const isSecond = index === 1;
          const content = (
            <Link
              href={`/bundles/${bundle.id}`}
              className={`group grid min-h-52 sm:min-h-64 overflow-hidden rounded-xl border sm:grid-cols-[45%_1fr] transition duration-300 hover:-translate-y-1 bg-[#11131a] hover:bg-[#151922] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] ${
                isSecond 
                ? "border-white/[.08] hover:border-[#8b5cf6]/35 hover:shadow-[0_14px_38px_rgba(139,92,246,0.15)]" 
                : "border-white/[.08] hover:border-[#facc15]/35 hover:shadow-[0_14px_38px_rgba(0,0,0,.42)]"
              }`}
            >
              <div className="relative min-h-36 sm:min-h-48 overflow-hidden">
                <Image
                  src={assetUrl(bundle.cover_image)}
                  alt={bundle.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-end p-3.5 sm:p-6">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#b9a4ff]">Bundle</span>
                <h3 className="mt-1 sm:mt-2 text-base sm:text-2xl font-black text-white group-hover:text-[#facc15] transition-colors leading-snug">{bundle.title}</h3>
                <p className="muted mt-1 sm:mt-2 line-clamp-2 text-xs sm:text-sm text-[#8991a6]">{bundle.description}</p>
                <div className="mt-3 sm:mt-5 flex items-center gap-2.5 sm:gap-3">
                  <strong className="text-lg sm:text-xl font-black text-[#facc15]">{formatPrice(bundle.bundle_price)}</strong>
                  {bundle.original_price > bundle.bundle_price && (
                    <del className="text-xs sm:text-sm font-semibold text-[#727a90]">{formatPrice(bundle.original_price)}</del>
                  )}
                </div>
              </div>
            </Link>
          );

          if (isDesktop) {
            return (
              <motion.div
                key={bundle.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "120px" }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="min-w-0"
              >
                {content}
              </motion.div>
            );
          }

          return (
            <div key={bundle.id} className="min-w-0">
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
