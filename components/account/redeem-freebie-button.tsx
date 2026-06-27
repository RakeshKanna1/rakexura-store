"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export function RedeemFreebieButton({ points, initialLastRequestDate, isApproved }: { points: number; initialLastRequestDate: string | null; isApproved?: boolean }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    if (initialLastRequestDate) {
      const lastRequest = new Date(initialLastRequestDate).getTime();
      const diff = Date.now() - lastRequest;
      if (diff < 24 * 60 * 60 * 1000) {
        setCooldown(true);
      }
    }
  }, [initialLastRequestDate]);

  const hasAccess = points >= 4000;

  async function handleRedeem() {
    if (!hasAccess || cooldown || working) return;
    setWorking(true);

    try {
      const res = await fetch("/api/rewards/request-freebie", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to process request");
      } else {
        toast.success("Request Pending - Checking verification status!");
        setCooldown(true);
        router.refresh();
      }
    } catch {
      toast.error("Network error, please try again.");
    } finally {
      setWorking(false);
    }
  }

  if (isApproved) {
    return (
      <button
        onClick={() => router.push("/games")}
        className="mt-4 w-full py-3 px-4 rounded-md text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 select-none border-2 border-[#facc15] bg-[#b89412]/10 text-white hover:bg-[#facc15] hover:text-black shadow-[0_0_15px_rgba(250,204,21,0.25)] hover:shadow-[0_0_25px_rgba(250,204,21,0.45)] cursor-pointer animate-pulse"
      >
        <Sparkles size={14} className="animate-bounce" />
        <span>Claim Your Free Game Reward</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleRedeem}
      disabled={!hasAccess || cooldown || working}
      className={`mt-4 w-full py-3 px-4 rounded-md text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 select-none ${
        hasAccess 
          ? cooldown
            ? "border border-amber-500/20 bg-amber-500/[.03] text-amber-200 cursor-not-allowed"
            : "border-2 border-[#facc15] bg-[#b89412]/10 text-white hover:bg-[#facc15] hover:text-black shadow-[0_0_15px_rgba(250,204,21,0.25)] hover:shadow-[0_0_25px_rgba(250,204,21,0.45)] cursor-pointer animate-pulse"
          : "border border-white/10 bg-transparent text-[#646b7b] cursor-not-allowed opacity-50"
      }`}
    >
      <Sparkles size={14} className={hasAccess && !cooldown ? "animate-bounce" : ""} />
      <span>
        {working
          ? "Processing Request..."
          : cooldown
            ? "Request Pending - 24h Cooldown Active"
            : hasAccess
              ? "Redeem High-Rank Reward Voucher"
              : "Voucher locked (Requires Diamond Rank)"}
      </span>
    </button>
  );
}
