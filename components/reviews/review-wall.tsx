"use client";

import { BadgeCheck, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import type { Review } from "@/types/store";

export function ReviewWall({ reviews }: { reviews: Review[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!reviews.length) return null;

  if (!mounted) {
    return (
      <section className="section-space">
        <p className="eyebrow mb-3">Verified feedback</p>
        <h2 className="section-title mb-7">What customers are saying</h2>
        <div className="w-full h-[180px] bg-[#11131a] rounded-md border border-white/[0.08] animate-pulse flex items-center justify-center">
          <span className="text-neutral-700 text-xs font-bold uppercase tracking-widest">Loading Reviews...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="section-space">
      <p className="eyebrow mb-1.5 sm:mb-3">Verified feedback</p>
      <h2 className="section-title mb-4 sm:mb-7">What customers are saying</h2>
      <Swiper modules={[A11y]} observer={true} observeParents={true} spaceBetween={12} slidesPerView={1.15} breakpoints={{ 640: { spaceBetween: 16, slidesPerView: 2.1 }, 1024: { spaceBetween: 16, slidesPerView: 3.1 } }}>
        {reviews.slice(0, 10).map((review) => (
          <SwiperSlide key={review.id} className="h-auto">
            <article className="premium-panel h-full rounded-xl p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="mb-3 sm:mb-5 flex items-center justify-between">
                  <div className="flex gap-1 text-[#ffb800]">{Array.from({ length: review.rating }, (_, index) => <Star key={index} size={14} fill="currentColor" />)}</div>
                  {review.verified_purchase !== false && <BadgeCheck size={16} className="text-[#00d68f]" aria-label="Verified purchase" />}
                </div>
                <blockquote className="min-h-14 sm:min-h-20 text-xs sm:text-sm leading-relaxed text-[#d8dce7]">&ldquo;{review.message?.replace(/^["'“”\s]+|["'“”\s]+$/g, "")}&rdquo;</blockquote>
              </div>
              <div className="mt-3 sm:mt-5 border-t border-white/[.07] pt-2.5 sm:pt-4">
                <strong className="text-xs sm:text-sm text-white block">{review.customer_name}</strong>
                <p className="mt-0.5 text-[11px] sm:text-xs text-[#7f879d] truncate">{review.games?.title || "Verified Rakexura customer"}</p>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
