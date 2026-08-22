"use client";

import { useState, useMemo } from "react";
import { Award, Crown, Medal, Trophy, Sparkles, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { adjustRewardPoints } from "@/app/admin/actions";

const rankStyle: Record<string, string> = {
  Bronze: "text-amber-500",
  Silver: "text-slate-300",
  Gold: "text-yellow-400",
  Diamond: "text-cyan-400",
  Platinum: "text-[#b9a4ff] font-black",
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

  const filteredRewards = useMemo(() => {
    if (!search.trim()) return initialRewards;
    const q = search.toLowerCase();
    return initialRewards.filter((r) => {
      return (
        (r.display_name && r.display_name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.whatsapp && r.whatsapp.includes(q)) ||
        r.level.toLowerCase().includes(q) ||
        String(r.points).includes(q)
      );
    });
  }, [initialRewards, search]);

  return (
    <div>
      {/* 5 Rank Overview Boxes matching original design */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiers.map(([rank, range, Icon]) => (
          <article key={rank} className="premium-panel rounded-md p-4">
            <Icon size={20} className={rankStyle[rank]} />
            <strong className="mt-4 block font-bold text-white">{rank}</strong>
            <span className="mt-1 text-xs text-[#8991a6]">{range} points</span>
          </article>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8991a6]" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member name, email, WhatsApp, points..."
            className="h-11 w-full rounded-md border border-white/10 bg-black/30 pl-10 pr-4 text-sm text-white placeholder:text-[#6c748c] outline-none transition focus:border-[#facc15]/60 focus:ring-1 focus:ring-[#facc15]/30"
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="btn btn-secondary min-h-11 text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Ranks Leaderboard matching original design */}
      <div className="mt-6 space-y-3">
        {filteredRewards.map((reward, index) => {
          const isAdmin = reward.is_admin || reward.role === "admin" || (reward.email && reward.email.includes("12k21rakeshkannam"));

          return (
            <article
              key={reward.user_id}
              className={`premium-panel grid gap-4 rounded-lg p-5 md:grid-cols-[60px_1fr_auto] md:items-center ${
                isAdmin ? "border-[#8b5cf6]/40 bg-[#8b5cf6]/[0.04]" : ""
              }`}
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-full text-lg font-black ${
                  isAdmin
                    ? "bg-[#8b5cf6]/20 text-[#c4b5fd] border border-[#8b5cf6]/30"
                    : "bg-white/[.06] text-white"
                }`}
              >
                {isAdmin ? "👑" : `#${index + 1}`}
              </span>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-base font-bold text-white">
                    {reward.display_name || "Customer"}
                  </strong>
                  {isAdmin && (
                    <span className="text-[10px] font-black uppercase text-[#c4b5fd] bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 px-2 py-0.5 rounded">
                      Admin / Owner
                    </span>
                  )}
                  <span className={`text-xs font-black uppercase ${rankStyle[reward.level] ?? "text-white"}`}>
                    {reward.level}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#8991a6]">
                  {reward.whatsapp || "No WhatsApp saved"}
                  {reward.email ? ` · ${reward.email}` : ""} · <span className="font-bold text-[#facc15]">{reward.points} points</span>
                </p>
              </div>

              <form action={adjustRewardPoints} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="user_id" value={reward.user_id} />
                <input
                  name="points"
                  type="number"
                  required
                  placeholder="+100"
                  className="h-10 w-24 rounded-md border border-white/10 bg-black/25 px-3 text-sm text-white placeholder:text-[#6c748c]"
                />
                <input
                  name="reason"
                  required
                  defaultValue="Admin loyalty bonus"
                  className="h-10 w-44 rounded-md border border-white/10 bg-black/25 px-3 text-sm text-white placeholder:text-[#6c748c]"
                />
                <button type="submit" className="btn btn-secondary min-h-10 text-xs">
                  Apply points
                </button>
              </form>
            </article>
          );
        })}

        {filteredRewards.length === 0 && (
          <p className="premium-panel rounded-lg p-10 text-center text-[#8991a6]">
            No members matched your search query.
          </p>
        )}
      </div>
    </div>
  );
}
