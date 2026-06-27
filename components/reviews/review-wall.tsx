"use client";

import { BadgeCheck, Star } from "lucide-react";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import type { Review } from "@/types/store";

export function ReviewWall({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;
  return (
    <section className="section-space">
      <p className="eyebrow mb-3">Verified feedback</p>
      <h2 className="section-title mb-7">What customers are saying</h2>
      <Swiper modules={[A11y]} spaceBetween={16} slidesPerView={1.08} breakpoints={{ 640: { slidesPerView: 2.1 }, 1024: { slidesPerView: 3.1 } }}>
        {reviews.slice(0, 10).map((review) => (
          <SwiperSlide key={review.id} className="h-auto">
            <article className="premium-panel h-full rounded-md p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex gap-1 text-[#ffb800]">{Array.from({ length: review.rating }, (_, index) => <Star key={index} size={15} fill="currentColor" />)}</div>
                {review.verified_purchase !== false && <BadgeCheck size={18} className="text-[#00d68f]" aria-label="Verified purchase" />}
              </div>
              <blockquote className="min-h-20 text-sm leading-6 text-[#d8dce7]">&ldquo;{review.message}&rdquo;</blockquote>
              <div className="mt-5 border-t border-white/[.07] pt-4">
                <strong className="text-sm">{review.customer_name}</strong>
                <p className="mt-1 text-xs text-[#7f879d]">{review.games?.title || "Verified Rakexura customer"}</p>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
