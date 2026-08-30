"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Play, X, Zap } from "lucide-react";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { assetUrl, calculateResellerPrice, formatPrice, gameUrl, lowestPrice } from "@/lib/utils";
import type { FlashSale, Game } from "@/types/store";
import { BlurText } from "@/components/animations/blur-text";
import { useCartStore } from "@/stores/cart-store";

const AUTOPLAY_DELAY = 6500;

function getYoutubeId(url: string) {
  return url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/i)?.[1] || "";
}

function formatRemainingTime(end: string, now: number) {
  const diff = Math.max(0, new Date(end).getTime() - now);
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}h : ${pad(m)}m : ${pad(s)}s`;
}

export function HeroCarousel({ games, flashSales = [] }: { games: Game[]; flashSales?: FlashSale[] }) {
  const [active, setActive] = useState(0);
  const swiperRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isMobile, setIsMobile] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [loadVideo, setLoadVideo] = useState(false);
  const [activeTrailerId, setActiveTrailerId] = useState<number | string | null>(null);
  const isReseller = useCartStore((state) => state.isReseller);
  const resellerDiscount = useCartStore((state) => state.resellerDiscount);
  const resellerDiscountType = useCartStore((state) => state.resellerDiscountType);
  const isWholesaleActive = Boolean(isReseller && resellerDiscount > 0);

  const getDisplayPrice = (game: Game, flashSale?: FlashSale | null) => {
    const rawLowest = lowestPrice(flashSale ? { ...game, active_flash_sale: flashSale } : game);
    if (flashSale && flashSale.sale_price) {
      return { price: rawLowest, label: "Flash Sale", raw: rawLowest, isWholesale: false, isDiscount: true };
    }
    if (!isWholesaleActive || rawLowest <= 0) return { price: rawLowest, label: "", isWholesale: false, isDiscount: false };
    const calc = calculateResellerPrice(rawLowest, resellerDiscount, resellerDiscountType);
    return { price: calc.price, label: calc.label, raw: rawLowest, isWholesale: true, isDiscount: calc.isDiscount };
  };

  useEffect(() => {
    setMounted(true);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
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
      window.clearInterval(timer);
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
              slidesPerView={1}
              spaceBetween={0}
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

                const matchingFlashSale = flashSales.find((s) => s.game_id === game.id && s.active);
                const isFlashActive = Boolean(matchingFlashSale && (!mounted || (new Date(matchingFlashSale.starts_at).getTime() <= now && new Date(matchingFlashSale.ends_at).getTime() > now)));

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
                            className="relative z-10 flex h-full w-full max-w-4xl flex-col justify-end p-4 pb-10 pt-4 sm:p-6 sm:pb-12 md:pb-16 md:pt-10 md:px-12 lg:px-14"
                          >
                            {isFlashActive ? (
                              <div className="mb-2 sm:mb-2.5 md:mb-3 flex flex-wrap items-center gap-2">
                                <p className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.16em] text-[#facc15] flex items-center gap-1.5">
                                  <Zap size={14} className="fill-[#facc15] shrink-0" />
                                  <span>Flash Sale Deal</span>
                                </p>
                                {matchingFlashSale && (
                                  <>
                                    <span className="text-[#8991a6] font-bold text-xs">•</span>
                                    <span suppressHydrationWarning className="text-xs font-mono font-bold text-white/90 bg-white/10 px-2.5 py-0.5 rounded border border-white/15 backdrop-blur-md">
                                      Ends in {mounted ? formatRemainingTime(matchingFlashSale.ends_at, now) : "--:--:--"}
                                    </span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <p className="mb-2 sm:mb-2.5 md:mb-3 text-xs sm:text-sm font-extrabold uppercase tracking-[0.16em] text-[#b9a4ff]">
                                {game.preorder ? "Pre-order spotlight" : "Rakexura spotlight"}
                              </p>
                            )}
                            <h3 className="text-2xl sm:text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.08] drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]">
                              <BlurText 
                                key={`${game.id}-${active === index}`}
                                text={game.title} 
                                delay={60} 
                                animateBy="words" 
                                direction="bottom" 
                                stepDuration={0.3} 
                              />
                            </h3>
                            <p className="mt-2 sm:mt-2.5 md:mt-3 max-w-xl text-xs sm:text-sm md:text-base leading-relaxed text-[#d8dce8] font-medium line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                              {game.tagline || game.description || "A standout PC experience, ready for your library."}
                            </p>
                            <div className="mt-3.5 sm:mt-5 md:mt-6 grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 md:gap-3.5 w-full sm:w-auto">
                              {game.is_subscription ? (
                                <Link 
                                  href={gameUrl(game)} 
                                  className="magnetic-button inline-flex h-10 sm:h-11 md:h-12 w-full sm:w-[145px] items-center justify-center gap-1.5 rounded-xl border border-[#eab308] bg-[#eab308] px-1 sm:px-3 text-[12.5px] sm:text-[14px] font-bold text-[#080a10] leading-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#facc15] hover:border-[#facc15] shadow-[0_4px_14px_rgba(234,179,8,0.25)] active:scale-95 cursor-pointer"
                                >
                                  <span className="truncate">View plans</span>
                                  <ArrowRight size={13} className="shrink-0 text-[#080a10]" />
                                </Link>
                              ) : game.preorder ? (
                                <Link 
                                  href={gameUrl(game)} 
                                  className="magnetic-button inline-flex h-10 sm:h-11 md:h-12 w-full sm:w-[145px] items-center justify-center gap-1.5 rounded-xl border border-[#eab308] bg-[#eab308] px-1 sm:px-3 text-[12.5px] sm:text-[14px] font-bold text-[#080a10] leading-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#facc15] hover:border-[#facc15] shadow-[0_4px_14px_rgba(234,179,8,0.25)] active:scale-95 cursor-pointer"
                                >
                                  <span className="truncate">Pre-order</span>
                                  <ArrowRight size={13} className="shrink-0 text-[#080a10]" />
                                </Link>
                              ) : (
                                <Link 
                                  href={gameUrl(game)} 
                                  className="magnetic-button inline-flex h-10 sm:h-11 md:h-12 w-full sm:w-[145px] items-center justify-center gap-1.5 rounded-xl border border-[#eab308] bg-[#eab308] px-1 sm:px-3 text-[12.5px] sm:text-[14px] font-bold text-[#080a10] leading-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#facc15] hover:border-[#facc15] shadow-[0_4px_14px_rgba(234,179,8,0.25)] active:scale-95 cursor-pointer"
                                >
                                  <span className="truncate">View game</span>
                                  <ArrowRight size={13} className="shrink-0 text-[#080a10]" />
                                </Link>
                              )}
                              {game.trailer_url ? (
                                <button
                                  suppressHydrationWarning={true}
                                  type="button"
                                  onClick={(e) => handlePlayTrailer(game, e)}
                                  className="inline-flex h-10 sm:h-11 md:h-12 w-full sm:w-[145px] items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-black/60 px-1 sm:px-3 text-[12.5px] sm:text-[14px] font-bold text-white leading-none backdrop-blur-md hover:bg-black/80 hover:border-white/35 transition-all duration-200 cursor-pointer active:scale-95"
                                >
                                  <Play size={12} fill="currentColor" className="shrink-0 text-white" />
                                  <span className="truncate">Watch</span>
                                </button>
                              ) : (
                                <Link
                                  href={gameUrl(game)}
                                  className="inline-flex h-10 sm:h-11 md:h-12 w-full sm:w-[145px] items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-black/60 px-1 sm:px-3 text-[12.5px] sm:text-[14px] font-bold text-white leading-none backdrop-blur-md hover:bg-black/80 hover:border-white/35 transition-all duration-200 active:scale-95"
                                >
                                  <Play size={12} fill="currentColor" className="shrink-0 text-white" />
                                  <span className="truncate">Watch</span>
                                </Link>
                              )}
                              <span className="inline-flex h-10 sm:h-11 md:h-12 w-full sm:w-[145px] items-center justify-center rounded-xl border border-white/15 bg-black/60 px-1 sm:px-3 text-[12.5px] sm:text-[14px] font-bold leading-none backdrop-blur-md">
                                {(() => {
                                  const p = getDisplayPrice(game, matchingFlashSale);
                                  return (
                                    <span className={`truncate ${p.isWholesale && p.isDiscount ? "text-[#e0ce9a]" : "text-[#facc15]"}`}>
                                      From {formatPrice(p.price)}
                                    </span>
                                  );
                                })()}
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
            <div className="absolute inset-x-4 sm:inset-x-6 bottom-3 sm:bottom-4 md:bottom-5 z-20 flex gap-2 md:gap-2.5 md:inset-x-12 lg:inset-x-14">
              {games.map((game, index) => <span key={game.id} className="h-0.5 md:h-1 flex-1 overflow-hidden rounded-full bg-white/20"><span key={active === index ? `active-${game.id}` : game.id} className={`block h-full origin-left bg-[#facc15] ${active === index ? "animate-[hero-progress_6.5s_linear_forwards]" : index < active ? "scale-x-100" : "scale-x-0"}`} /></span>)}
            </div>
          </>
      </div>

      <aside className="featured-now min-w-0" aria-label="Featured games">
        <div className="featured-now-heading mb-2.5 flex items-center justify-between">
          <strong className="text-sm font-black text-white">Featured now</strong>
          <Link href="/games" className="text-xs text-[#b9a4ff] hover:underline font-bold">View all</Link>
        </div>
        <div className="featured-now-list hide-scrollbar">
          {games.map((game, index) => {
            const matchingFlashSale = flashSales.find((s) => s.game_id === game.id && s.active);
            const isFlashActive = Boolean(matchingFlashSale && (!mounted || (new Date(matchingFlashSale.starts_at).getTime() <= now && new Date(matchingFlashSale.ends_at).getTime() > now)));
            const p = getDisplayPrice(game, isFlashActive ? matchingFlashSale : null);

            return (
              <button
                key={game.id}
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  if (swiperRef.current) swiperRef.current.slideToLoop(index);
                  setActiveTrailerId(null);
                }}
                className={`featured-now-item w-full rounded p-2.5 sm:p-3 text-left transition duration-300 ease-out cursor-pointer group ${
                  active === index ? "is-active" : ""
                }`}
              >
                <span className="relative h-11 w-8 sm:h-12 sm:w-9 shrink-0 overflow-hidden rounded bg-black/40">
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
                    {(() => {
                      if (isFlashActive && matchingFlashSale?.sale_price) {
                        return (
                          <span className="text-[#facc15] font-black tracking-wide">
                            Flash {formatPrice(matchingFlashSale.sale_price)}
                          </span>
                        );
                      }
                      if (p.isWholesale && p.isDiscount) {
                        return (
                          <span className="text-[#e0ce9a] font-bold">
                            From {formatPrice(p.price)} ({p.label})
                          </span>
                        );
                      }
                      return `From ${formatPrice(p.price)}`;
                    })()}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
