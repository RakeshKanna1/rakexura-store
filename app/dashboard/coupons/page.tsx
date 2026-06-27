import Link from "next/link";
import { ArrowLeft, TicketPercent } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomerCouponsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/coupons");

  // Query approved/resolved support tickets for loyalty milestone requests
  const { data: approvedTickets } = await supabase
    .from("support_tickets")
    .select("id, status, subject, message")
    .eq("user_id", user.id)
    .or("subject.eq.Request Diamond Code,subject.ilike.Loyalty Freebie Request%")
    .in("status", ["resolved", "Approved"]);

  const hasApprovedAccess = approvedTickets && approvedTickets.length > 0;

  // Extract manually enabled voucher codes from resolved support ticket messages
  const approvedCodes: string[] = [];
  if (hasApprovedAccess && approvedTickets) {
    approvedTickets.forEach((ticket) => {
      const match = ticket.message?.match(/\[Approved Code:\s*([A-Z0-9_-]+)\]/i);
      if (match && match[1]) {
        approvedCodes.push(match[1].toUpperCase());
      }
    });
  }

  type Coupon = {
    id: number;
    code: string;
    discount_type: "percentage" | "flat";
    discount_value: number;
    minimum_order: number;
    expires_at: string | null;
  };

  let coupons: Coupon[] = [];
  if (hasApprovedAccess && approvedCodes.length > 0) {
    const { data: couponsData } = await supabase
      .from("coupons")
      .select("id,code,discount_type,discount_value,minimum_order,expires_at")
      .eq("active", true)
      .in("code", approvedCodes)
      .order("expires_at");
    
    coupons = (couponsData as Coupon[]) ?? [];
  }

  // Lock down layout if access not authorized or no coupons match
  const isLocked = !hasApprovedAccess || coupons.length === 0;

  return (
    <div className="page-shell py-10">
      <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-[#b9a4ff] transition-colors">
        <ArrowLeft size={16} /> Dashboard
      </Link>

      <div className="mt-8 flex items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-md bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#b9a4ff] shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <TicketPercent />
        </span>
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="text-3xl font-black md:text-5xl bg-gradient-to-r from-white via-[#e8e3ff] to-[#b9a4ff] bg-clip-text text-transparent">
            My Coupons
          </h1>
        </div>
      </div>

      {isLocked ? (
        <div className="mt-8 rounded-xl border border-dashed border-[#8b5cf6]/20 bg-[#0c0a1a]/85 p-8 text-center shadow-[0_12px_36px_rgba(0,0,0,0.3)] max-w-2xl mx-auto">
          <TicketPercent size={48} className="mx-auto text-[#8991a6] mb-4 opacity-40 animate-pulse" />
          <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Access Locked</h3>
          <p className="text-sm leading-relaxed text-[#8991a6] mb-6">
            No active reward codes available yet. Request an activation code from your dashboard timeline above to unlock your milestone perks!
          </p>
          <Link href="/dashboard" className="btn btn-secondary px-6 py-2.5 text-xs font-bold bg-[#8b5cf6]/10 border-[#8b5cf6]/20 text-[#b9a4ff] hover:bg-[#8b5cf6]/20">
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <p className="text-xs text-[#8991a6] mb-4">
            Below are your authorized milestone reward codes manually unlocked by the Administrator:
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="group relative overflow-hidden rounded-xl border border-[#8b5cf6]/20 bg-[#0c0a1a]/85 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#b9a4ff]/30 hover:shadow-[0_12px_28px_rgba(139,92,246,0.04)]"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#b9a4ff] opacity-80" />
                <span className="text-[10px] font-black uppercase text-[#8991a6] tracking-wider block">
                  Milestone Coupon
                </span>
                <strong className="mt-2 block text-2xl font-black text-white tracking-tight uppercase group-hover:text-[#b9a4ff] transition-colors">
                  {coupon.code}
                </strong>
                <p className="mt-1 text-xs text-[#70efbb] font-semibold">
                  Discount: {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : formatPrice(coupon.discount_value)}
                </p>
                <p className="mt-1 text-[11px] text-[#8991a6]">
                  Minimum subtotal: {formatPrice(coupon.minimum_order)}
                </p>
                {coupon.expires_at && (
                  <span className="mt-4 block text-[10px] text-[#646b7b] uppercase font-black">
                    Expires: {new Date(coupon.expires_at).toLocaleDateString("en-IN")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
