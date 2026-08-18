"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { assetUrl, formatPrice } from "@/lib/utils";
import type { Bundle } from "@/types/store";

export function BundleShelf({ bundles }: { bundles: Bundle[] }) {
  if (!bundles.length) return null;
  return (
    <section className="section-space w-full max-w-full overflow-hidden">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title font-semibold tracking-tight">Combo deals</h2>
          <p className="muted mt-1 text-sm">More games, better value in curated value bundles</p>
        </div>
        <Link href="/bundles" className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#facc15] hover:text-white transition-colors">
          View all bundles
        </Link>
      </div>
      <div
        className="hide-scrollbar grid w-full max-w-full auto-cols-[85%] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-proximity md:grid-flow-row md:grid-cols-2 md:overflow-visible"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
      >
        {bundles.map((bundle, index) => {
          const isSecond = index === 1;
          return (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.45,
                delay: index * 0.08,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className="snap-start will-change-transform transform-gpu"
            >
              <Link
                href={`/bundles/${bundle.id}`}
                className={`group grid min-h-64 overflow-hidden rounded-md border sm:grid-cols-[45%_1fr] transition duration-300 hover:-translate-y-1 bg-[#11131a] hover:bg-[#151922] ${
                  isSecond 
                    ? "border-white/[.08] hover:border-[#8b5cf6]/35 hover:shadow-[0_14px_38px_rgba(139,92,246,0.15)]" 
                    : "border-white/[.08] hover:border-[#facc15]/35 hover:shadow-[0_14px_38px_rgba(0,0,0,.42)]"
                }`}
              >
                <div className="relative min-h-48 overflow-hidden">
                  <Image
                    src={assetUrl(bundle.cover_image)}
                    alt={bundle.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-end p-6">
                  <span className="eyebrow">Bundle</span>
                  <h3 className="mt-3 text-2xl font-bold">{bundle.title}</h3>
                  <p className="muted mt-2 line-clamp-2 text-sm">{bundle.description}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <strong>{formatPrice(bundle.bundle_price)}</strong>
                    {bundle.original_price > bundle.bundle_price && (
                      <del className="text-sm text-[#727a90]">{formatPrice(bundle.original_price)}</del>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
