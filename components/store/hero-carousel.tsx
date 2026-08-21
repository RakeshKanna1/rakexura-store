"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { assetUrl, formatPrice, gameUrl, lowestPrice } from "@/lib/utils";
import type { Game } from "@/types/store";
import { BlurText } from "@/components/animations/blur-text";

const AUTOPLAY_DELAY = 6500;

function getYoutubeId(url: string) {
  return url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/i)?.[1] || "";
}

export function HeroCarousel({ games }: { games: Game[] }) {
  const [active, setActive] = useState(0);
  const swiperRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isMobile, setIsMobile] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);
  const [activeTrailerId, setActiveTrailerId] = useState<number | string | null>(null);

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

  const handlePlayTrailer = (game: Game, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!game.trailer_url) return;
    
    // Pause swiper autoplay while watching trailer on banner
    if (swiperRef.current?.autoplay) {
      swiperRef.current.autoplay.stop();
    }
    setActiveTrailerId(game.id);
  };

  const handleCloseTrailer = () => {
    setActiveTrailerId(null);
    if (swiperRef.current?.autoplay) {
      swiperRef.current.autoplay.start();
    }
  };

  return (
    <div className="hero-with-featured">
      <div className="min-w-0 relative">
          <>
            <Swiper
              modules={[Autoplay, Navigation]}
              autoplay={{ delay: AUTOPLAY_DELAY, disableOnInteraction: false }}
              loop={games.length > 1}
              observer={true}
              observeParents={true}
              onSwiper={(s) => { swiperRef.current = s; }}
              onRealIndexChange={(s) => {
                setActive(s.realIndex);
                setActiveTrailerId(null);
              }}
              navigation={{ prevEl: ".hero-prev", nextEl: ".hero-next" }}
              className="overflow-hidden rounded-xl h-[420px] md:h-[570px]"
            >
              <button suppressHydrationWarning={true} onClick={handleCloseTrailer} className="hero-prev absolute left-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/55 backdrop-blur md:grid" aria-label="Previous spotlight"><ChevronLeft /></button>
              <button suppressHydrationWarning={true} onClick={handleCloseTrailer} className="hero-next absolute right-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/55 backdrop-blur md:grid" aria-label="Next spotlight"><ChevronRight /></button>
              {games.map((game, index) => {
                const isTrailerActive = activeTrailerId === game.id && game.trailer_url;
                const youtubeId = game.trailer_url ? getYoutubeId(game.trailer_url) : "";
                const isDirectVideo = game.trailer_url?.match(/\.(mp4|webm)(\?.*)?$/i);

                return (
                  <SwiperSlide key={game.id}>
                    <article className="hero-frame relative h-full w-full overflow-hidden rounded-xl">
                      {/* Active Banner Trailer Video Overlay */}
                      {isTrailerActive ? (
                        <div className="absolute inset-0 z-30 bg-black overflow-hidden rounded-xl">
                          {youtubeId ? (
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                              title={`${game.title} Official Trailer`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              className="h-full w-full border-0"
                            />
                          ) : isDirectVideo ? (
                            <video
                              src={game.trailer_url!}
                              autoPlay
                              controls
                              playsInline
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <iframe
                              src={game.trailer_url!}
                              title={`${game.title} Trailer`}
                              allow="autoplay; encrypted-media"
                              className="h-full w-full border-0"
                            />
                          )}
                          <button
                            suppressHydrationWarning={true}
                            type="button"
                            onClick={handleCloseTrailer}
                            className="absolute top-3 left-3 sm:top-4 sm:left-4 z-40 flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-black/80 hover:bg-black text-white hover:text-[#facc15] hover:border-[#facc15]/50 transition-all border border-white/25 shadow-2xl backdrop-blur-xl text-xs font-bold tracking-wide cursor-pointer active:scale-95"
                            aria-label="Close trailer video"
                          >
                            <X size={14} className="shrink-0" />
                            <span>Close Trailer</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Always render the static Image first for fast SSR and LCP priority */}
                          <Image 
                            src={assetUrl(game.banner_image || game.cover_image)} 
                            alt={`Spotlight ${game.title} banner`} 
                            fill 
                            priority={index === 0} 
                            fetchPriority={index === 0 ? "high" : "low"}
                            className="hero-media object-cover object-[center_20%] sm:object-[center_15%] md:object-[center_18%]" 
                            sizes="100vw" 
                          />

                          {/* Background looping silent ambient video client-side */}
                          {mounted && !isMobile && loadVideo && active === index && game.trailer_url?.match(/\.(mp4|webm)(\?.*)?$/i) && (
                            <video src={game.trailer_url} autoPlay muted loop playsInline className="hero-media absolute inset-0 h-full w-full object-cover object-[center_18%] z-0" />
                          )}
                          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,11,0.94)_0%,rgba(3,5,11,0.72)_34%,rgba(3,5,11,0.18)_68%,transparent_90%),linear-gradient(0deg,rgba(3,5,11,0.9)_0%,rgba(3,5,11,0.32)_28%,transparent_62%)]" />
                          <motion.div 
                            key={`${active}-${game.id}`} 
                            initial={{ opacity: 0, y: 24 }} 
                            animate={active === index ? { opacity: 1, y: 0 } : { opacity: .75, y: 12 }} 
                            transition={{ duration: .65, ease: [0.2, 0.7, 0.2, 1] }} 
                            className="relative z-10 flex h-full w-full max-w-4xl flex-col justify-end p-4 pb-14 pt-6 sm:p-6 sm:pb-16 md:pb-24 md:pt-14 md:px-14 lg:px-16"
                          >
                            <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-extrabold uppercase tracking-[0.16em] text-[#b9a4ff]">
                              {game.is_subscription ? "⚡ Subscription spotlight" : game.preorder ? "Pre-order spotlight" : "Rakexura spotlight"}
                            </p>
                            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-[62px] font-black tracking-tight leading-[1.06] drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]">
                              <BlurText 
                                key={`${game.id}-${active === index}`}
                                text={game.title} 
                                delay={60} 
                                animateBy="words" 
                                direction="bottom" 
                                stepDuration={0.3} 
                              />
                            </h3>
                            <p className="mt-2 sm:mt-3.5 max-w-xl text-sm sm:text-base md:text-lg leading-relaxed text-[#d8dce8] font-medium line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                              {game.tagline || game.description || "A standout PC experience, ready for your library."}
                            </p>
                            <div className="mt-4 sm:mt-6 grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                              {game.is_subscription ? (
                                <Link 
                                  href={gameUrl(game)} 
                                  className="magnetic-button inline-flex h-10 sm:h-12 w-full sm:w-[148px] items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#facc15] px-1 sm:px-3 text-xs sm:text-[14px] md:text-[15px] font-black text-black transition hover:-translate-y-0.5 hover:bg-[#ffe45c] tracking-tight shadow-lg"
                                >
                                  <span className="truncate">View plans</span>
                                  <ArrowRight size={15} className="shrink-0" />
                                </Link>
                              ) : game.preorder ? (
                                <Link 
                                  href={gameUrl(game)} 
                                  className="magnetic-button inline-flex h-10 sm:h-12 w-full sm:w-[148px] items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#facc15] px-1 sm:px-3 text-xs sm:text-[14px] md:text-[15px] font-black text-black transition hover:-translate-y-0.5 hover:bg-[#ffe45c] tracking-tight shadow-lg"
                                >
                                  <span className="truncate">Pre-order</span>
                                  <ArrowRight size={15} className="shrink-0" />
                                </Link>
                              ) : (
                                <Link 
                                  href={gameUrl(game)} 
                                  className="magnetic-button inline-flex h-10 sm:h-12 w-full sm:w-[148px] items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#facc15] px-1 sm:px-3 text-xs sm:text-[14px] md:text-[15px] font-black text-black transition hover:-translate-y-0.5 hover:bg-[#ffe45c] tracking-tight shadow-lg"
                                >
                                  <span className="truncate">View game</span>
                                  <ArrowRight size={15} className="shrink-0" />
                                </Link>
                              )}
                              {game.trailer_url ? (
                                <button
                                  suppressHydrationWarning={true}
                                  type="button"
                                  onClick={(e) => handlePlayTrailer(game, e)}
                                  className="inline-flex h-10 sm:h-12 w-full sm:w-[148px] items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-white/15 bg-black/65 px-1 sm:px-3 text-xs sm:text-[14px] md:text-[15px] font-extrabold backdrop-blur hover:bg-black/85 hover:border-[#facc15]/50 transition-all cursor-pointer text-white tracking-tight"
                                >
                                  <Play size={14} fill="currentColor" className="text-[#facc15] shrink-0" />
                                  <span className="font-extrabold text-white truncate">Trailer</span>
                                </button>
                              ) : (
                                <Link
                                  href={gameUrl(game)}
                                  className="inline-flex h-10 sm:h-12 w-full sm:w-[148px] items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-white/15 bg-black/65 px-1 sm:px-3 text-xs sm:text-[14px] md:text-[15px] font-extrabold backdrop-blur hover:bg-black/85 transition-all text-white tracking-tight"
                                >
                                  <Play size={14} fill="currentColor" className="shrink-0" />
                                  <span className="font-extrabold text-white truncate">Trailer</span>
                                </Link>
                              )}
                              <span className="inline-flex h-10 sm:h-12 w-full sm:w-[148px] items-center justify-center rounded-lg border border-white/10 bg-black/65 px-1 sm:px-3 text-xs sm:text-[14px] md:text-[15px] font-black text-[#facc15] backdrop-blur tracking-tight">
                                <span className="truncate">From {formatPrice(lowestPrice(game))}</span>
                              </span>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </article>
                  </SwiperSlide>
                );
              })}
            </Swiper>
            <div className="absolute inset-x-4 sm:inset-x-6 bottom-5 z-20 flex gap-2 md:inset-x-14 lg:inset-x-16">
              {games.map((game, index) => <span key={game.id} className="h-0.5 flex-1 overflow-hidden bg-white/20"><span key={active === index ? `active-${game.id}` : game.id} className={`block h-full origin-left bg-[#facc15] ${active === index ? "animate-[hero-progress_6.5s_linear_forwards]" : index < active ? "scale-x-100" : "scale-x-0"}`} /></span>)}
            </div>
          </>
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
                setActiveTrailerId(null);
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
                  fetchPriority="low"
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
