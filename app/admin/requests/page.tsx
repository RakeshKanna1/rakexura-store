import { createClient } from "@/lib/supabase/server";
import { RequestsClientView } from "@/components/admin/requests-client-view";

export default async function AdminVoucherRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "games" } = await searchParams;
  const supabase = await createClient();

  // Pre-fetch datasets in parallel on the server
  const [{ data: gameRequests }, { data: tickets }, { data: profiles }, { data: rewards }] = await Promise.all([
    supabase.from("game_requests").select("id,game_name,platform,votes,status,created_at").order("created_at", { ascending: false }),
    supabase.from("support_tickets").select("id,user_id,subject,message,status,created_at").or("subject.eq.Request Diamond Code,subject.ilike.Loyalty Freebie Request%").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id,display_name,email,whatsapp"),
    supabase.from("user_rewards").select("user_id,points,level")
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const rewardMap = new Map((rewards ?? []).map((r) => [r.user_id, r]));

  const voucherRows = (tickets ?? []).map((ticket) => {
    const custProfile = profileMap.get(ticket.user_id);
    const custReward = rewardMap.get(ticket.user_id);
    return {
      id: ticket.id,
      userId: ticket.user_id,
      username: custProfile?.display_name || "Customer",
      email: custProfile?.email || "No Email Saved",
      whatsapp: custProfile?.whatsapp || "",
      rankStatus: custReward?.level || "Bronze",
      points: custReward?.points ?? 0,
      timestamp: ticket.created_at,
      status: ticket.status,
    };
  });

  return (
    <RequestsClientView
      initialGameRows={gameRequests ?? []}
      initialVoucherRows={voucherRows}
      initialTab={tab}
    />
  );
}
