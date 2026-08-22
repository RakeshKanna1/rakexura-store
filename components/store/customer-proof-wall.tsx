"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ArrowRight, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { A11y, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { assetUrl } from "@/lib/utils";
import type { CustomerProof } from "@/types/store";

export function CustomerProofWall({ proofs }: { proofs: CustomerProof[] }) {
  const [mounted, setMounted] = useState(false);
  const [selectedProofIndex, setSelectedProofIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!proofs.length) return null;

  const currentSelectedProof = selectedProofIndex !== null ? proofs[selectedProofIndex] : null;

  return (
    <section className="section-space">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Real customer proof</p>
          <h2 className="section-title mt-2">Trusted by real gamers</h2>
          <p className="section-copy">Real purchase screenshots & delivery receipts from verified Rakexura customers.</p>
        </div>
        <Link
          href="/proofs"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#facc15] hover:text-[#ffe45c] transition-colors"
        >
          <span>View all delivery proofs</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {!mounted ? (
        <div className="w-full h-[240px] bg-[#11131a] rounded-md border border-white/[0.08] animate-pulse flex items-center justify-center">
          <span className="text-neutral-700 text-xs font-bold uppercase tracking-widest">Loading Customer Proofs...</span>
        </div>
      ) : (
        <Swiper
          modules={[A11y, Autoplay]}
          autoplay={{ delay: 2600, disableOnInteraction: false, pauseOnMouseEnter: true }}
          loop={proofs.length > 4}
          observer={true}
          observeParents={true}
          speed={650}
          spaceBetween={14}
          slidesPerView={1.35}
          breakpoints={{
            520: { slidesPerView: 2.2 },
            820: { slidesPerView: 3.2 },
            1180: { slidesPerView: 4.2 }
          }}
        >
          {proofs.map((proof, idx) => (
            <SwiperSlide key={proof.id} className="h-auto">
              <article
                onClick={() => setSelectedProofIndex(idx)}
                className="group cursor-pointer h-full overflow-hidden rounded-md border border-white/[.08] bg-[#11131a] transition-all hover:border-[#facc15]/40 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-black/50">
                  <Image
                    src={assetUrl(proof.image_url)}
                    alt={proof.caption || "Verified Rakexura customer proof"}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 text-white font-bold text-xs border border-white/20 backdrop-blur-md">
                      <ZoomIn size={14} className="text-[#facc15]" />
                      Expand Proof
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3.5">
                  <BadgeCheck size={16} className="mt-0.5 shrink-0 text-[#00d68f]" />
                  <div className="min-w-0">
                    <strong className="block text-xs font-bold text-white truncate">Verified Proof</strong>
                    {proof.caption && (
                      <p className="mt-0.5 line-clamp-1 text-[11px] leading-tight text-[#8991a6]">
                        {proof.caption}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* Interactive Fullscreen Proof Lightbox Modal */}
      {currentSelectedProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedProofIndex(null)}
        >
          <div
            className="relative flex max-h-[92vh] max-w-2xl flex-col overflow-hidden rounded-xl border border-white/15 bg-[#0e111a] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-black/40">
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

            {/* Image display */}
            <div className="relative flex items-center justify-center bg-black/80 p-2 min-h-[300px] max-h-[70vh] overflow-auto">
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
              <div className="border-t border-white/10 px-5 py-3 bg-black/30 text-xs text-[#c8cedc] font-medium">
                {currentSelectedProof.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
