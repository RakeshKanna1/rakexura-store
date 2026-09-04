"use client";

import { Search, SlidersHorizontal, ChevronDown, Share2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
import { lowestPrice, matchesSearchQuery, isPreorderActive } from "@/lib/utils";
import { GameCard, availablePlatforms } from "./game-card";
import { QuickViewModal } from "./quick-view-modal";
import { CopyablePriceModal } from "./copyable-price-modal";
import type { Game, Bundle, Platform } from "@/types/store";

import { createClient } from "@/lib/supabase/client";
import { OWNER_EMAIL } from "@/lib/config";

const platforms: Array<"All" | Platform | "Pre-orders" | "Subscriptions"> = ["All", "Steam", "Epic", "Offline", "Online", "Xbox", "Nvidia GeForce", "Pre-orders", "Subscriptions"];
const sorts = ["Featured", "Price: Low to high", "Price: High to low", "Best sellers", "Latest"] as const;

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: readonly string[] | string[];
  className?: string;
}

function CustomSelect({ value, onChange, options, className = "" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative select-none ${className}`} ref={dropdownRef}>
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md bg-[#090b10] border border-white/5 hover:border-white/15 px-3.5 text-xs font-bold text-white transition-all focus:outline-none cursor-pointer"
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={14} className={`text-[#facc15] transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div data-lenis-prevent className="absolute left-0 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-[#0d1016] shadow-2xl py-1 z-50 custom-scrollbar">
          {options.map((option) => (
            <button
              type="button"
              suppressHydrationWarning
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`flex w-full items-center px-3 py-2 text-left text-xs transition-colors hover:bg-[#facc15] hover:text-black ${
                value === option ? "text-[#facc15] font-black" : "text-[#8991a6]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Catalog({ games, bundles = [] }: { games: Game[]; bundles?: Bundle[] }) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<(typeof platforms)[number]>("All");
  const [genre, setGenre] = useState("All");
  const [budget, setBudget] = useState("All");
  const [sort, setSort] = useState<(typeof sorts)[number]>("Featured");
  const [quickView, setQuickView] = useState<Game | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function checkAdminStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const ownerEmail = (process.env.NEXT_PUBLIC_OWNER_EMAIL || OWNER_EMAIL).trim().toLowerCase();
      const isOwner = user.email?.toLowerCase() === ownerEmail;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      setIsAdmin(isOwner || profile?.role === "admin");
    }

    void checkAdminStatus();

    const { data: listener } = supabase.auth.onAuthStateChange(() => void checkAdminStatus());
    const refresh = () => void checkAdminStatus();
    window.addEventListener("rakexura-role-updated", refresh);
    window.addEventListener("rakexura-auth-updated", refresh);
    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("rakexura-role-updated", refresh);
      window.removeEventListener("rakexura-auth-updated", refresh);
    };
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setGenre(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    setVisibleCount(24);
  }, [query, platform, genre, budget, sort]);

  const genres = useMemo(() => ["All", ...new Set(games.flatMap((game) => game.genres ?? []).filter(Boolean))], [games]);
  const selectedGenre = genres.includes(genre) ? genre : "All";
  const filtered = useMemo(() => {
    const result = games.filter((game) => {
      const price = lowestPrice(game);
      const matchesText = matchesSearchQuery(game.title, query, game.tagline, game.description, game.genres);
      
      let matchesPlatform = true;
      if (platform !== "All") {
        if (platform === "Pre-orders") {
          matchesPlatform = isPreorderActive(game);
        } else if (platform === "Subscriptions") {
          matchesPlatform = Boolean(game.is_subscription);
        } else if (platform === "Online") {
          matchesPlatform = availablePlatforms(game).includes("Online" as Platform) || 
            Number(game.online_price ?? 0) > 0 ||
            Boolean(game.online_activation);
        } else {
          matchesPlatform = availablePlatforms(game).includes(platform as Platform) && !isPreorderActive(game);
        }
      }
      
      const matchesGenre = selectedGenre === "All" || game.genres?.includes(selectedGenre);
      const matchesBudget = budget === "All" || (budget === "Under ₹99" || budget === "Under Rs. 99" ? price <= 99 : budget === "₹100 - ₹199" || budget === "Rs. 100-199" ? price >= 100 && price <= 199 : price >= 200);
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

  return (
    <>
      <div className="mb-4 sm:mb-6 space-y-2.5 rounded-xl border border-white/[.08] bg-[#0c0e16] p-3 sm:p-4 shadow-xl">
        {/* Search & Sort Row */}
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row items-center">
          <label className="flex min-h-10 sm:min-h-11 flex-1 items-center gap-2.5 rounded-lg bg-black/40 px-3.5 w-full border border-white/[0.08] focus-within:border-[#facc15]/40 transition-colors">
            <Search size={16} className="text-[#8991a6] shrink-0" />
            <span className="sr-only">Search games</span>
            <input
              suppressHydrationWarning
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search games, genres, tags..."
              className="w-full border-0 bg-transparent text-xs sm:text-sm text-white outline-none placeholder:text-[#676f84]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-xs text-[#8991a6] hover:text-white px-1 font-bold"
              >
                ✕
              </button>
            )}
          </label>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex min-h-10 sm:min-h-11 flex-1 md:flex-none items-center gap-2 rounded-lg bg-black/40 px-3 text-xs sm:text-sm min-w-0 border border-white/[0.08]">
              <SlidersHorizontal size={14} className="text-[#facc15] shrink-0" />
              <span className="sr-only">Sort games</span>
              <CustomSelect
                value={sort}
                onChange={(val) => setSort(val as (typeof sorts)[number])}
                options={sorts}
                className="w-full sm:w-44 min-w-0"
              />
            </div>
            {isAdmin && (
              <div className="flex min-h-10 sm:min-h-11 items-center gap-2 rounded-lg bg-black/40 px-3 shrink-0 border border-white/[0.08]">
                <Share2 size={14} className="text-[#facc15] shrink-0" />
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setIsCopyModalOpen(true)}
                  title="Copy formatted price list for WhatsApp/Telegram"
                  className="flex h-7 sm:h-8 items-center justify-center rounded-md bg-[#090b10] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] px-2.5 text-[11px] font-bold text-white transition-all cursor-pointer"
                >
                  <span className="whitespace-nowrap hidden min-[400px]:inline">Copy Price List</span>
                  <span className="whitespace-nowrap min-[400px]:hidden">Copy Price</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Platform Horizontal Swipe Bar */}
        <div className="relative -mx-1 px-1">
          <div
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="hide-scrollbar flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 pt-0.5 overscroll-x-contain"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
          >
            {platforms.map((item) => (
              <button
                suppressHydrationWarning
                key={item}
                onClick={() => setPlatform(item)}
                className={`inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-3.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  platform === item
                    ? "bg-[#facc15] text-[#080a10] font-black shadow-[0_0_12px_rgba(250,204,21,0.25)] border border-[#facc15]"
                    : "bg-[#121622] text-[#9da5b8] border border-white/[0.07] hover:border-white/20 hover:text-white hover:bg-[#181d2c] active:scale-95"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Budget Selectors */}
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-lg bg-black/40 px-3 sm:px-4 py-1.5 sm:py-2 text-xs text-[#a0a8c0] border border-white/[0.08]">
            <span className="text-xs font-bold text-white">Category</span>
            <CustomSelect
              value={selectedGenre}
              onChange={(val) => setGenre(val)}
              options={genres}
              className="w-44 max-w-[65%]"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-black/40 px-3 sm:px-4 py-1.5 sm:py-2 text-xs text-[#a0a8c0] border border-white/[0.08]">
            <span className="text-xs font-bold text-white">Budget</span>
            <CustomSelect
              value={budget}
              onChange={(val) => setBudget(val)}
              options={["All", "Under ₹99", "₹100 - ₹199", "₹200+"]}
              className="w-44 max-w-[65%]"
            />
          </label>
        </div>
      </div>

      {/* Active Results & Reset Action */}
      <div className="mb-3 sm:mb-5 flex items-center justify-between">
        <p className="text-xs font-medium text-[#8991a6]">
          {filtered.length} {filtered.length === 1 ? "game available" : "games available"}
        </p>
        {(query || platform !== "All" || selectedGenre !== "All" || budget !== "All") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setPlatform("All");
              setGenre("All");
              setBudget("All");
            }}
            className="text-xs font-bold text-[#facc15] hover:underline cursor-pointer"
          >
            Reset filters ✕
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.slice(0, visibleCount).map((game) => (
          <GameCard key={game.id} game={game} onQuickView={setQuickView} />
        ))}
      </div>
      {filtered.length > visibleCount && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setVisibleCount((prev) => prev + 24)}
            className="btn btn-secondary px-8 py-3 text-sm font-bold tracking-wide cursor-pointer"
          >
            Load More Games
          </button>
        </div>
      )}
      {!filtered.length && (
        <div className="my-20 text-center">
          <h2>No matching games</h2>
          <p className="text-[#8991a6]">Try another title, category, price, or platform.</p>
        </div>
      )}
      <QuickViewModal game={quickView} onClose={() => setQuickView(null)} />
      {isAdmin && (
        <CopyablePriceModal
          games={games}
          bundles={bundles}
          isOpen={isCopyModalOpen}
          onClose={() => setIsCopyModalOpen(false)}
        />
      )}
    </>
  );
}
