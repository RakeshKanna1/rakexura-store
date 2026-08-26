import { CheckCircle2 } from "lucide-react";
import type { RecentDelivery } from "@/types/store";

export function LiveDeliveryTicker({ deliveries }: { deliveries: RecentDelivery[] }) {
  if (!deliveries.length) return null;
  return (
    <section className="mt-3.5 sm:mt-6 flex items-center gap-2.5 sm:gap-4 overflow-hidden rounded-lg border border-emerald-400/15 bg-emerald-400/[.035] px-3 sm:px-4 py-2 sm:py-2.5">
      <span className="flex shrink-0 items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#70efbb]">
        <span className="status-dot h-2 w-2 rounded-full bg-[#00d68f]" /> Live
      </span>
      <div className="hide-scrollbar flex gap-4 sm:gap-7 overflow-x-auto whitespace-nowrap text-xs sm:text-sm text-[#b5bdcf]">
        {deliveries.map((delivery) => (
          <span key={delivery.id} className="flex items-center gap-1.5 sm:gap-2 font-medium">
            <CheckCircle2 size={13} className="text-[#00d68f] shrink-0" />
            {delivery.public_label || `${delivery.game_title} delivered`}
          </span>
        ))}
      </div>
    </section>
  );
}
