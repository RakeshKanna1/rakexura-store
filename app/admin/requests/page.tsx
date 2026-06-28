import Link from "next/link";
import { ArrowLeft, Check, MessageCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { approveMilestoneRequest, updateRequestStatus } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";
import { AdminAccessDenied } from "@/components/admin/access-denied";

// Sub-components for Tab 1 (Game Requests)
function SubmitButton({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "positive" | "danger" }) {
  const color = tone === "positive" 
    ? "border-[#00d68f]/30 text-[#70efbb]" 
    : tone === "danger" 
      ? "border-red-400/30 text-red-300" 
      : "border-white/10 text-[#c8cedc]";
  return (
    <button 
      type="submit" 
      className={`rounded border bg-black/20 px-3 py-2 text-xs font-bold transition hover:bg-white/[.06] ${color}`}
    >
      {children}
    </button>
  );
}

function RowActions({ id }: { id: number }) {
  return (
    <div className="flex min-w-60 flex-wrap gap-2">
      {["Reviewing", "Planned", "Added", "Declined"].map((status) => (
        <form action={updateRequestStatus} key={status}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={status} />
          <SubmitButton tone={status === "Declined" ? "danger" : status === "Added" ? "positive" : "neutral"}>
            {status}
          </SubmitButton>
        </form>
      ))}
    </div>
  );
}

export default async function AdminVoucherRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "games" } = await searchParams;
  const activeTab = tab === "vouchers" || tab === "coupons" ? "coupons" : "games";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/requests");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return <AdminAccessDenied email={user.email} />;

  // 1. Fetch Game Requests
  const { data: gameRequests } = await supabase
    .from("game_requests")
    .select("id,game_name,platform,votes,status,created_at")
    .order("created_at", { ascending: false });
  const gameRows = gameRequests ?? [];

  // 2. Fetch Reward & Coupon Requests (support tickets) joined with profiles and rewards
  const [{ data: tickets }, { data: profiles }, { data: rewards }] = await Promise.all([
    supabase.from("support_tickets")
      .select("id,user_id,subject,message,status,created_at")
      .or("subject.eq.Request Diamond Code,subject.ilike.Loyalty Freebie Request%")
      .order("created_at", { ascending: false }),
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
    <div className="py-10">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-white">
        <ArrowLeft size={16} /> Control center
      </Link>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Milestone & Demand</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl bg-gradient-to-r from-white via-[#e8e3ff] to-[#b9a4ff] bg-clip-text text-transparent">
            Customer Requests Hub
          </h1>
          <p className="section-copy text-[#8991a6]">
            Review community game requests and manually approve loyalty reward milestone activations.
          </p>
        </div>
      </div>

      {/* Sleek Dual-Tab Sub-Navigation Menu */}
      <div className="mt-8 flex gap-6 border-b border-white/10 pb-px">
        <Link
          href="/admin/requests?tab=games"
          className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "games"
              ? "border-[#b9a4ff] text-white"
              : "border-transparent text-[#8991a6] hover:text-white"
          }`}
        >
          Game Requests
        </Link>
        <Link
          href="/admin/requests?tab=coupons"
          className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "coupons"
              ? "border-[#b9a4ff] text-white"
              : "border-transparent text-[#8991a6] hover:text-white"
          }`}
        >
          Reward & Coupon Requests
        </Link>
      </div>

      {activeTab === "games" ? (
        <div className="mt-8 overflow-x-auto rounded-md border border-[#8b5cf6]/20 bg-[#0c0a1a]/80">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-white/[.04] text-[#8991a6]">
              <tr>
                <th className="p-4">Game Name</th>
                <th className="p-4">Platform</th>
                <th className="p-4">Votes</th>
                <th className="p-4">Status</th>
                <th className="p-4">Requested On</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gameRows.map((row) => (
                <tr key={row.id} className="border-t border-white/[.07] hover:bg-white/[.025] transition-colors">
                  <td className="p-4 font-bold text-white">{row.game_name}</td>
                  <td className="p-4 font-semibold text-[#b9a4ff]">{row.platform}</td>
                  <td className="p-4 font-bold text-white">{row.votes}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      row.status === "available"
                        ? "bg-[#00d68f]/10 text-[#00d68f]"
                        : row.status === "declined"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-white/[0.05] text-[#8991a6]"
                    }`}>
                      {row.status === "available" ? "Added" : row.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-[#8991a6]">
                    {new Date(row.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </td>
                  <td className="p-4">
                    <RowActions id={row.id} />
                  </td>
                </tr>
              ))}

              {gameRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[#8991a6]">
                    No game requests recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-md border border-[#8b5cf6]/20 bg-[#0c0a1a]/80">
          <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
            <thead className="bg-white/[.04] text-[#8991a6]">
              <tr>
                <th className="p-4">User ID</th>
                <th className="p-4">Username</th>
                <th className="p-4">Email</th>
                <th className="p-4">Current Rank Status</th>
                <th className="p-4">Current Points</th>
                <th className="p-4">Requested Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Coupon Authorization</th>
              </tr>
            </thead>
            <tbody>
              {voucherRows.map((row) => {
                const cleanedWhatsapp = row.whatsapp.replace(/\D/g, "");
                const whatsappNormalized = cleanedWhatsapp.length === 10 ? `91${cleanedWhatsapp}` : cleanedWhatsapp;
                const whatsappLink = `https://wa.me/${whatsappNormalized}?text=${encodeURIComponent(
                  `Hi ${row.username}! Regarding your Rakexura loyalty milestone voucher request...`
                )}`;

                const isResolved = row.status === "resolved" || row.status === "Approved";

                return (
                  <tr key={row.id} className="border-t border-white/[.07] hover:bg-white/[.025] transition-colors">
                    <td className="p-4 font-mono text-[10px] text-[#646b7b]">{row.userId}</td>
                    <td className="p-4 font-bold text-white">{row.username}</td>
                    <td className="p-4 text-[#8991a6]">{row.email}</td>
                    <td className="p-4">
                      <span className="inline-flex rounded bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-[#b9a4ff] border border-[#8b5cf6]/20">
                        {row.rankStatus}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">{row.points.toLocaleString()} pts</td>
                    <td className="p-4 text-xs text-[#8991a6]">
                      {new Date(row.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                        isResolved
                          ? "bg-[#00d68f]/10 text-[#00d68f] border border-[#00d68f]/20"
                          : "bg-amber-400/10 text-amber-200 border border-amber-400/20"
                      }`}>
                        {isResolved ? "Authorized" : "Pending"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        {!isResolved ? (
                          <form action={approveMilestoneRequest} className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/10">
                            <input type="hidden" name="ticket_id" value={row.id} />
                            <input type="hidden" name="unlock_access" value="true" />
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase tracking-wider text-[#8991a6]">
                                Enter Authorized Code Code
                              </label>
                              <input
                                name="promo_code"
                                required
                                placeholder="DIAMONDFREE"
                                className="h-8 w-28 rounded border border-white/10 bg-black/60 px-2 text-xs text-white outline-none focus:border-[#8b5cf6]"
                              />
                            </div>
                            <button
                              type="submit"
                              className="inline-flex h-8 mt-auto items-center justify-center gap-1 rounded border border-[#00d68f] bg-[#00d68f]/10 px-3.5 text-xs font-bold text-[#70efbb] hover:bg-[#00d68f]/20 transition-all active:scale-[0.97]"
                            >
                              Approve & Unlock
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-[#646b7b] font-medium flex items-center gap-1">
                            <Check size={14} className="text-[#00d68f]" /> Authorized & Approved
                          </span>
                        )}

                        {row.whatsapp && (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-[#20c763]/10 text-[#20c763] hover:bg-[#20c763]/20 transition-all"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {voucherRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[#8991a6]">
                    No loyalty voucher requests recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
