import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Game } from "@/types/store";
import { GameCard } from "./game-card";

export function GameShelf({ title, subtitle, games, href = "/games" }: { title: string; subtitle?: string; games: Game[]; href?: string }) {
  if (!games.length) return null;
  return (
    <section className="section-space w-full max-w-full overflow-hidden">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="muted mt-1 text-sm">{subtitle}</p>}
        </div>
        <Link href={href} className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#facc15] hover:text-white">
          View all <ArrowRight size={15} />
        </Link>
      </div>
      <div className="hide-scrollbar grid w-full max-w-full auto-cols-[170px] grid-flow-col gap-4 overflow-x-auto pb-3 sm:auto-cols-[210px] md:auto-cols-[240px] lg:grid-flow-row lg:grid-cols-5 xl:grid-cols-6 lg:overflow-visible lg:pb-0">
        {games.map((game, index) => (
          <GameCard key={game.id} game={game} priority={index < 2} />
        ))}
      </div>
    </section>
  );
}
