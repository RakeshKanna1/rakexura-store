import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Bike, Car, Crosshair, Gamepad2, Ghost, Map, Swords, Trophy, WandSparkles } from "lucide-react";
import { getStoreCategories } from "@/lib/supabase/queries";

const iconMap: Record<string, LucideIcon> = { bike: Bike, car: Car, crosshair: Crosshair, gamepad: Gamepad2, ghost: Ghost, map: Map, swords: Swords, trophy: Trophy, wand: WandSparkles };

export async function CategoryRail() {
  const categories = await getStoreCategories();

  return <section className="section-space"><div className="section-head"><div><p className="eyebrow">Find your style</p><h2 className="section-title mt-2 font-semibold tracking-tight">Browse by category</h2></div></div><div className="hide-scrollbar grid auto-cols-[42%] grid-flow-col gap-3 overflow-x-auto pb-2 sm:auto-cols-[26%] lg:grid-flow-row lg:grid-cols-8">{categories.map(({ id, name, icon_key }) => {
    const Icon = iconMap[icon_key] ?? Gamepad2;
    return <Link key={id} href={`/games?category=${encodeURIComponent(name)}`} className="group relative overflow-hidden flex min-h-28 flex-col justify-between rounded-lg border border-amber-500/5 p-4 transition duration-300 hover:-translate-y-1 hover:border-[#facc15]/20 hover:shadow-[0_8px_20px_rgba(250,204,21,0.04)] active:scale-[0.97]" style={{ background: "linear-gradient(145deg, rgba(7, 7, 8, 0.95) 0%, rgba(22, 18, 10, 0.05) 100%)" }}>
      {/* Subtle neon purple tint background overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: "rgba(147, 51, 234, 0.0001)" }} />
      <Icon size={21} className="text-[#c084fc] group-hover:text-white transition-colors relative z-10" />
      <span className="text-sm font-medium relative z-10">{name}</span>
    </Link>;
  })}</div></section>;
}

