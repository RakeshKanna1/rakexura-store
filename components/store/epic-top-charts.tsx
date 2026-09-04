"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { assetUrl, formatPrice, gameUrl, isPreorderActive } from "@/lib/utils";
import type { Game } from "@/types/store";

interface EpicTopChartsProps {
  bestSellers?: Game[];
  trending?: Game[];
  newReleases?: Game[];
}

function getGamePrice(game: Game) {
  const prices = [
    game.steam_price,
    game.epic_price,
    game.offline_price,
    game.online_price,
    game.xbox_price,
    game.geforce_price,
  ]
    .map(Number)
    .filter((v) => v > 0);

  return prices.length ? Math.min(...prices) : Number(game.sale_price ?? 0);
}

function ChartColumn({
  title,
  games = [],
  viewAllHref,
  columnIndex = 0,
}: {
  title: string;
  games?: Game[];
  viewAllHref: string;
  columnIndex?: number;
}) {
  const safeGames = Array.isArray(games) ? games : [];
  const topFive = safeGames.slice(0, 5);
  if (!topFive.length) return null;

  const paddingClass =
    columnIndex === 0
      ? "md:pr-7 lg:pr-9"
      : columnIndex === 1
      ? "md:px-7 lg:px-9"
      : "md:pl-7 lg:pl-9";

  return (
    <div className={`flex flex-col w-full py-2 sm:py-0 ${paddingClass}`}>
      {/* Epic Games Column Header: Clean title with inline chevron */}
      <Link
        href={viewAllHref}
        className="group/header inline-flex items-center gap-1.5 text-[15px] sm:text-[16px] font-bold text-white hover:text-[#facc15] transition-colors mb-3 cursor-pointer w-fit"
      >
        <span>{title}</span>
        <ChevronRight
          size={16}
          className="text-zinc-400 group-hover/header:text-[#facc15] group-hover/header:translate-x-0.5 transition-all"
        />
      </Link>

      {/* Top 5 Ranked Rows (Exact Epic Stack Layout) */}
      <div className="flex flex-col gap-2 w-full">
        {topFive.map((game) => {
          const price = getGamePrice(game);
          const original = Number(game.original_price ?? 0);
          const discount = original > price ? Math.round(((original - price) / original) * 100) : 0;
          const isPreorder = isPreorderActive(game);

          return (
            <Link
              key={game.id}
              href={gameUrl(game)}
              className="group flex items-center gap-3 p-1.5 -mx-1.5 rounded-md hover:bg-white/[0.05] transition-colors cursor-pointer w-full"
            >
              {/* Epic 3:4 Poster Thumbnail */}
              <div className="relative w-[48px] h-[64px] shrink-0 overflow-hidden rounded-[4px] bg-[#202024] shadow-sm">
                <Image
                  src={assetUrl(game.cover_image)}
                  alt={game.title}
                  width={96}
                  height={128}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Game Info Stack directly next to poster */}
              <div className="min-w-0 flex-1">
                <h4 className="line-clamp-1 text-[13.5px] sm:text-[14px] font-bold text-white group-hover:text-[#facc15] transition-colors leading-tight">
                  {game.title}
                </h4>

                {/* Subtitle / Pricing row right under title */}
                <div className="mt-1 flex items-center gap-1.5 text-[12px]">
                  {isPreorder ? (
                    <span className="text-[#8f8f96] font-normal">Coming Soon</span>
                  ) : discount > 0 ? (
                    <>
                      <span className="rounded-[3px] bg-[#0074e4] px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                        -{discount}%
                      </span>
                      {original > price && (
                        <del className="text-[11.5px] text-[#8f8f96] font-normal">
                          {formatPrice(original)}
                        </del>
                      )}
                      <span className="text-[13px] font-semibold text-white">
                        {formatPrice(price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[13px] font-semibold text-white">
                      {price ? formatPrice(price) : "Free"}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function EpicTopCharts({ 
  bestSellers = [], 
  trending = [], 
  newReleases = [] 
}: EpicTopChartsProps) {
  // Safe fallbacks to guarantee 3 populated columns
  const col1 = bestSellers.length >= 5 ? bestSellers : (bestSellers.concat(newReleases)).slice(0, 5);
  const col2 = trending.length >= 5 ? trending : (trending.concat(bestSellers)).slice(0, 5);
  const col3 = newReleases.length >= 5 ? newReleases : (newReleases.concat(trending)).slice(0, 5);

  return (
    <section className="section-space w-full max-w-full" aria-label="Top Charts">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-white/10 gap-y-8 md:gap-y-0 w-full">
        {/* Column 1: Top Sellers */}
        <ChartColumn
          title="Top Sellers"
          games={col1}
          viewAllHref="/games?sort=bestselling"
          columnIndex={0}
        />

        {/* Column 2: Top Upcoming Wishlisted */}
        <ChartColumn
          title="Top Upcoming Wishlisted"
          games={col2}
          viewAllHref="/games?sort=trending"
          columnIndex={1}
        />

        {/* Column 3: Top New Releases */}
        <ChartColumn
          title="Top New Releases"
          games={col3}
          viewAllHref="/games?sort=newest"
          columnIndex={2}
        />
      </div>
    </section>
  );
}
