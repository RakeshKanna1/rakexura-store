"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Game } from "@/types/store";
import { GameCard } from "./game-card";

export function GameShelf({ 
  title, 
  subtitle, 
  games, 
  href = "/games",
  rows = 1,
}: { 
  title: string; 
  subtitle?: string; 
  games: Game[]; 
  href?: string;
  rows?: 1 | 2;
}) {
  if (!games.length) return null;

  const displayGames = rows === 2 ? games.slice(0, 12) : games.slice(0, 6);

  return (
    <section className="section-space w-full max-w-full overflow-hidden">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title font-black tracking-tight text-white">{title}</h2>
          {subtitle && <p className="muted mt-1 text-sm">{subtitle}</p>}
        </div>
        <Link href={href} className="flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#facc15] hover:text-white transition-colors">
          <span>View all</span> <ArrowRight size={13} />
        </Link>
      </div>
      <div
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        className={`hide-scrollbar grid w-full max-w-full auto-cols-[170px] grid-flow-col gap-4 overflow-x-auto pb-3 overscroll-x-contain sm:auto-cols-[210px] md:auto-cols-[240px] lg:grid-flow-row lg:grid-cols-6 lg:overflow-visible lg:pb-0 ${
          rows === 2 ? "lg:gap-y-6" : ""
        }`}
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",
        }}
      >
        {displayGames.map((game, index) => (
          <div
            key={game.id}
            className="min-w-0 h-full flex flex-col snap-start"
          >
            <GameCard game={game} priority={index < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}
