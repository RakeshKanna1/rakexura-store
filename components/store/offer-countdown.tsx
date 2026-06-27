"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

export function OfferCountdown({ end }: { end?: string | null }) {
  const [, tick] = useState(0);
  useEffect(() => { if (!end) return; const timer = window.setInterval(() => tick((value) => value + 1), 1000); return () => window.clearInterval(timer); }, [end]);
  if (!end) return null;
  const distance = Math.max(0, new Date(end).getTime() - Date.now());
  if (!distance) return null;
  const h = Math.floor(distance / 3_600_000); const m = Math.floor((distance / 60_000) % 60); const s = Math.floor((distance / 1000) % 60);
  return <div className="flex items-center justify-between rounded-md border border-[#ffb800]/15 bg-[#ffb800]/[.05] px-4 py-3 text-xs"><span className="flex items-center gap-2 font-bold text-[#ffca55]"><Clock3 size={15} /> Offer ends in</span><strong className="font-mono text-sm">{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</strong></div>;
}
