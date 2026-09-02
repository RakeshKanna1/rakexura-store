"use client";

import { useEffect, useState } from "react";
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
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  if (!games.length) return null;

  const displayGames = rows === 2 ? games.slice(0, 12) : games.slice(0, 6);

  return (
    <section className="section-space w-full max-w-full overflow-hidden">
      <div className="mb-3 sm:mb-5 flex items-end justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="section-title font-black tracking-tight text-white">{title}</h2>
          {subtitle && <p className="muted mt-0.5 sm:mt-1 text-xs sm:text-sm">{subtitle}</p>}
        </div>
        <Link href={href} className="flex shrink-0 items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-[#facc15] hover:text-white transition-colors">
          <span>View all</span> <ArrowRight size={12} />
        </Link>
      </div>
      <div
        className={`hide-scrollbar grid w-full max-w-full auto-cols-[170px] grid-flow-col gap-4 overflow-x-auto pb-3 sm:auto-cols-[210px] md:auto-cols-[240px] lg:grid-flow-row lg:grid-cols-6 lg:overflow-visible lg:pb-0 ${
          rows === 2 ? "lg:gap-y-6" : ""
        }`}
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",
        }}
      >
        {displayGames.map((game, index) => {
          if (isDesktop) {
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "120px" }}
                transition={{
                  duration: 0.38,
                  delay: (index % 6) * 0.04,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="min-w-0 h-full flex flex-col"
              >
                <GameCard game={game} priority={index < 2} />
              </motion.div>
            );
          }

          return (
            <div key={game.id} className="min-w-0 h-full flex flex-col">
              <GameCard game={game} priority={index < 2} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
