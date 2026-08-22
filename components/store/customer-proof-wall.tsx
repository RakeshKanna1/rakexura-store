"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ArrowRight, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { assetUrl } from "@/lib/utils";
import type { CustomerProof } from "@/types/store";

export function CustomerProofWall({ proofs }: { proofs: CustomerProof[] }) {
  const [selectedProofIndex, setSelectedProofIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Smooth continuous auto-scrolling loop animation
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || isPaused || selectedProofIndex !== null) return;
    let animationFrameId: number;
    const speed = 0.6; // smooth pixels per frame

    const step = () => {
      if (el) {
        el.scrollLeft += speed;
        // Loop back seamlessly once reached near end
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
          el.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, selectedProofIndex]);

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
    <section 
      className="section-space"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Real customer proof</p>
          <h2 className="section-title mt-2">Verified delivery proofs</h2>
          <p className="section-copy">Real purchase screenshots & WhatsApp delivery receipts from verified Rakexura customers.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Scroll arrow controls */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="grid h-8 w-8 place-items-center rounded border border-white/10 bg-white/[0.03] text-[#8991a6] hover:text-white hover:border-[#facc15]/40 transition"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="grid h-8 w-8 place-items-center rounded border border-white/10 bg-white/[0.03] text-[#8991a6] hover:text-white hover:border-[#facc15]/40 transition"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <Link
            href="/proofs"
            className="flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#facc15] hover:text-white transition-colors"
          >
            <span>View all proofs</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Smooth Horizontal Scrolling Carousel */}
      <div
        ref={scrollContainerRef}
        className="hide-scrollbar grid w-full max-w-full auto-cols-[190px] grid-flow-col gap-4 overflow-x-auto pb-3 overscroll-x-contain sm:auto-cols-[220px] md:auto-cols-[240px] scroll-smooth snap-x snap-proximity"
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",
        }}
      >
        {proofs.map((proof, idx) => (
          <article
            key={proof.id}
            onClick={() => setSelectedProofIndex(idx)}
            className="group cursor-pointer snap-start flex flex-col overflow-hidden rounded-md border border-white/[.08] bg-[#11131a] transition-all hover:border-[#facc15]/40 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
          >
            {/* Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden bg-black/60">
              <Image
                src={assetUrl(proof.image_url)}
                alt={proof.caption || "Verified customer proof"}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />

              {/* Hover Zoom Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/85 text-white font-bold text-xs border border-white/20 backdrop-blur-md">
                  <ZoomIn size={13} className="text-[#facc15]" />
                  <span>View Full</span>
                </span>
              </div>
            </div>

            {/* Card Footer Details */}
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div className="flex items-start gap-2">
                <BadgeCheck size={16} className="mt-0.5 shrink-0 text-[#00d68f]" />
                <div className="min-w-0 flex-1">
                  <strong className="block text-xs font-bold text-white truncate">
                    {proof.caption || "Verified Proof"}
                  </strong>
                  <p className="mt-0.5 line-clamp-1 text-[11px] leading-tight text-[#8991a6]">
                    WhatsApp Delivery
                  </p>
                </div>
              </div>
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
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-black/50">
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} className="text-[#00d68f]" />
                <div>
                  <span className="text-sm font-bold text-white block">Verified Customer Delivery Proof</span>
                  <span className="text-[11px] text-[#8991a6]">
                    Photo {(selectedProofIndex ?? 0) + 1} of {proofs.length}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProofIndex(null)}
                className="rounded-full p-1 text-[#8991a6] hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Display Image */}
            <div className="relative flex items-center justify-center bg-black/90 p-2 min-h-[300px] max-h-[70vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(currentSelectedProof.image_url)}
                alt={currentSelectedProof.caption || "Customer proof screenshot"}
                className="max-h-[68vh] w-auto object-contain rounded"
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/70 p-2 text-white hover:bg-black transition"
                    aria-label="Previous proof"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProofIndex((prev) => (prev !== null && prev < proofs.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/70 p-2 text-white hover:bg-black transition"
                    aria-label="Next proof"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Footer Caption */}
            {currentSelectedProof.caption && (
              <div className="border-t border-white/10 px-5 py-3 bg-black/40 text-xs text-[#d8dce7] leading-relaxed">
                {currentSelectedProof.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
