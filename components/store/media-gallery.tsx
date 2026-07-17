"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";
import { A11y, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { assetUrl } from "@/lib/utils";

function getYoutubeId(url: string) {
  return url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/i)?.[1] || "";
}

export function MediaGallery({ title, trailer, screenshots }: { title: string; trailer?: string | null; screenshots: string[] }) {
  const [playTrailer, setPlayTrailer] = useState(false);
  const youtubeId = trailer ? getYoutubeId(trailer) : "";
  const embed = youtubeId ? `https://www.youtube-nocookie.com/embed/${youtubeId}${playTrailer ? "?autoplay=1" : ""}` : "";

  if (!embed && !trailer?.match(/\.(mp4|webm)(\?.*)?$/i) && !screenshots.length) return null;

  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <Play size={20} className="text-[#facc15]" />
        <h2 className="section-title">Trailer & gameplay</h2>
      </div>
      
      {trailer && (
        <div className="relative mb-5 aspect-video overflow-hidden rounded-md border border-white/[.08] bg-black">
          {embed ? (
            playTrailer ? (
              <iframe
                src={embed}
                title={`${title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <button
                suppressHydrationWarning
                onClick={() => setPlayTrailer(true)}
                className="group absolute inset-0 h-full w-full overflow-hidden"
                aria-label={`Play ${title} trailer`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                  alt={`${title} trailer preview`}
                  className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-black/60 shadow-lg transition duration-300 group-hover:scale-110 group-hover:border-[#facc15] group-hover:bg-[#facc15] group-hover:text-black">
                    <Play size={24} className="ml-1 fill-current" />
                  </div>
                </div>
              </button>
            )
          ) : (
            <video
              src={trailer}
              controls
              poster={screenshots[0] ? assetUrl(screenshots[0]) : undefined}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      )}

      {screenshots.length > 0 && (
        <Swiper
          modules={[Navigation, A11y]}
          navigation
          spaceBetween={12}
          slidesPerView={1.08}
          breakpoints={{ 640: { slidesPerView: 2.05 } }}
        >
          {screenshots.map((shot) => (
            <SwiperSlide key={shot}>
              <div className="relative aspect-video overflow-hidden rounded-md border border-white/[.07]">
                <Image
                  src={assetUrl(shot)}
                  alt={`${title} gameplay screenshot`}
                  fill
                  className="object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}
