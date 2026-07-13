"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { lowestPrice, matchesSearchQuery } from "@/lib/utils";
import { GameCard, availablePlatforms } from "./game-card";
import { QuickViewModal } from "./quick-view-modal";
import type { Game, Platform } from "@/types/store";

const platforms: Array<"All" | Platform | "Online Activation" | "Pre-orders" | "Subscriptions"> = ["All", "Steam", "Epic", "Xbox", "Nvidia GeForce", "Online Activation", "Pre-orders", "Subscriptions"];
const sorts = ["Featured", "Price: Low to high", "Price: High to low", "Best sellers", "Latest"] as const;

export function Catalog({ games }: { games: Game[] }) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<(typeof platforms)[number]>("All");
  const [genre, setGenre] = useState(searchParams.get("category") ?? "All");
  const [budget, setBudget] = useState("All");
  const [sort, setSort] = useState<(typeof sorts)[number]>("Featured");
  const [quickView, setQuickView] = useState<Game | null>(null);
  const genres = useMemo(() => ["All", ...new Set(games.flatMap((game) => game.genres ?? []).filter(Boolean))], [games]);
  const selectedGenre = genres.includes(genre) ? genre : "All";
  const filtered = useMemo(() => {
    const result = games.filter((game) => {
      const price = lowestPrice(game);
      const matchesText = matchesSearchQuery(game.title, query, game.tagline, game.description, game.genres);
      
      let matchesPlatform = true;
      if (platform !== "All") {
        if (platform === "Pre-orders") {
          matchesPlatform = Boolean(game.preorder);
        } else if (platform === "Subscriptions") {
          matchesPlatform = Boolean(game.is_subscription);
        } else if (platform === "Online Activation") {
          matchesPlatform = Boolean(game.online_activation);
        } else {
          matchesPlatform = availablePlatforms(game).includes(platform as Platform) && !game.preorder;
        }
      }
      
      const matchesGenre = selectedGenre === "All" || game.genres?.includes(selectedGenre);
      const matchesBudget = budget === "All" || (budget === "Under Rs. 99" ? price <= 99 : budget === "Rs. 100-199" ? price >= 100 && price <= 199 : price >= 200);
      return matchesText && matchesPlatform && matchesGenre && matchesBudget;
    });
    return result.sort((a, b) => {
      if (sort === "Price: Low to high") return lowestPrice(a) - lowestPrice(b);
      if (sort === "Price: High to low") return lowestPrice(b) - lowestPrice(a);
      if (sort === "Best sellers") return Number(b.featured_deal) - Number(a.featured_deal);
      if (sort === "Latest") return Number(b.id) - Number(a.id);
      return Number(b.show_in_featured || b.featured) - Number(a.show_in_featured || a.featured);
    });
  }, [budget, games, platform, query, selectedGenre, sort]);

  return <><div className="mb-6 space-y-3 rounded-md border border-white/[.08] bg-[#11131a] p-3"><div className="flex flex-col gap-3 md:flex-row"><label className="flex min-h-12 flex-1 items-center gap-3 rounded-md bg-black/20 px-4"><Search size={18} className="text-[#8991a6]" /><span className="sr-only">Search games</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by game, genre or tag" className="w-full border-0 bg-transparent text-white outline-none placeholder:text-[#737b90]" /></label><label className="flex min-h-12 items-center gap-2 rounded-md bg-black/20 px-4 text-sm"><SlidersHorizontal size={17} className="text-[#facc15]" /><span className="sr-only">Sort games</span><select value={sort} onChange={(event) => setSort(event.target.value as (typeof sorts)[number])} className="min-w-44 bg-[#0c0d10] outline-none">{sorts.map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">{platforms.map((item) => <button key={item} onClick={() => setPlatform(item)} className={`btn h-9 min-h-9 shrink-0 px-4 text-xs ${platform === item ? "bg-[#facc15] text-black" : "btn-secondary"}`}>{item}</button>)}</div><div className="grid gap-2 sm:grid-cols-2"><label className="flex items-center justify-between rounded-md bg-black/20 px-4 text-xs font-semibold text-[#a0a8c0]">Category<select value={selectedGenre} onChange={(event) => setGenre(event.target.value)} className="h-10 max-w-[65%] bg-[#0c0d10] text-white outline-none">{genres.map((item) => <option key={item}>{item}</option>)}</select></label><label className="flex items-center justify-between rounded-md bg-black/20 px-4 text-xs font-semibold text-[#a0a8c0]">Budget<select value={budget} onChange={(event) => setBudget(event.target.value)} className="h-10 max-w-[65%] bg-[#0c0d10] text-white outline-none"><option>All</option><option>Under Rs. 99</option><option>Rs. 100-199</option><option>Rs. 200+</option></select></label></div></div><p className="mb-5 text-sm text-[#8991a6]">{filtered.length} {filtered.length === 1 ? "game" : "games"}</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">{filtered.map((game) => <GameCard key={game.id} game={game} onQuickView={setQuickView} />)}</div>{!filtered.length && <div className="my-20 text-center"><h2>No matching games</h2><p className="text-[#8991a6]">Try another title, category, price, or platform.</p></div>}<QuickViewModal game={quickView} onClose={() => setQuickView(null)} /></>;
}
