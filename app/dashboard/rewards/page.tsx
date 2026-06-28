export const dynamic = 'force-dynamic';

import Link from "next/link";
import { ArrowLeft, Gift } from "lucide-react";
import { redirect } from "next/navigation";
import { RewardsCenter } from "@/components/account/rewards-center";
import { createClient } from "@/lib/supabase/server";

export default async function RewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/rewards");

  const [, { data: offers }, { data: referral }, { count: libraryCount }, { count: referralCount }] = await Promise.all([
    supabase.from("user_rewards").select("points,level").eq("user_id", user.id).maybeSingle(),
    supabase.from("reward_offers").select("id,title,points_cost").eq("active", true).order("points_cost"),
    supabase.from("referrals").select("code").eq("referrer_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("customer_library").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("platform", "Gifted"),
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", user.id),
  ]);

  const purchasePoints = (libraryCount ?? 0) * 100;
  const referralPoints = (referralCount ?? 0) * 500;
  const totalPoints = Math.min(10000, purchasePoints + referralPoints);

  let currentLevel = "Bronze";
  if (totalPoints >= 10000) currentLevel = "Platinum";
  else if (totalPoints >= 4000) currentLevel = "Diamond";
  else if (totalPoints >= 2000) currentLevel = "Gold";
  else if (totalPoints >= 1000) currentLevel = "Silver";

  // Sync user_rewards table data inline
  await supabase.from("user_rewards").upsert({ user_id: user.id, points: totalPoints, level: currentLevel });

  return (
    <div className="page-shell py-10">
      <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-[#b9a4ff] transition-colors">
        <ArrowLeft size={16} /> Dashboard
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-md bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#b9a4ff] shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <Gift />
        </span>
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="text-3xl font-black md:text-5xl bg-gradient-to-r from-white via-[#e8e3ff] to-[#b9a4ff] bg-clip-text text-transparent">Rewards & referrals</h1>
        </div>
      </div>
      <div className="mt-8">
        <RewardsCenter points={totalPoints} offers={offers ?? []} initialCode={referral?.code} />
      </div>
    </div>
  );
}
