"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock3, Flame, Gamepad2, Plus, Search, Sparkles, TrendingUp, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { assetUrl, calculateResellerPrice, formatPrice, gameUrl, lowestPrice, matchesSearchQuery } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import type { Game } from "@/types/store";
import { availablePlatforms } from "./game-card";
import { TextType } from "@/components/animations/text-type";

const RECENT_KEY = "rakexura-recent-searches";
const trendingTerms = ["Open World", "Under ₹299", "Xbox PC Pass", "Story Rich", "Co-op"];

function quickPlatform(game: Game) {
  return availablePlatforms(game).sort((a, b) => {
    const price = (platform: string) => {
      if (platform === "Epic") return Number(game.epic_price ?? 0);
      if (platform === "Offline") return Number(game.offline_price ?? 0);
      if (platform === "Online") return Number(game.online_price ?? 0);
      if (platform === "Xbox") return Number(game.xbox_price ?? 0);
      if (platform === "Nvidia GeForce") return Number(game.geforce_price ?? 0);
      return Number(game.steam_price ?? 0) || Number.POSITIVE_INFINITY;
    };
    return price(a) - price(b);
  })[0];
}

export function PremiumSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [results, setResults] = useState<Game[]>([]);
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const add = useCartStore((state) => state.add);
  const rawIsReseller = useCartStore((state) => state.isReseller);
  const resellerDiscount = useCartStore((state) => state.resellerDiscount);
  const resellerDiscountType = useCartStore((state) => state.resellerDiscountType);

  const isReseller = mounted && rawIsReseller;

  useEffect(() => {
    setMounted(true);
    let saved: string[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    } catch {
      saved = [];
    }
    setRecent(saved);

    setLoading(true);
    void createClient()
      .from("games")
      .select("id, title, tagline, description, genres, cover_image, sale_price, original_price, steam_price, epic_price, offline_price, online_price, xbox_price, geforce_price, available_platforms, is_subscription, duration")
      .or("archived.is.null,archived.eq.false")
      .then(({ data }: { data: Game[] | null }) => {
        setLoading(false);
        const games = data ?? [];
        setAllGames(games);

        const initialSuggestions = [...games];
        initialSuggestions.sort((a, b) => {
          const ai = saved.findIndex((item) => item.toLowerCase() === a.title.toLowerCase());
          const bi = saved.findIndex((item) => item.toLowerCase() === b.title.toLowerCase());
          return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
        });
        // Allow up to 25 items so the dropdown is scrollable with mouse wheel
        setSuggestions(initialSuggestions.slice(0, 25));
      });
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setResults([]);
      return;
    }

    // Check if query contains price filter e.g. "under 299", "under ₹299", "under rs 299"
    const priceMatch = value.match(/under\s*(?:rs\.?|₹)?\s*(\d+)/i) || value.match(/(?:below|<)\s*(?:rs\.?|₹)?\s*(\d+)/i);
    let filtered = allGames;

    if (priceMatch) {
      const maxPrice = Number(priceMatch[1]);
      filtered = allGames.filter((game) => {
        const p = lowestPrice(game);
        return p > 0 && p <= maxPrice;
      });
    } else {
      filtered = allGames.filter((game) =>
        matchesSearchQuery(game.title, value, game.tagline, game.description, game.genres)
      );
    }
    // Allow up to 30 matching results for full scrollability
    setResults(filtered.slice(0, 30));
  }, [query, allGames]);

  function remember(game: Game) {
    const next = [game.title, ...recent.filter((item) => item.toLowerCase() !== game.title.toLowerCase())].slice(0, 5);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  function quickAdd(game: Game) {
    const platform = quickPlatform(game);
    if (!platform) return toast.error("This game has no available platform right now.");
    add(game, platform);
    remember(game);
    toast.success(`${game.title} added to cart`);
  }

  const shown = query.trim().length >= 2 ? results : suggestions;

  return (
    <div className="relative w-full">
      {/* Search Input Bar */}
      <label
        htmlFor="premium-search-input"
        className={`flex h-11 w-full items-center gap-2.5 rounded-xl border border-white/10 bg-[#10131b] px-3.5 text-sm shadow-inner transition-all duration-200 cursor-text ${
          isReseller
            ? "focus-within:border-[#facc15]/60 focus-within:bg-[#141823] focus-within:shadow-[0_0_15px_rgba(250,204,21,0.12)]"
            : "focus-within:border-[#8b5cf6]/60 focus-within:bg-[#141823] focus-within:shadow-[0_0_15px_rgba(139,92,246,0.12)]"
        }`}
      >
        <Search
          size={16}
          className={`shrink-0 transition-colors ${
            isReseller
              ? "text-[#8991a6] group-focus-within:text-[#facc15]"
              : "text-[#8991a6] group-focus-within:text-[#8b5cf6]"
          }`}
        />
        <span className="sr-only">Search games</span>
        <div className="relative flex-1 min-w-0 h-full flex items-center">
          <input
            suppressHydrationWarning
            id="premium-search-input"
            name="search"
            value={query}
            onFocus={() => {
              setOpen(true);
              setFocused(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setOpen(false), 200);
              setFocused(false);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                e.currentTarget.blur();
              } else if (e.key === "Enter" && shown.length > 0) {
                e.preventDefault();
                remember(shown[0]);
                router.push(gameUrl(shown[0]));
                setOpen(false);
              }
            }}
            autoComplete="off"
            placeholder={focused ? "Search games, genres, platforms..." : ""}
            className="w-full h-full border-0 bg-transparent text-white outline-none placeholder:text-[#5d6477] text-xs sm:text-sm font-medium"
          />
          {!focused && !query && (
            <div className="absolute left-0 pointer-events-none text-[#767e90] text-xs sm:text-sm flex items-center">
              <TextType
                text={[
                  "Search games (GTA V, RDR 2...)",
                  "Explore genres (Open World, FPS...)",
                  "Check platforms (Steam, Epic...)",
                  "Search deals & subscriptions...",
                ]}
                typingSpeed={60}
                deletingSpeed={30}
                pauseDuration={2000}
                showCursor={true}
                cursorCharacter="|"
                cursorClassName={`${isReseller ? "text-[#facc15]" : "text-[#8b5cf6]"} font-bold`}
              />
            </div>
          )}
        </div>

        {query && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery("");
            }}
            className="text-[#8991a6] hover:text-white p-1 rounded-md transition"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </label>

      {/* Modern Epic Games Store Dropdown with Smooth Mouse-Wheel Scrolling */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="search-dropdown-menu"
            initial={{ opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.15 }}
            onWheel={(e) => e.stopPropagation()}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] max-h-[58vh] overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-[#0b0e17]/98 p-2 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl custom-scrollbar"
          >
            {/* Category Header */}
            <div className="flex items-center justify-between px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#8991a6] border-b border-white/[0.06] mb-1">
              <span className="flex items-center gap-1.5">
                {query.trim().length >= 2 ? (
                  <>
                    <Search size={12} className={isReseller ? "text-[#facc15]" : "text-[#c4b5fd]"} />
                    <span>Search Results</span>
                  </>
                ) : (
                  <>
                    <Clock3 size={12} className={isReseller ? "text-[#facc15]" : "text-[#c4b5fd]"} />
                    <span>Recently Viewed & Popular</span>
                  </>
                )}
              </span>
              <span className="font-mono text-[9px] text-[#646b7b]">
                {shown.length} {shown.length === 1 ? "title" : "titles"}
              </span>
            </div>

            {loading && (
              <div className="p-4 text-center text-xs text-[#8f96a8]">
                <Sparkles size={16} className="mx-auto mb-1 animate-spin text-[#c4b5fd]" />
                Searching catalog...
              </div>
            )}

            {/* Games List */}
            <div className="space-y-1">
              {!loading &&
                shown.map((game) => {
                  const rawPrice = lowestPrice(game);
                  const resellerCalc =
                    isReseller && resellerDiscount > 0
                      ? calculateResellerPrice(rawPrice, resellerDiscount, resellerDiscountType)
                      : null;
                  const platforms = availablePlatforms(game);

                  return (
                    <article
                      key={game.id}
                      className="group flex items-center justify-between gap-3 rounded-xl p-2 transition-all duration-150 hover:bg-white/[0.05] border border-transparent hover:border-white/10"
                    >
                      <Link
                        href={gameUrl(game)}
                        onClick={() => remember(game)}
                        className="flex flex-1 items-center gap-3 min-w-0"
                      >
                        {/* Artwork Poster Thumbnail */}
                        <div className="relative h-13 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/60 shadow-sm group-hover:border-white/25 transition">
                          <Image
                            src={assetUrl(game.cover_image)}
                            alt=""
                            fill
                            className="object-cover transition duration-300 group-hover:scale-105"
                            sizes="40px"
                          />
                        </div>

                        {/* Title & Micro Platform Pills */}
                        <div className="min-w-0 flex-1">
                          <strong className="block text-[13px] font-extrabold text-white group-hover:text-[#c4b5fd] transition-colors truncate">
                            {game.title}
                          </strong>

                          <div className="mt-1 flex items-center flex-wrap gap-1.5">
                            {/* Price */}
                            {resellerCalc ? (
                              resellerCalc.isDiscount ? (
                                <div className="flex items-baseline gap-1.5">
                                  <strong className="text-xs font-black text-[#facc15] font-mono">
                                    {formatPrice(resellerCalc.price)}
                                  </strong>
                                  <del className="text-[10px] text-[#646b7b]">
                                    {formatPrice(rawPrice)}
                                  </del>
                                </div>
                              ) : (
                                <div className="flex items-baseline gap-1.5">
                                  <strong className="text-xs font-black text-[#facc15] font-mono">
                                    {formatPrice(resellerCalc.price)}
                                  </strong>
                                  <span className="text-[10px] text-[#646b7b]">
                                    (base: {formatPrice(rawPrice)})
                                  </span>
                                </div>
                              )
                            ) : (
                              <strong className="text-xs font-black text-[#c4b5fd] font-mono">
                                {formatPrice(rawPrice)}
                              </strong>
                            )}

                            {/* Platform Badges */}
                            {platforms.slice(0, 3).map((plat) => (
                              <span
                                key={plat}
                                className="rounded bg-white/[0.04] border border-white/10 px-1.5 py-0.5 text-[9px] font-bold text-[#a7adbb]"
                              >
                                {plat}
                              </span>
                            ))}

                            {game.is_subscription && game.duration && (
                              <span className="rounded bg-[#8b5cf6]/15 border border-[#8b5cf6]/25 px-1.5 py-0.5 text-[9px] font-bold text-[#c4b5fd]">
                                {game.duration}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Quick Add To Cart Button */}
                      <button
                        suppressHydrationWarning
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => quickAdd(game)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 text-[#c4b5fd] hover:bg-[#8b5cf6] hover:text-white hover:border-transparent transition-all shadow-sm active:scale-95 cursor-pointer"
                        title={`Quick add ${game.title} to cart`}
                        aria-label={`Add ${game.title} to cart`}
                      >
                        <Plus size={15} />
                      </button>
                    </article>
                  );
                })}
            </div>

            {/* Empty Search Results Prompt */}
            {!loading && query.trim().length >= 2 && !shown.length && (
              <div className="p-6 text-center">
                <Gamepad2 className="mx-auto text-[#8b5cf6]" size={28} />
                <strong className="mt-2 block text-xs font-bold text-white">
                  No matching games found
                </strong>
                <p className="mt-1 text-[11px] text-[#8f96a8]">
                  Ask Rakexura to add it to the catalog.
                </p>
                <Link
                  href={`/requests?game=${encodeURIComponent(query.trim())}`}
                  className="btn btn-secondary mt-3 text-xs py-1.5 px-4"
                >
                  Request this game
                </Link>
              </div>
            )}

            {/* Explore Trending Chips */}
            {query.trim().length < 2 && (
              <div className="mt-2 flex items-center flex-wrap gap-1.5 border-t border-white/[0.06] px-2 pt-2.5 pb-1">
                <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-[#777f91] mr-1">
                  <TrendingUp size={11} /> Explore
                </span>
                {trendingTerms.map((term) => (
                  <button
                    suppressHydrationWarning
                    key={term}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setQuery(term);
                      setOpen(true);
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-[#b6bdcc] hover:border-[#8b5cf6]/50 hover:bg-[#8b5cf6]/15 hover:text-white transition-all cursor-pointer font-medium"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
