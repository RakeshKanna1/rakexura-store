"use client";

import Image from "next/image";
import { BadgeCheck, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { assetUrl } from "@/lib/utils";
import type { CustomerProof } from "@/types/store";

export function ProofsGallery({ proofs }: { proofs: CustomerProof[] }) {
  const [selectedProofIndex, setSelectedProofIndex] = useState<number | null>(null);

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

  if (!proofs.length) {
    return (
      <div className="rounded-xl border border-white/[.08] bg-[#0b0f19] p-12 text-center text-[#8991a6]">
        <p className="text-base font-bold text-white">No delivery proofs published yet.</p>
        <p className="mt-1 text-xs">Verified customer purchase screenshots will appear here once approved.</p>
      </div>
    );
  }

  const currentSelectedProof = selectedProofIndex !== null ? proofs[selectedProofIndex] : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {proofs.map((proof, idx) => (
          <article
            key={proof.id}
            onClick={() => setSelectedProofIndex(idx)}
            className="group cursor-pointer overflow-hidden rounded-xl border border-white/[.08] bg-[#0b0f19] transition-all duration-300 hover:border-[#facc15]/40 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-black/60">
              <Image
                src={assetUrl(proof.image_url)}
                alt={proof.caption || "Customer delivery proof"}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/85 text-white font-bold text-xs border border-white/20 backdrop-blur-md">
                  <ZoomIn size={14} className="text-[#facc15]" />
                  View Full
                </span>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1.5">
                <BadgeCheck size={15} className="shrink-0 text-[#00d68f]" />
                <span className="text-xs font-bold text-white truncate">Verified Proof</span>
              </div>
              {proof.caption && (
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#8991a6]">
                  {proof.caption}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Fullscreen Modal Lightbox */}
      {currentSelectedProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedProofIndex(null)}
        >
          <div
            className="relative flex max-h-[92vh] max-w-3xl flex-col overflow-hidden rounded-xl border border-white/15 bg-[#0e111a] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-black/50">
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} className="text-[#00d68f]" />
                <span className="text-sm font-bold text-white">Verified Customer Delivery Proof</span>
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
            <div className="relative flex items-center justify-center bg-black/90 p-2 min-h-[300px] max-h-[72vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(currentSelectedProof.image_url)}
                alt={currentSelectedProof.caption || "Customer proof screenshot"}
                className="max-h-[70vh] w-auto object-contain rounded"
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
                    aria-label="Previous"
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
                    aria-label="Next"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            {currentSelectedProof.caption && (
              <div className="border-t border-white/10 px-5 py-3 bg-black/40 text-xs text-[#c8cedc] font-medium">
                {currentSelectedProof.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
