"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ArrowRight, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { assetUrl } from "@/lib/utils";
import type { CustomerProof } from "@/types/store";

export function CustomerProofWall({ proofs }: { proofs: CustomerProof[] }) {
  const [selectedProofIndex, setSelectedProofIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedProofIndex === null) return;
      if (e.key === "Escape") setSelectedProofIndex(null);
      if (e.key === "ArrowLeft") setSelectedProofIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : proofs.length - 1));
      if (e.key === "ArrowRight") setSelectedProofIndex((prev) => (prev !== null && prev < proofs.length - 1 ? prev + 1 : 0));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProofIndex, proofs.length]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const amount = scrollContainerRef.current.clientWidth * 0.75;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth"
    });
  };

  if (!proofs || proofs.length === 0) return null;

  const currentSelectedProof = selectedProofIndex !== null ? proofs[selectedProofIndex] : null;

  return (
    <section className="section-space">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00d68f]/10 text-[#00d68f] text-[10px] font-black uppercase tracking-wider border border-[#00d68f]/20 mb-2.5">
            <BadgeCheck size={13} />
            Verified Delivery Proofs
          </span>
          <h2 className="section-title">Real Customer Proofs & Receipts</h2>
          <p className="section-copy mt-1.5">WhatsApp delivery screenshots & order completion photos from verified buyers.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Scroll arrow buttons */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-[#11131a] text-[#8991a6] hover:text-white hover:border-[#facc15]/40 transition"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-[#11131a] text-[#8991a6] hover:text-white hover:border-[#facc15]/40 transition"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <Link
            href="/proofs"
            className="inline-flex items-center gap-2 rounded-lg bg-[#facc15] px-4 py-2.5 text-xs font-black text-black transition-all duration-300 hover:bg-[#ffe45c] hover:shadow-[0_0_24px_rgba(250,204,21,0.35)] hover:-translate-y-0.5"
          >
            <span>View All Delivery Proofs ({proofs.length})</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Smooth Horizontal Scrolling Carousel */}
      <div
        ref={scrollContainerRef}
        className="hide-scrollbar grid w-full max-w-full auto-cols-[180px] grid-flow-col gap-4 overflow-x-auto pb-3 overscroll-x-contain sm:auto-cols-[220px] md:auto-cols-[250px] scroll-smooth snap-x snap-mandatory"
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",
        }}
      >
        {proofs.map((proof, idx) => (
          <article
            key={proof.id}
            onClick={() => setSelectedProofIndex(idx)}
            className="group cursor-pointer snap-start overflow-hidden rounded-xl border border-white/[.08] bg-[#11131a] transition-all duration-300 hover:border-[#facc15]/50 hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-black/60">
              <Image
                src={assetUrl(proof.image_url)}
                alt={proof.caption || "Verified customer proof"}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/85 text-white font-bold text-xs border border-white/20 backdrop-blur-md">
                  <ZoomIn size={14} className="text-[#facc15]" />
                  View Full
                </span>
              </div>
            </div>
            <div className="p-3.5">
              <div className="flex items-center gap-1.5">
                <BadgeCheck size={15} className="shrink-0 text-[#00d68f]" />
                <span className="text-xs font-bold text-white truncate">Verified Proof</span>
              </div>
              {proof.caption && (
                <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-[#8991a6]">
                  {proof.caption}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Interactive Fullscreen Proof Lightbox Modal */}
      {currentSelectedProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedProofIndex(null)}
        >
          <div
            className="relative flex max-h-[94vh] max-w-4xl w-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0e111a] shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-black/60">
              <div className="flex items-center gap-2.5">
                <BadgeCheck size={19} className="text-[#00d68f]" />
                <div>
                  <span className="text-sm font-black text-white block">Verified Customer Delivery Proof</span>
                  <span className="text-[11px] text-[#8991a6]">
                    Photo {(selectedProofIndex ?? 0) + 1} of {proofs.length}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProofIndex(null)}
                className="rounded-lg p-1.5 text-[#8991a6] hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Display Image */}
            <div className="relative flex items-center justify-center bg-black/95 p-3 min-h-[320px] max-h-[72vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(currentSelectedProof.image_url)}
                alt={currentSelectedProof.caption || "Customer proof screenshot"}
                className="max-h-[68vh] w-auto object-contain rounded-lg shadow-lg"
              />

              {/* Prev / Next controls */}
              {proofs.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProofIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : proofs.length - 1));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/80 p-2.5 text-white hover:bg-[#facc15] hover:text-black hover:border-[#facc15] transition-all shadow-xl"
                    aria-label="Previous"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProofIndex((prev) => (prev !== null && prev < proofs.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/80 p-2.5 text-white hover:bg-[#facc15] hover:text-black hover:border-[#facc15] transition-all shadow-xl"
                    aria-label="Next"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Footer Caption */}
            {currentSelectedProof.caption && (
              <div className="border-t border-white/10 px-5 py-3.5 bg-black/50 text-xs text-[#c8cedc] font-medium">
                {currentSelectedProof.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
