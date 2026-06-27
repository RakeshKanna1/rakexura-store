"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock3, Gamepad2, Plus, Search, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { assetUrl, formatPrice, lowestPrice, matchesSearchQuery } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import type { Game } from "@/types/store";
import { availablePlatforms } from "./game-card";

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
  const [query, setQuery] = useState("");
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [results, setResults] = useState<Game[]>([]);
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading] = useState(false);
  const add = useCartStore((state) => state.add);

  useEffect(() => {
    let saved: string[] = [];
    try { saved = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { saved = []; }
    setRecent(saved);
    void createClient().from("games").select("*").or("archived.is.null,archived.eq.false").then(({ data }) => {
      const games = (data as Game[] | null) ?? [];
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
    
    const filtered = allGames.filter((game) =>
      matchesSearchQuery(game.title, value, game.tagline, game.description, game.genres)
    );
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
  return <div className="relative w-full"><label className="flex h-11 w-full items-center gap-3 rounded-md border border-white/[.09] bg-[#10131b] px-4 text-sm shadow-inner transition focus-within:border-[#8b5cf6]/65 focus-within:bg-[#141823] focus-within:shadow-[0_0_0_3px_rgba(139,92,246,.08)]"><Search size={17} className="shrink-0 text-[#9da5b8]" /><span className="sr-only">Search games</span><input value={query} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 180)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} placeholder="Search games, genres, platforms" className="min-w-0 flex-1 border-0 bg-transparent text-white outline-none placeholder:text-[#767e90]" /></label><AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -8, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5 }} className="absolute left-0 right-0 top-[calc(100%+9px)] z-[80] max-h-[72vh] overflow-y-auto rounded-md border border-white/10 bg-[#090c13]/98 p-2 shadow-[0_26px_80px_rgba(0,0,0,.65)] backdrop-blur-xl"><p className="flex items-center gap-2 px-2 py-2 text-[10px] font-black uppercase tracking-wider text-[#777f91]">{query.trim().length >= 2 ? <><Search size={13} /> Results</> : <><Clock3 size={13} /> Recently viewed and popular</>}</p>{loading && <p className="p-4 text-sm text-[#8f96a8]">Searching Rakexura...</p>}{!loading && shown.map((game) => <article key={game.id} className="grid grid-cols-[48px_minmax(0,1fr)_40px] items-center gap-3 rounded-md p-2 transition hover:bg-white/[.055]"><Link href={`/games/${game.id}`} onClick={() => remember(game)} className="relative h-14 overflow-hidden rounded-sm bg-black"><Image src={assetUrl(game.cover_image)} alt={`${game.title} cover`} fill className="object-cover" sizes="48px" /></Link><Link href={`/games/${game.id}`} onClick={() => remember(game)} className="min-w-0"><strong className="block truncate text-sm">{game.title}</strong><span className="mt-1 block truncate text-xs text-[#9ba2b3]">{formatPrice(lowestPrice(game))} · {availablePlatforms(game).join(" / ") || "Check availability"}</span></Link><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => quickAdd(game)} className="grid h-10 w-10 place-items-center rounded-md border border-[#8b5cf6]/30 text-[#c9bcff] transition hover:bg-[#8b5cf6] hover:text-white" aria-label={`Add ${game.title} to cart`}><Plus size={17} /></button></article>)}{!loading && query.trim().length >= 2 && !shown.length && <div className="p-5 text-center"><Gamepad2 className="mx-auto text-[#9f7aea]" /><strong className="mt-3 block text-sm">No matching game</strong><p className="mt-1 text-xs text-[#8f96a8]">Ask Rakexura to add it to the catalog.</p><Link href={`/requests?game=${encodeURIComponent(query.trim())}`} className="btn btn-secondary mt-4 text-xs">Request this game</Link></div>}{query.trim().length < 2 && <div className="mt-1 flex flex-wrap gap-2 border-t border-white/[.07] p-2 pt-3"><span className="flex items-center gap-1 text-[10px] font-black uppercase text-[#777f91]"><TrendingUp size={12} /> Explore</span>{trendingTerms.map((term) => <button key={term} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setQuery(term)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#b6bdcc] hover:border-[#8b5cf6]/40">{term}</button>)}</div>}</motion.div>}</AnimatePresence></div>;
}
