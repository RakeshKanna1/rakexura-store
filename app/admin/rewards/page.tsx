export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { RewardsManager, type RewardUserRow } from "@/components/admin/rewards-manager";

export default async function AdminRewardsPage() {
  const supabase = await createClient();

  const [{ data: rewards, error: rewardsError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.from("user_rewards").select("user_id,points,level,updated_at").order("points", { ascending: false }),
    supabase.from("profiles").select("id,display_name,email,whatsapp,role"),
  ]);
  
  const queryError = rewardsError || profilesError;
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const formattedRewards: RewardUserRow[] = (rewards ?? []).map((r) => {
    const profile = profileMap.get(r.user_id);
    return {
      user_id: r.user_id,
      points: r.points ?? 0,
      level: r.level ?? "Bronze",
      updated_at: r.updated_at,
      display_name: profile?.display_name || null,
      email: profile?.email || null,
      whatsapp: profile?.whatsapp || null,
      role: profile?.role || null,
      is_admin: profile?.role === "admin" || (profile?.email && profile.email.includes("12k21rakeshkannam")) || false,
    };
  });

  return (
    <main className="space-y-6">
      <div>
        <p className="eyebrow">Customer loyalty & gamification</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl text-white">Ranks & rewards</h1>
        <p className="section-copy mt-2 text-sm text-[#8991a6]">
          Delivered orders earn 100 XP. Review customer rank progression, search members, and grant instant loyalty bonus points.
        </p>
      </div>

      {queryError && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/[.07] p-4 text-sm text-red-200">
          Rewards data is temporarily unavailable. Please reload this page.
        </p>
      )}

      {!queryError && <RewardsManager initialRewards={formattedRewards} />}
    </main>
  );
}
