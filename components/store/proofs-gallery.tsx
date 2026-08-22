"use client";

import Image from "next/image";
import { BadgeCheck, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { assetUrl } from "@/lib/utils";
import type { CustomerProof } from "@/types/store";

export function ProofsGallery({ proofs }: { proofs: CustomerProof[] }) {
  const [selectedProofIndex, setSelectedProofIndex] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "whatsapp" | "payment">("all");

  const filteredProofs = proofs.filter((p) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "whatsapp") return p.proof_type === "whatsapp" || !p.proof_type;
    return p.proof_type === activeFilter;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedProofIndex === null) return;
      if (e.key === "Escape") setSelectedProofIndex(null);
      if (e.key === "ArrowLeft") setSelectedProofIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredProofs.length - 1));
      if (e.key === "ArrowRight") setSelectedProofIndex((prev) => (prev !== null && prev < filteredProofs.length - 1 ? prev + 1 : 0));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProofIndex, filteredProofs.length]);

  if (!proofs.length) {
    return (
      <div className="rounded-xl border border-white/[.08] bg-[#11131a] p-12 text-center text-[#8991a6]">
        <p className="text-base font-bold text-white">No delivery proofs published yet.</p>
        <p className="mt-1 text-xs">Verified customer purchase screenshots will appear here once published from admin media.</p>
      </div>
    );
  }

  const currentSelectedProof = selectedProofIndex !== null ? filteredProofs[selectedProofIndex] : null;

  return (
    <>
      {/* Filter Tabs & Stats */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => { setActiveFilter("all"); setSelectedProofIndex(null); }}
            className={`rounded px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeFilter === "all"
                ? "bg-[#facc15] text-black shadow-[0_0_16px_rgba(250,204,21,0.2)]"
                : "bg-white/[0.04] text-[#8991a6] hover:text-white hover:bg-white/10 border border-white/10"
            }`}
          >
            All Proofs ({proofs.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveFilter("whatsapp"); setSelectedProofIndex(null); }}
            className={`rounded px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeFilter === "whatsapp"
                ? "bg-[#facc15] text-black shadow-[0_0_16px_rgba(250,204,21,0.2)]"
                : "bg-white/[0.04] text-[#8991a6] hover:text-white hover:bg-white/10 border border-white/10"
            }`}
          >
            WhatsApp Deliveries ({proofs.filter(p => p.proof_type === "whatsapp" || !p.proof_type).length})
          </button>
        </div>

        <span className="text-xs font-mono font-bold text-[#8991a6]">
          Showing <b className="text-white">{filteredProofs.length}</b> verified screenshots
        </span>
      </div>

      {/* Grid of Delivery Proofs */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filteredProofs.map((proof, idx) => (
          <article
            key={proof.id}
            onClick={() => setSelectedProofIndex(idx)}
            className="group cursor-pointer overflow-hidden rounded-md border border-white/[.08] bg-[#11131a] transition-all hover:border-[#facc15]/40 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
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
                  <ZoomIn size={13} className="text-[#facc15]" />
                  <span>View Full</span>
                </span>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1.5">
                <BadgeCheck size={15} className="shrink-0 text-[#00d68f]" />
                <span className="text-xs font-bold text-white truncate">{proof.caption || "Verified Proof"}</span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[#8991a6]">
                WhatsApp Delivery
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* Fullscreen Modal Lightbox */}
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
                    Photo {(selectedProofIndex ?? 0) + 1} of {filteredProofs.length}
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
              {filteredProofs.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProofIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredProofs.length - 1));
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
                      setSelectedProofIndex((prev) => (prev !== null && prev < filteredProofs.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/70 p-2 text-white hover:bg-black transition"
                    aria-label="Next"
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
    </>
  );
}
