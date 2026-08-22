"use client";

import { useState, useMemo } from "react";
import { Award, Crown, Medal, Trophy, Sparkles, Search, Phone, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { adjustRewardPoints } from "@/app/admin/actions";

const rankStyle: Record<string, { badge: string; text: string; border: string }> = {
  Bronze: { badge: "bg-amber-950/40 text-amber-500 border-amber-800/40", text: "text-amber-500", border: "border-amber-500/20" },
  Silver: { badge: "bg-slate-800/40 text-slate-300 border-slate-700/50", text: "text-slate-300", border: "border-slate-400/20" },
  Gold: { badge: "bg-yellow-950/40 text-yellow-400 border-yellow-700/40", text: "text-yellow-400", border: "border-yellow-500/20" },
  Diamond: { badge: "bg-cyan-950/40 text-cyan-400 border-cyan-700/40", text: "text-cyan-400", border: "border-cyan-500/20" },
  Platinum: { badge: "bg-purple-950/40 text-[#b9a4ff] border-purple-700/40 font-black", text: "text-[#b9a4ff]", border: "border-[#b9a4ff]/30" },
};

const tiers: Array<[string, string, LucideIcon]> = [
  ["Bronze", "0-999", Medal],
  ["Silver", "1,000-1,999", Award],
  ["Gold", "2,000-3,999", Trophy],
  ["Diamond", "4,000-9,999", Crown],
  ["Platinum", "10,000+", Sparkles],
];

export type RewardUserRow = {
  user_id: string;
  points: number;
  level: string;
  updated_at: string;
  display_name: string | null;
  email: string | null;
  whatsapp: string | null;
  role?: string | null;
  is_admin?: boolean;
};

export function RewardsManager({ initialRewards }: { initialRewards: RewardUserRow[] }) {
  const [search, setSearch] = useState("");
  const [selectedRank, setSelectedRank] = useState<string>("ALL");

  const filteredRewards = useMemo(() => {
    return initialRewards.filter((r) => {
      const matchesRank = selectedRank === "ALL" || r.level.toUpperCase() === selectedRank.toUpperCase();
      if (!matchesRank) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (r.display_name && r.display_name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.whatsapp && r.whatsapp.includes(q)) ||
        r.level.toLowerCase().includes(q) ||
        String(r.points).includes(q)
      );
    });
  }, [initialRewards, search, selectedRank]);

  return (
    <div className="space-y-6">
      {/* Top Tiers Overview Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiers.map(([rank, range, Icon]) => {
          const count = initialRewards.filter((r) => r.level.toLowerCase() === rank.toLowerCase()).length;
          const isSelected = selectedRank.toLowerCase() === rank.toLowerCase();
          return (
            <button
              key={rank}
              type="button"
              onClick={() => setSelectedRank(isSelected ? "ALL" : rank)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#1f173b] border-[#8b5cf6] shadow-[0_0_20px_rgba(139,92,246,0.25)] ring-1 ring-[#8b5cf6]"
                  : "premium-panel border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon size={20} className={rankStyle[rank]?.text ?? "text-white"} />
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-[#8991a6]">
                  {count} {count === 1 ? "user" : "users"}
                </span>
              </div>
              <strong className="mt-3 block text-base font-bold text-white">{rank}</strong>
              <span className="text-xs text-[#8991a6]">{range} pts</span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8991a6]" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, WhatsApp, points..."
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-white/10 bg-black/40 text-sm text-white placeholder:text-[#6c748c] focus:outline-none focus:border-[#8b5cf6]/60 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedRank("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              selectedRank === "ALL"
                ? "bg-[#8b5cf6] text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                : "bg-white/5 text-[#8991a6] hover:bg-white/10 hover:text-white"
            }`}
          >
            All Ranks ({initialRewards.length})
          </button>
          {tiers.map(([rank]) => (
            <button
              key={rank}
              type="button"
              onClick={() => setSelectedRank(rank)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedRank === rank
                  ? "bg-[#8b5cf6] text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                  : "bg-white/5 text-[#8991a6] hover:bg-white/10 hover:text-white"
              }`}
            >
              {rank}
            </button>
          ))}
        </div>
      </div>

      {/* Rewards Users List */}
      <div className="space-y-3">
        {filteredRewards.map((reward, index) => {
          const styling = rankStyle[reward.level] || rankStyle.Bronze;
          const isAdmin = reward.is_admin || reward.role === "admin" || (reward.email && reward.email.includes("12k21rakeshkannam"));

          return (
            <article
              key={reward.user_id}
              className={`relative rounded-xl p-5 border transition-all ${
                isAdmin
                  ? "bg-gradient-to-r from-[#19122f] via-[#120e24] to-[#0c0919] border-[#8b5cf6]/40 shadow-[0_4px_24px_rgba(139,92,246,0.15)] ring-1 ring-[#8b5cf6]/30"
                  : "premium-panel border-white/10 hover:border-white/20"
              }`}
            >
              <div className="grid gap-4 md:grid-cols-[56px_1fr_auto] md:items-center">
                {/* Rank Badge / Number */}
                <div className="flex items-center gap-3 md:block">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-xl font-black text-sm border ${
                      isAdmin
                        ? "bg-[#8b5cf6]/20 border-[#8b5cf6]/50 text-[#c4b5fd] shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                        : index < 3
                        ? "bg-[#facc15]/10 border-[#facc15]/30 text-[#facc15]"
                        : "bg-white/5 border-white/10 text-[#8991a6]"
                    }`}
                  >
                    {isAdmin ? "👑" : `#${index + 1}`}
                  </span>
                </div>

                {/* Profile Details */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-base font-bold text-white">
                      {reward.display_name || "Customer"}
                    </strong>

                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-[#c4b5fd] border border-[#8b5cf6]/40 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                        <Crown size={11} className="text-yellow-400" /> Admin / Owner
                      </span>
                    )}

                    <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${styling.badge}`}>
                      {reward.level}
                    </span>

                    <span className="text-xs font-black text-[#facc15] px-2.5 py-0.5 rounded-full bg-[#facc15]/10 border border-[#facc15]/20">
                      {reward.points.toLocaleString()} XP
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8991a6]">
                    {reward.email && (
                      <span className="inline-flex items-center gap-1.5 text-[#a4abbc]">
                        <Mail size={12} className="text-[#8b5cf6]" />
                        {reward.email}
                      </span>
                    )}
                    {reward.whatsapp ? (
                      <span className="inline-flex items-center gap-1.5 text-[#a4abbc]">
                        <Phone size={12} className="text-emerald-400" />
                        {reward.whatsapp}
                      </span>
                    ) : (
                      <span className="text-[#656d81]">No WhatsApp saved</span>
                    )}
                  </div>
                </div>

                {/* Quick Point Adjustment Form */}
                <form action={adjustRewardPoints} className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                  <input type="hidden" name="user_id" value={reward.user_id} />
                  
                  <div className="relative">
                    <input
                      name="points"
                      type="number"
                      required
                      placeholder="+100"
                      className="h-10 w-24 rounded-lg border border-white/10 bg-black/40 px-3 text-xs font-bold text-white placeholder:text-[#656d81] focus:outline-none focus:border-[#8b5cf6]/60"
                    />
                  </div>

                  <input
                    name="reason"
                    required
                    defaultValue="Admin loyalty bonus"
                    className="h-10 w-40 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white placeholder:text-[#656d81] focus:outline-none focus:border-[#8b5cf6]/60 hidden sm:block"
                  />

                  <button
                    type="submit"
                    className="h-10 px-4 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-xs font-bold text-[#c4b5fd] hover:bg-[#8b5cf6] hover:text-white transition-all cursor-pointer shadow-[0_0_12px_rgba(139,92,246,0.15)] flex items-center gap-1.5"
                  >
                    <span>Apply</span>
                  </button>
                </form>
              </div>
            </article>
          );
        })}

        {filteredRewards.length === 0 && (
          <div className="premium-panel rounded-xl p-12 text-center">
            <p className="text-sm text-[#8991a6]">No customer accounts matched your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
