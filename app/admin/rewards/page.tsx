import { Award, Crown, Medal, Trophy, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { adjustRewardPoints } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";

const rankStyle: Record<string, string> = { 
  Bronze: "text-amber-600", 
  Silver: "text-slate-300", 
  Gold: "text-yellow-300", 
  Diamond: "text-cyan-300",
  Platinum: "text-[#b9a4ff] font-black"
};
const tiers: Array<[string, string, LucideIcon]> = [
  ["Bronze", "0-999", Medal], 
  ["Silver", "1,000-1,999", Award], 
  ["Gold", "2,000-3,999", Trophy], 
  ["Diamond", "4,000-9,999", Crown],
  ["Platinum", "10,000+", Sparkles]
];

export default async function AdminRewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/rewards");
  const { data: owner } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (owner?.role !== "admin") redirect("/dashboard");

  const [{ data: rewards, error: rewardsError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.from("user_rewards").select("user_id,points,level,updated_at").order("points", { ascending: false }),
    supabase.from("profiles").select("id,display_name,whatsapp"),
  ]);
  const queryError = rewardsError || profilesError;
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return <main>
    <p className="eyebrow">Customer loyalty</p>
    <h1 className="mt-3 text-4xl font-black md:text-5xl">Ranks & rewards</h1>
    <p className="section-copy">Delivered orders earn 100 points. Review loyal customers and grant a manual bonus when deserved.</p>
    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">{tiers.map(([rank, range, Icon]) => <article key={rank} className="premium-panel rounded-md p-4"><Icon size={19} className={rankStyle[rank]} /><strong className="mt-4 block">{rank}</strong><span className="mt-1 text-xs text-[#8991a6]">{range} points</span></article>)}</div>
    {queryError && <p className="mt-7 rounded-md border border-red-500/20 bg-red-500/[.07] p-4 text-sm text-red-200">Rewards data is temporarily unavailable. Run the latest Phase 13 migration, then reload this page.</p>}
    <div className="mt-7 space-y-3">{!queryError && rewards?.map((reward, index) => {
      const profile = profileMap.get(reward.user_id);
      return <article key={reward.user_id} className="premium-panel grid gap-4 rounded-lg p-5 md:grid-cols-[60px_1fr_auto] md:items-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/[.06] text-lg font-black">#{index + 1}</span>
        <div><div className="flex flex-wrap items-center gap-2"><strong>{profile?.display_name || "Customer"}</strong><span className={`text-xs font-black uppercase ${rankStyle[reward.level] ?? "text-white"}`}>{reward.level}</span></div><p className="mt-1 text-sm text-[#8991a6]">{profile?.whatsapp || "No WhatsApp saved"} · {reward.points} points</p></div>
        <form action={adjustRewardPoints} className="flex flex-wrap gap-2"><input type="hidden" name="user_id" value={reward.user_id} /><input name="points" type="number" required placeholder="+100" className="h-10 w-24 rounded-md border border-white/10 bg-black/25 px-3 text-sm" /><input name="reason" required defaultValue="Admin loyalty bonus" className="h-10 w-44 rounded-md border border-white/10 bg-black/25 px-3 text-sm" /><button className="btn btn-secondary min-h-10 text-xs">Apply points</button></form>
      </article>;
    })}{!queryError && !rewards?.length && <p className="premium-panel rounded-lg p-10 text-center text-[#8991a6]">Customer ranks will appear after account creation and delivered orders.</p>}</div>
  </main>;
}
