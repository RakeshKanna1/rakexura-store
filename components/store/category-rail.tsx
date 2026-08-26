import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Bike, Car, Crosshair, Gamepad2, Ghost, Map, Swords, Trophy, WandSparkles } from "lucide-react";
import { getStoreCategories } from "@/lib/supabase/queries";

const iconMap: Record<string, LucideIcon> = { bike: Bike, car: Car, crosshair: Crosshair, gamepad: Gamepad2, ghost: Ghost, map: Map, swords: Swords, trophy: Trophy, wand: WandSparkles };

export async function CategoryRail() {
  const categories = await getStoreCategories();

  return (
    <section className="section-space">
      <div className="section-head">
        <div>
          <p className="eyebrow">Find your style</p>
          <h2 className="section-title mt-2 font-semibold tracking-tight">Browse by category</h2>
        </div>
      </div>
      <div
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        className="hide-scrollbar grid auto-cols-[125px] sm:auto-cols-[140px] grid-flow-col gap-2.5 overflow-x-auto pb-2 sm:gap-3 lg:grid-flow-row lg:grid-cols-8"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
      >
        {categories.map(({ id, name, icon_key }) => {
          const Icon = iconMap[icon_key] ?? Gamepad2;
          return (
            <Link
              key={id}
              href={`/games?category=${encodeURIComponent(name)}`}
              className="group relative overflow-hidden flex min-h-[82px] sm:min-h-[96px] flex-col justify-between rounded-xl border border-white/[.07] p-3 sm:p-3.5 transition duration-300 hover:-translate-y-0.5 hover:border-[#facc15]/30 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] active:scale-[0.97] bg-[#0d0f17] hover:bg-[#121622]"
            >
              <Icon size={20} className="text-[#c084fc] group-hover:text-[#facc15] transition-colors relative z-10" />
              <span className="text-xs sm:text-[13px] font-bold relative z-10 text-white group-hover:text-[#facc15] transition-colors truncate block">{name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

