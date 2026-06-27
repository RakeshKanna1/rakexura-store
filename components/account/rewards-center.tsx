"use client";

import { Copy, Gift, Link2, Sparkles, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Offer = { id: number; title: string; points_cost: number };

export function RewardsCenter({ points, offers, initialCode }: { points: number; offers: Offer[]; initialCode?: string | null }) {
  const router = useRouter();
  const [claimCode, setClaimCode] = useState("");
  const [referralCode, setReferralCode] = useState(initialCode ?? "");
  const [working, setWorking] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    router.refresh();
    if (typeof window !== "undefined") {
      const lastRequest = localStorage.getItem("last_diamond_request");
      if (lastRequest) {
        const diff = Date.now() - Number(lastRequest);
        if (diff < 24 * 60 * 60 * 1000) {
          setCooldown(true);
        }
      }
    }
  }, [router]);

  async function requestDiamondCode() {
    if (cooldown) return;
    setWorking("request-diamond");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setWorking(null);
      return toast.error("Sign in to request Diamond code");
    }

    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      subject: "Request Diamond Code",
      message: `User ${user.email} (points: ${points}) has requested a high-value manual voucher code.`
    });

    setWorking(null);
    if (error) return toast.error(error.message);

    if (typeof window !== "undefined") {
      localStorage.setItem("last_diamond_request", String(Date.now()));
    }
    setCooldown(true);
    toast.success("Request sent successfully! A waiting period of 24 hours has been applied.");
  }

  async function redeem(offer: Offer) {
    setWorking(`offer-${offer.id}`);
    const { data, error } = await createClient().rpc("redeem_reward_offer", { p_offer_id: offer.id });
    setWorking(null);
    if (error) return toast.error(error.message);
    toast.success(data || "Reward redeemed");
    router.refresh();
  }
  async function createCode() {
    setWorking("create-code");
    const { data, error } = await createClient().rpc("get_or_create_referral_code");
    setWorking(null);
    if (error) return toast.error(error.message);
    setReferralCode(String(data));
    toast.success("Referral code ready");
  }
  async function claim() {
    if (!claimCode.trim()) return toast.error("Enter a referral code");
    setWorking("claim");
    const { data, error } = await createClient().rpc("claim_referral", { p_code: claimCode.trim() });
    setWorking(null);
    if (error) return toast.error(error.message);
    setClaimCode("");
    toast.success(data || "Referral linked");
    router.refresh();
  }
  async function copy() {
    await navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied");
  }

  // Rank Ceiling Calculation (Capped at exactly 10,000 points)
  const rankCeiling = 10000;
  const progressPercentage = Math.min(100, (points / rankCeiling) * 100);

  let currentRank = "Bronze";
  let nextRank = "Silver";
  let nextPoints = 1000;

  if (points >= 10000) {
    currentRank = "Platinum";
    nextRank = "Max Rank";
    nextPoints = 10000;
  } else if (points >= 4000) {
    currentRank = "Diamond";
    nextRank = "Platinum";
    nextPoints = 10000;
  } else if (points >= 2000) {
    currentRank = "Gold";
    nextRank = "Diamond";
    nextPoints = 4000;
  } else if (points >= 1000) {
    currentRank = "Silver";
    nextRank = "Gold";
    nextPoints = 2000;
  }

  return (
    <div className="space-y-6">
      {/* Visual Rank Progression Progress Bar Card */}
      <section className="premium-panel rounded-md p-6 bg-[#0f0c22]/80 border-[#8b5cf6]/20 shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
        <p className="eyebrow text-[#b9a4ff] flex items-center gap-1.5"><Trophy size={14} /> Loyalty Rank & Progression</p>
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-end gap-2">
              <strong className="text-4xl text-white">{points.toLocaleString()}</strong>
              <span className="pb-1 text-sm text-[#8991a6]">/ 10,000 points</span>
            </div>
            <p className="mt-1.5 text-xs text-[#aeb5c6]">
              Current Rank: <strong className="text-[#b9a4ff] uppercase tracking-wide">{currentRank}</strong>
            </p>
          </div>
          {points < 10000 ? (
            <div className="text-left md:text-right">
              <span className="text-xs text-[#8991a6]">Next Rank Milestone:</span>
              <p className="text-xs font-bold text-white mt-1">
                {nextPoints - points} points to <span className="text-[#facc15] font-black">{nextRank}</span>
              </p>
            </div>
          ) : (
            <div className="text-left md:text-right">
              <span className="text-xs text-[#70efbb] font-black uppercase tracking-wider block drop-shadow-[0_0_8px_rgba(112,239,187,0.35)]">★ Platinum Pinnacle Reached ★</span>
            </div>
          )}
        </div>

        {/* Dynamic Progress Bar Container */}
        <div className="mt-6">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-black/45 border border-white/5">
            <div
              style={{ width: `${progressPercentage}%` }}
              className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#a78bfa] to-[#facc15] shadow-[0_0_12px_rgba(139,92,246,0.5)] transition-all duration-500"
            />
          </div>
          <div className="mt-2.5 flex justify-between text-[10px] font-black tracking-wider text-[#646b7b] uppercase">
            <span>Bronze (0)</span>
            <span>Silver (1K)</span>
            <span>Gold (2K)</span>
            <span>Diamond (4K)</span>
            <span>Platinum (10K)</span>
          </div>
        </div>
      </section>

      {/* High-rank support button ("Request Diamond Code") with 1-day cooldown */}
      {points >= 4000 && (
        <section className="premium-panel rounded-xl p-6 bg-[#0f0c22]/80 border-[#8b5cf6]/20 shadow-[0_12px_36px_rgba(0,0,0,0.3)]">
          <h2 className="font-black flex items-center gap-2 text-white">
            <Sparkles className="text-[#facc15]" size={18} /> High-Rank Diamond Perk
          </h2>
          <p className="mt-2 text-sm text-[#8991a6]">
            As a Diamond or Platinum member, you are eligible to request a manual high-value voucher code directly from the administrators.
          </p>
          <button
            onClick={requestDiamondCode}
            disabled={cooldown || working === "request-diamond"}
            className="btn btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-75 relative overflow-hidden group font-extrabold"
          >
            {cooldown ? "Request sent, you can ask again tomorrow" : "Request Diamond Code"}
          </button>
        </section>
      )}

      {/* Redeem rewards offers panel */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Gift className="text-[#facc15]" />
          <h2 className="text-xl font-black">Redeem rewards</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <article key={offer.id} className="premium-panel rounded-md p-5 bg-[#0f0c22]/40 border-[#8b5cf6]/10">
              <Sparkles size={18} className="text-[#ffb800]" />
              <h3 className="mt-4 font-black">{offer.title}</h3>
              <p className="mt-2 text-sm text-[#8991a6]">{offer.points_cost} points</p>
              <button
                onClick={() => redeem(offer)}
                disabled={working !== null || points < offer.points_cost}
                className="btn btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-45"
              >
                {working === `offer-${offer.id}` ? "Redeeming..." : "Redeem"}
              </button>
            </article>
          ))}
          {!offers.length && (
            <p className="rounded-md border border-white/[.08] p-6 text-sm text-[#8991a6]">
              Reward offers will appear here when enabled by Rakexura.
            </p>
          )}
        </div>
      </section>

      {/* Referrals linking & codes */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="premium-panel rounded-md p-6 bg-[#0f0c22]/40 border-[#8b5cf6]/10">
          <div className="flex items-center gap-2">
            <Link2 className="text-[#facc15]" />
            <h2 className="font-black">Share your referral</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#8991a6]">
            Both accounts earn points after the referred customer receives their first delivered order.
          </p>
          {referralCode ? (
            <button onClick={copy} className="mt-5 flex min-h-12 w-full items-center justify-between rounded-md border border-[#8b5cf6]/20 bg-black/25 px-4 font-black text-white hover:bg-black/35 transition-colors">
              <span>{referralCode}</span>
              <Copy size={16} className="text-[#b9a4ff]" />
            </button>
          ) : (
            <button onClick={createCode} disabled={working !== null} className="btn btn-primary mt-5 w-full">
              {working === "create-code" ? "Creating..." : "Create referral code"}
            </button>
          )}
        </div>

        <div className="premium-panel rounded-md p-6 bg-[#0f0c22]/40 border-[#8b5cf6]/10">
          <h2 className="font-black">Have a referral code?</h2>
          <p className="mt-3 text-sm text-[#8991a6]">Link it before your first delivered order.</p>
          <div className="mt-5 flex gap-2">
            <input
              value={claimCode}
              onChange={(event) => setClaimCode(event.target.value.toUpperCase())}
              placeholder="RKX-XXXXXXXX"
              className="h-12 min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-4 outline-none focus:border-[#facc15] text-white"
            />
            <button onClick={claim} disabled={working !== null} className="btn btn-secondary">
              {working === "claim" ? "Linking..." : "Link"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
