"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { assetUrl, formatPrice, lowestPrice } from "@/lib/utils";
import type { Game } from "@/types/store";
import { BlurText } from "@/components/animations/blur-text";

const AUTOPLAY_DELAY = 6500;

export function HeroCarousel({ games }: { games: Game[] }) {
  const [active, setActive] = useState(0);
  const swiperRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isMobile, setIsMobile] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleLoad = () => {
      setTimeout(() => setLoadVideo(true), 1500);
    };

    if (document.readyState === "complete") {
      setTimeout(() => setLoadVideo(true), 1500);
    } else {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  if (!games.length) return null;

  return (
    <div className="hero-with-featured">
      <div className="min-w-0 relative">
        <Swiper
          modules={[Autoplay, Navigation]}
          autoplay={{ delay: AUTOPLAY_DELAY, disableOnInteraction: false }}
          loop={games.length > 1}
          observer={true}
          observeParents={true}
          onSwiper={(s) => { swiperRef.current = s; }}
          onRealIndexChange={(s) => setActive(s.realIndex)}
          navigation={{ prevEl: ".hero-prev", nextEl: ".hero-next" }}
          className="overflow-hidden rounded-xl"
        >
          <button suppressHydrationWarning={true} className="hero-prev absolute left-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/55 backdrop-blur md:grid" aria-label="Previous spotlight"><ChevronLeft /></button>
          <button suppressHydrationWarning={true} className="hero-next absolute right-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/55 backdrop-blur md:grid" aria-label="Next spotlight"><ChevronRight /></button>
          {games.map((game, index) => (
            <SwiperSlide key={game.id}>
              <article className="hero-frame relative min-h-[420px] overflow-hidden rounded-xl md:min-h-[570px]">
                {/* Always render the static Image first for fast SSR and LCP priority */}
                <Image src={assetUrl(game.banner_image || game.cover_image)} alt={`Spotlight ${game.title} banner`} fill priority={index === 0} className="hero-media object-cover" sizes="100vw" />

                
                {/* Overlay video player client-side after hydration on desktop viewports */}
                {mounted && !isMobile && loadVideo && active === index && game.trailer_url?.match(/\.(mp4|webm)(\?.*)?$/i) && (
                  <video src={game.trailer_url} autoPlay muted loop playsInline className="hero-media absolute inset-0 h-full w-full object-cover z-0" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,11,.97)_0%,rgba(3,5,11,.68)_38%,rgba(3,5,11,.08)_78%),linear-gradient(0deg,rgba(3,5,11,.8),transparent_50%)]" />
                <motion.div key={`${active}-${game.id}`} initial={{ opacity: 0, y: 24 }} animate={active === index ? { opacity: 1, y: 0 } : { opacity: .75, y: 12 }} transition={{ duration: .65, ease: [0.2, 0.7, 0.2, 1] }} className="relative z-10 flex min-h-[420px] max-w-4xl flex-col justify-end p-5 pb-16 pt-8 md:min-h-[570px] md:justify-end md:pb-20 md:pt-14 md:px-14">
                  <p className="eyebrow mb-4">Rakexura spotlight</p>
                  <h3 className="text-2xl font-black md:text-5xl lg:text-[64px] tracking-tight leading-[1.05]">
                    <BlurText 
                      key={`${game.id}-${active === index}`}
                      text={game.title} 
                      delay={60} 
                      animateBy="words" 
                      direction="bottom" 
                      stepDuration={0.3} 
                    />
                  </h3>
                  <p className="mt-6 max-w-xl text-base leading-7 text-[#d4d8e4] md:text-lg">{game.tagline || game.description || "A standout PC experience, ready for your library."}</p>
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Link href={`/games/${game.id}`} className="magnetic-button inline-flex min-h-12 items-center gap-2 rounded-md bg-[#facc15] px-6 text-sm font-bold text-black transition hover:-translate-y-0.5 hover:bg-[#ffe45c]">View game <ArrowRight size={17} /></Link>
                    {game.trailer_url && <a href={game.trailer_url} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-md border border-white/12 bg-black/40 px-5 text-sm font-semibold backdrop-blur hover:bg-black/60"><Play size={16} fill="currentColor" /> Trailer</a>}
                    <span className="rounded-md bg-black/45 px-4 py-3 text-sm font-semibold backdrop-blur">From {formatPrice(lowestPrice(game))}</span>
                  </div>
                </motion.div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="absolute inset-x-6 bottom-5 z-20 flex gap-2 md:inset-x-16">
          {games.map((game, index) => <span key={game.id} className="h-0.5 flex-1 overflow-hidden bg-white/20"><span key={active === index ? `active-${game.id}` : game.id} className={`block h-full origin-left bg-[#facc15] ${active === index ? "animate-[hero-progress_6.5s_linear_forwards]" : index < active ? "scale-x-100" : "scale-x-0"}`} /></span>)}
        </div>
      </div>

      <aside className="featured-now min-w-0" aria-label="Featured games">
        <div className="featured-now-heading mb-3 flex items-center justify-between">
          <strong className="text-sm text-white">Featured now</strong>
          <Link href="/games" className="text-xs text-[#b9a4ff] hover:underline">View all</Link>
        </div>
        <div className="featured-now-list hide-scrollbar">
          {games.map((game, index) => (
            <button
              key={game.id}
              type="button"
              suppressHydrationWarning
              onClick={() => {
                if (swiperRef.current) swiperRef.current.slideToLoop(index);
              }}
              className={`featured-now-item w-full rounded p-3 text-left transition duration-300 ease-out cursor-pointer group ${
                active === index ? "is-active" : ""
              }`}
            >
              <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-black/40">
                <Image
                  src={assetUrl(game.cover_image)}
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="line-clamp-1 text-xs font-bold leading-relaxed text-white group-hover:text-[#facc15] transition-colors">
                  {game.title}
                </strong>
                <small className="mt-0.5 block text-[10px] text-[#8991a6]">
                  From {formatPrice(lowestPrice(game))}
                </small>
              </span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
