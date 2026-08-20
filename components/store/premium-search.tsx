"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock3, Gamepad2, Plus, Search, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { assetUrl, formatPrice, gameUrl, lowestPrice, matchesSearchQuery } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import type { Game } from "@/types/store";
import { availablePlatforms } from "./game-card";
import { TextType } from "@/components/animations/text-type";

const RECENT_KEY = "rakexura-recent-searches";
const trendingTerms = ["Open World", "Under Rs. 299"];

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
  const [loading] = useState(false);
  const add = useCartStore((state) => state.add);

  useEffect(() => {
    let saved: string[] = [];
    try { saved = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { saved = []; }
    setRecent(saved);
    void createClient()
      .from("games")
      .select("id, title, tagline, description, genres, cover_image, sale_price, original_price, steam_price, epic_price, offline_price, online_price, xbox_price, geforce_price, available_platforms, is_subscription")
      .or("archived.is.null,archived.eq.false")
      .then(({ data }: { data: Game[] | null }) => {
        const games = data ?? [];
        setAllGames(games);
      
      const initialSuggestions = [...games];
      initialSuggestions.sort((a, b) => {
        const ai = saved.findIndex((item) => item.toLowerCase() === a.title.toLowerCase());
        const bi = saved.findIndex((item) => item.toLowerCase() === b.title.toLowerCase());
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      });
      setSuggestions(initialSuggestions.slice(0, 5));
    });
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) { setResults([]); return; }
    
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
    setResults(filtered.slice(0, 6));
  }, [query, allGames]);

  function remember(game: Game) {
    const next = [game.title, ...recent.filter((item) => item.toLowerCase() !== game.title.toLowerCase())].slice(0, 5);
    setRecent(next); localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }
  function quickAdd(game: Game) {
    const platform = quickPlatform(game);
    if (!platform) return toast.error("This game has no available platform right now.");
    add(game, platform); remember(game); toast.success(`${game.title} added to cart`);
  }

  const shown = query.trim().length >= 2 ? results : suggestions;
  return (
    <div className="relative w-full">
      <label htmlFor="premium-search-input" className="flex h-11 w-full items-center gap-3 rounded-md border border-white/[.09] bg-[#10131b] px-4 text-sm shadow-inner transition focus-within:border-[#8b5cf6]/65 focus-within:bg-[#141823] focus-within:shadow-[0_0_0_3px_rgba(139,92,246,.08)]">
        <Search size={17} className="shrink-0 text-[#9da5b8]" />
        <span className="sr-only">Search games</span>
        <div className="relative flex-1 min-w-0 h-full flex items-center">
          <input
            suppressHydrationWarning
            id="premium-search-input"
            name="search"
            value={query}
            onFocus={() => { setOpen(true); setFocused(true); }}
            onBlur={() => { window.setTimeout(() => setOpen(false), 180); setFocused(false); }}
            onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
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
            className="w-full h-full border-0 bg-transparent text-white outline-none placeholder:text-[#5d6477]"
          />
          {!focused && !query && (
            <div className="absolute left-0 pointer-events-none text-[#767e90] text-sm flex items-center">
              <TextType
                text={[
                  "Search games (GTA V, RDR 2...)",
                  "Explore genres (Open World, FPS...)",
                  "Check platforms (Steam, Epic...)",
                  "Search deals..."
                ]}
                typingSpeed={60}
                deletingSpeed={30}
                pauseDuration={2000}
                showCursor={true}
                cursorCharacter="|"
                cursorClassName="text-[#8b5cf6] font-bold"
              />
            </div>
          )}
        </div>
      </label>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: .99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] max-h-[62vh] overflow-y-auto rounded-lg border border-white/10 bg-[#090c13]/98 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,.75)] backdrop-blur-xl custom-scrollbar">
            <p className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#777f91]">
              {query.trim().length >= 2 ? <><Search size={12} /> Results</> : <><Clock3 size={12} /> Recently viewed & popular</>}
            </p>
            {loading && <p className="p-3 text-xs text-[#8f96a8]">Searching Rakexura...</p>}
            {!loading && shown.map((game) => (
              <article key={game.id} className="grid grid-cols-[42px_minmax(0,1fr)_36px] items-center gap-2.5 rounded-md p-1.5 transition hover:bg-white/[.055]">
                <Link href={gameUrl(game)} onClick={() => remember(game)} className="relative h-12 overflow-hidden rounded-sm bg-black border border-white/5">
                  <Image src={assetUrl(game.cover_image)} alt={`${game.title} cover`} fill className="object-cover" sizes="42px" />
                </Link>
                <Link href={gameUrl(game)} onClick={() => remember(game)} className="min-w-0">
                  <strong className="block truncate text-xs font-bold text-white hover:text-[#c4b5fd]">{game.title}</strong>
                  <span className="mt-0.5 block truncate text-[11px] text-[#9ba2b3]">{formatPrice(lowestPrice(game))} · <span className="text-[#727a8c]">{availablePlatforms(game).join(" / ") || "Check availability"}</span></span>
                </Link>
                <button suppressHydrationWarning type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => quickAdd(game)} className="grid h-8 w-8 place-items-center rounded-md border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#c9bcff] transition hover:bg-[#8b5cf6] hover:text-white" aria-label={`Add ${game.title} to cart`}>
                  <Plus size={15} />
                </button>
              </article>
            ))}
            {!loading && query.trim().length >= 2 && !shown.length && (
              <div className="p-5 text-center">
                <Gamepad2 className="mx-auto text-[#9f7aea]" size={24} />
                <strong className="mt-2 block text-xs font-bold text-white">No matching games found</strong>
                <p className="mt-1 text-[11px] text-[#8f96a8]">Ask Rakexura to add it to the catalog.</p>
                <Link href={`/requests?game=${encodeURIComponent(query.trim())}`} className="btn btn-secondary mt-3 text-xs py-1.5">Request this game</Link>
              </div>
            )}
            {query.trim().length < 2 && (
              <div className="mt-1 flex items-center flex-wrap gap-2 border-t border-white/[.07] px-2 py-2">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-[#777f91]"><TrendingUp size={12} /> Explore</span>
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
                    className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-[#b6bdcc] hover:border-[#8b5cf6]/40 hover:bg-[#8b5cf6]/10 hover:text-white transition-all cursor-pointer font-medium"
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
