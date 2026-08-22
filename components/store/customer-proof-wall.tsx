"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ArrowRight, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { assetUrl } from "@/lib/utils";
import type { CustomerProof } from "@/types/store";

export function CustomerProofWall({ proofs }: { proofs: CustomerProof[] }) {
  const [selectedProofIndex, setSelectedProofIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedProofIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedProofIndex(null);
      if (e.key === "ArrowLeft") setSelectedProofIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : proofs.length - 1));
      if (e.key === "ArrowRight") setSelectedProofIndex((prev) => (prev !== null && prev < proofs.length - 1 ? prev + 1 : 0));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProofIndex, proofs.length]);

  if (!proofs || proofs.length === 0) return null;

  const currentSelectedProof = selectedProofIndex !== null ? proofs[selectedProofIndex] : null;

  // Duplicate items for true seamless infinite continuous loop
  const displayProofs = proofs.length < 8 ? [...proofs, ...proofs, ...proofs] : [...proofs, ...proofs];

  return (
    <section className="section-space">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Real customer proof</p>
          <h2 className="section-title mt-2">Verified delivery proofs</h2>
          <p className="section-copy">Real purchase screenshots & WhatsApp delivery receipts from verified Rakexura customers.</p>
        </div>

        <Link
          href="/proofs"
          className="flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#facc15] hover:text-white transition-colors"
        >
          <span>View all proofs</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Seamless Infinite Marquee Track with Fade Edges */}
      <div 
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        className="proof-marquee-container relative w-full max-w-full overflow-hidden py-1"
        style={{ touchAction: "pan-x pan-y" }}
      >
        {/* Soft edge gradients */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 z-10 bg-gradient-to-r from-black via-black/50 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 z-10 bg-gradient-to-l from-black via-black/50 to-transparent" />

        <div className="proof-marquee-track flex gap-4" style={{ touchAction: "pan-x pan-y" }}>
          {displayProofs.map((proof, idx) => (
            <article
              key={`${proof.id}-${idx}`}
              onClick={() => setSelectedProofIndex(idx % proofs.length)}
              className="group cursor-pointer w-[190px] sm:w-[220px] md:w-[240px] shrink-0 flex flex-col overflow-hidden rounded-md border border-white/[.08] bg-[#11131a] transition-all hover:border-[#facc15]/40 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
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
                    <p className="mt-0.5 line-clamp-1 text-[11px] leading-tight text-[#8991a8]">
                      WhatsApp Delivery
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Interactive Fullscreen Proof Lightbox Modal - Portaled to document.body */}
      {mounted && currentSelectedProof && createPortal(
        <div
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setSelectedProofIndex(null)}
        >
          <div
            className="relative flex max-h-[92vh] max-w-4xl w-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0e111a] shadow-[0_25px_70px_rgba(0,0,0,0.95)] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-black/60 shrink-0">
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} className="text-[#00d68f]" />
                <div>
                  <span className="text-sm font-bold text-white block">Verified Customer Delivery Proof</span>
                  <span className="text-[11px] text-[#8991a8]">
                    Photo {(selectedProofIndex ?? 0) + 1} of {proofs.length}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProofIndex(null)}
                className="rounded-full p-1.5 text-[#8991a6] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Display Image */}
            <div className="relative flex flex-1 items-center justify-center bg-black/95 p-3 min-h-[300px] max-h-[68vh] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(currentSelectedProof.image_url)}
                alt={currentSelectedProof.caption || "Customer proof screenshot"}
                className="max-h-[64vh] w-auto max-w-full object-contain rounded select-none"
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/75 p-2 text-white hover:bg-black hover:scale-110 active:scale-95 transition cursor-pointer"
                    aria-label="Previous proof"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProofIndex((prev) => (prev !== null && prev < proofs.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/75 p-2 text-white hover:bg-black hover:scale-110 active:scale-95 transition cursor-pointer"
                    aria-label="Next proof"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Footer Caption */}
            {currentSelectedProof.caption && (
              <div className="border-t border-white/10 px-5 py-3 bg-black/50 text-xs text-[#d8dce7] leading-relaxed shrink-0">
                {currentSelectedProof.caption}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
