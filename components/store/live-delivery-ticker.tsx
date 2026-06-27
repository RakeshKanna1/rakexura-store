import { CheckCircle2 } from "lucide-react";
import type { RecentDelivery } from "@/types/store";

export function LiveDeliveryTicker({ deliveries }: { deliveries: RecentDelivery[] }) {
  if (!deliveries.length) return null;
  return <section className="mt-6 flex items-center gap-4 overflow-hidden rounded-md border border-emerald-400/10 bg-emerald-400/[.035] px-4 py-3"><span className="flex shrink-0 items-center gap-2 text-xs font-black uppercase tracking-wider text-[#70efbb]"><span className="status-dot h-2 w-2 rounded-full bg-[#00d68f]" /> Live</span><div className="hide-scrollbar flex gap-7 overflow-x-auto whitespace-nowrap text-sm text-[#b5bdcf]">{deliveries.map((delivery) => <span key={delivery.id} className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#00d68f]" />{delivery.public_label || `${delivery.game_title} delivered`}</span>)}</div></section>;
}
