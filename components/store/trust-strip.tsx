"use client";

import { BadgeCheck, KeyRound } from "lucide-react";
import { BatteryPlusIcon, PlugConnectedIcon, ArrowDownloadIcon } from "@/components/icons/animated";

const points = [
  { icon: BadgeCheck, value: "Verified", label: "payment review", isCustom: false },
  { icon: BatteryPlusIcon, value: "Instant", label: "assisted delivery", isCustom: true },
  { icon: ArrowDownloadIcon, value: "Secure", label: "order key tracking", isCustom: true },
  { icon: PlugConnectedIcon, value: "Live Sync", label: "WhatsApp support", isCustom: true }
];

export function TrustStrip() {
  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[.07] bg-white/[.07] lg:grid-cols-4">
      {points.map(({ icon: Icon, value, label, isCustom }) => (
        <article key={value} className="group flex items-center gap-4 bg-[#0b0e17] p-5 transition-colors hover:bg-[#101422]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] transition-all group-hover:border-[#facc15]/40 group-hover:bg-[#facc15]/10">
            <Icon className="text-[#facc15] transition-transform group-hover:scale-110" size={20} />
          </div>
          <div>
            <strong className="block text-sm text-white group-hover:text-[#facc15] transition-colors">{value}</strong>
            <span className="text-xs text-[#8790a8]">{label}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

