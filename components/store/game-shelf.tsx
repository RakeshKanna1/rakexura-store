"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
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
        className={`hide-scrollbar grid w-full max-w-full auto-cols-[170px] grid-flow-col gap-4 overflow-x-auto pb-3 sm:auto-cols-[210px] md:auto-cols-[240px] lg:grid-flow-row lg:grid-cols-6 lg:overflow-visible lg:pb-0 ${
          rows === 2 ? "lg:gap-y-6" : ""
        }`}
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",
        }}
      >
        {displayGames.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{
              duration: 0.38,
              delay: (index % 6) * 0.04,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="min-w-0 h-full flex flex-col snap-start"
          >
            <GameCard game={game} priority={index < 2} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
