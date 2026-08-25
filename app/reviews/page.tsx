import Link from "next/link";
import { Star, BadgeCheck, ImageIcon } from "lucide-react";
import { getReviews } from "@/lib/supabase/queries";
import { BackButton } from "@/components/layout/back-button";
import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Customer Reviews | Rakexura",
  description: "Verified customer reviews and feedback for Rakexura Store games and delivery."
};

export default async function ReviewsPage() {
  const reviews = await getReviews(30);
  return (
    <div className="page-shell py-10">
      <BackButton href="/" label="Back to Store" className="mb-4" />
      <header className="mb-10 max-w-3xl">
        <div className="flex items-center gap-2 mb-3">
          <p className="eyebrow">Verified feedback</p>
          <span className="text-[#8991a6]">•</span>
          <Link
            href="/proofs"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[#facc15] hover:text-[#ffe45c] text-xs font-bold border border-white/10 transition"
          >
            <ImageIcon size={13} />
            View Delivery Proofs Gallery
          </Link>
        </div>
        <h1 className="mb-4 text-4xl font-black sm:text-6xl text-white">Customer Reviews.</h1>
        <p className="section-copy">Read genuine experiences from gamers who purchased digital games and subscriptions from Rakexura.</p>
      </header>

      <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
        {reviews.map((review) => (
          <article key={review.id} className="mb-4 break-inside-avoid rounded-xl border border-white/[.08] bg-[#0b0f19] p-6 transition-all hover:border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex gap-1 text-[#facc15]">
                {Array.from({ length: review.rating }).map((_, index) => (
                  <Star key={index} size={14} fill="currentColor" />
                ))}
              </div>
              {review.verified_purchase !== false && (
                <BadgeCheck size={16} className="text-[#00d68f]" aria-label="Verified purchase" />
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#d3d7e3]">&ldquo;{review.message?.replace(/^["'“”\s]+|["'“”\s]+$/g, "")}&rdquo;</p>
            <div className="mt-5 border-t border-white/[.07] pt-3 flex items-center justify-between">
              <strong className="text-sm text-white">{review.customer_name}</strong>
              <span className="text-xs text-[#8991a6]">{review.games?.title || "Verified Player"}</span>
            </div>
          </article>
        ))}
        {!reviews.length && (
          <p className="text-[#a0a8c0] col-span-full">Approved customer reviews will appear here.</p>
        )}
      </div>
    </div>
  );
}
