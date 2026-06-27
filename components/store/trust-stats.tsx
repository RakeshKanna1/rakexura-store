"use client";

import { BadgeCheck, Headphones, ShieldCheck, Zap } from "lucide-react";
import { AnimatedCounter } from "@/components/animations/animated-counter";

const stats = [
  { icon: BadgeCheck, value: 1000, suffix: "+", label: "orders completed" },
  { icon: Zap, value: 95, suffix: "%", label: "same-day responses" },
  { icon: ShieldCheck, value: 100, suffix: "%", label: "protected tracking" },
  { icon: Headphones, value: 24, suffix: "/7", label: "support access" },
];

export function TrustStats() {
  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/[.06] bg-white/[.04] lg:grid-cols-4">
      {stats.map(({ icon: Icon, value, suffix, label }) => (
        <article key={label} className="relative overflow-hidden border border-amber-500/5 backdrop-blur-md p-5 md:p-6 transition-all duration-300 hover:shadow-[inset_0_0_12px_rgba(250,204,21,0.04)] group" style={{ background: "linear-gradient(145deg, rgba(7, 7, 8, 0.95) 0%, rgba(22, 18, 10, 0.05) 100%)" }}>
          {/* Subtle neon purple tint background overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: "rgba(147, 51, 234, 0.0001)" }} />
          {/* Border glow on hover */}
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#facc15]/30 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          
          <Icon size={20} className="mb-7 text-[#facc15] filter drop-shadow-[0_0_4px_rgba(250,204,21,0.2)]" />
          <strong className="block text-2xl md:text-3xl text-white">
            <AnimatedCounter value={value} suffix={suffix} />
          </strong>
          <span className="mt-1 block text-xs text-[#8991a6] font-medium">{label}</span>
        </article>
      ))}
    </section>
  );
}
