"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { A11y, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { assetUrl } from "@/lib/utils";

function embedUrl(url: string) {
  const youtube = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/i)?.[1];
  return youtube ? `https://www.youtube-nocookie.com/embed/${youtube}` : "";
}

export function MediaGallery({ title, trailer, screenshots }: { title: string; trailer?: string | null; screenshots: string[] }) {
  const embed = trailer ? embedUrl(trailer) : "";
  if (!embed && !trailer?.match(/\.(mp4|webm)(\?.*)?$/i) && !screenshots.length) return null;
  return <section><div className="mb-5 flex items-center gap-3"><Play size={20} className="text-[#facc15]" /><h2 className="section-title">Trailer & gameplay</h2></div>{trailer && <div className="relative mb-5 aspect-video overflow-hidden rounded-md border border-white/[.08] bg-black">{embed ? <iframe src={embed} title={`${title} trailer`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" className="absolute inset-0 h-full w-full" /> : <video src={trailer} controls poster={screenshots[0] ? assetUrl(screenshots[0]) : undefined} className="h-full w-full object-cover" />}</div>}{screenshots.length > 0 && <Swiper modules={[Navigation, A11y]} navigation spaceBetween={12} slidesPerView={1.08} breakpoints={{ 640: { slidesPerView: 2.05 } }}>{screenshots.map((shot) => <SwiperSlide key={shot}><div className="relative aspect-video overflow-hidden rounded-md border border-white/[.07]"><Image src={assetUrl(shot)} alt={`${title} gameplay screenshot`} fill className="object-cover" /></div></SwiperSlide>)}</Swiper>}</section>;
}
