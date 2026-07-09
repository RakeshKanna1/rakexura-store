"use client";

import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { A11y, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { assetUrl } from "@/lib/utils";
import type { CustomerProof } from "@/types/store";

export function CustomerProofWall({ proofs }: { proofs: CustomerProof[] }) {
  if (!proofs.length) return null;
  return <section className="section-space"><div className="mb-7 max-w-2xl"><p className="eyebrow">Real customer proof</p><h2 className="section-title mt-2">Trusted by real gamers</h2><p className="section-copy">Real purchase screenshots from Rakexura customers. Personal details are hidden before publishing.</p></div><Swiper modules={[A11y, Autoplay]} autoplay={{ delay: 2400, disableOnInteraction: false, pauseOnMouseEnter: true }} loop={proofs.length > 4} observer={true} observeParents={true} speed={650} spaceBetween={14} slidesPerView={1.35} breakpoints={{ 520: { slidesPerView: 2.2 }, 820: { slidesPerView: 3.2 }, 1180: { slidesPerView: 4.2 } }}>{proofs.map((proof) => <SwiperSlide key={proof.id} className="h-auto"><article className="h-full overflow-hidden rounded-md border border-white/[.08] bg-[#11131a] transition hover:border-[#8b5cf6]/35"><div className="relative aspect-[4/5]"><Image src={assetUrl(proof.image_url)} alt={proof.caption || "Verified Rakexura customer proof"} fill className="object-cover" /></div><div className="flex items-start gap-3 p-4"><BadgeCheck size={17} className="mt-0.5 shrink-0 text-[#9f7aea]" /><div><strong className="block text-sm">Verified proof</strong>{proof.caption && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8991a6]">{proof.caption}</p>}</div></div></article></SwiperSlide>)}</Swiper></section>;
}
