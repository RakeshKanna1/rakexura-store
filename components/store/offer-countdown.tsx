"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

export function OfferCountdown({ end, inline = false }: { end?: string | null; inline?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (!end) return;
    const timer = window.setInterval(() => tick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [end]);

  if (!end) return null;

  const distance = mounted ? Math.max(0, new Date(end).getTime() - Date.now()) : 0;
  if (mounted && !distance) return null;

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  const formattedDays = days > 0 ? `${days}d ` : "";
  const formattedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const displayTime = mounted ? `${formattedDays}${formattedTime}` : "--:--:--";

  if (inline) {
    return (
      <span className="font-mono text-xs font-bold text-white bg-black/50 border border-white/10 px-2 py-0.5 rounded tracking-wide">
        {displayTime}
      </span>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs shadow-sm">
      <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-white text-[11px]">
        <Clock3 size={14} className="text-[#facc15]" /> Offer Ends In
      </span>
      <strong className="font-mono text-xs font-bold text-white bg-black/50 px-2.5 py-1 rounded border border-white/10 tracking-wider">
        {displayTime}
      </strong>
    </div>
  );
}
