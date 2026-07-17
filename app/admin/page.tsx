import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Boxes, ImageIcon, LifeBuoy, MessageSquareText, PackageCheck, Plus, Send, TicketPercent, Trophy, Users, ArrowUpRight, Layers, Flame, CalendarRange, Percent } from "lucide-react";
import { AdminAccessDenied } from "@/components/admin/access-denied";
import { AdminOnboarding } from "@/components/admin/admin-onboarding";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

const sections = [
  ["games", "Games", "Catalog, platforms, pricing, and media", Boxes],
  ["bundles", "Combos", "Build and manage multi-game combo packages", Layers],
  ["orders", "Orders", "Payment and delivery operations", PackageCheck],
  ["customers", "Customers", "Accounts and purchase activity", Users],
  ["reviews", "Reviews", "Verified feedback moderation", MessageSquareText],
  ["coupons", "Coupons", "Discount rules and usage", TicketPercent],
  ["rewards", "Ranks", "Loyalty point status and adjustments", Trophy],
  ["requests", "Vouchers", "Incoming milestone voucher claims", Trophy],
  ["game-requests", "Requests", "Community game demand", Send],
  ["support", "Support", "Customer ticket conversations", LifeBuoy],
  ["media", "Media manager", "Proofs and promotional assets", ImageIcon],
  ["analytics", "Analytics", "Traffic and sales events", BarChart3],
  ["flash-sales", "Flash sales", "Manage countdown sales and discounts", Flame],
  ["campaigns", "Campaigns", "Manage seasonal sales and campaign dates", CalendarRange],
  ["campaign-games", "Campaign overrides", "Seasonal discount campaign prices for games", Percent],
  ["audit-logs", "Audit logs", "Detailed administrator action trails", BarChart3]
] as const;

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return <AdminAccessDenied email={user.email} />;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [{ count: games }, { count: customers }, { count: pending }, { count: pendingReviews }, { count: pendingRequests }, { count: activeCoupons }, { count: openTickets }, { count: lowStock }, { data: deliveries }, { data: todayOrders }, { data: latestOrders }] = await Promise.all([
    supabase.from("games").select("id", { count: "exact", head: true }).eq("archived", false),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).ilike("order_status", "%pending%"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("approved", false),
    supabase.from("game_requests").select("id", { count: "exact", head: true }).in("status", ["requested", "reviewing"]),
    supabase.from("coupons").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).neq("status", "closed"),
    supabase.from("games").select("id", { count: "exact", head: true }).gt("activation_slots", 0).lte("activation_slots", 3).eq("archived", false),
    supabase.from("recent_deliveries").select("id,game_title,delivered_at").order("delivered_at", { ascending: false }).limit(4),
    supabase.from("orders").select("total_price,payment_status,order_status").gte("created_at", today.toISOString()),
    supabase.from("orders").select("id,order_reference,customer_name,order_status,total_price,created_at").order("created_at", { ascending: false }).limit(7),
  ]);
  const todayRevenue = todayOrders?.filter((order) => ["Approved", "Delivered", "Completed"].includes(order.payment_status) || ["Verified", "Delivered", "Completed"].includes(order.order_status)).reduce((sum, order) => sum + Number(order.total_price ?? 0), 0) ?? 0;
  const stats = [["Orders today", todayOrders?.length ?? 0, PackageCheck], ["Revenue today", formatPrice(todayRevenue), BarChart3], ["Pending payments", pending ?? 0, TicketPercent], ["Active games", games ?? 0, Boxes]] as const;
  const quick = [["/admin/games", "Add Game", Plus], ["/admin/coupons", "Add Coupon", TicketPercent], ["/admin/orders", "View Orders", PackageCheck], ["/admin/reviews", "Approve Reviews", MessageSquareText], ["/admin/requests", "Manage Requests", ArrowUpRight], ["/admin/support", "Answer Support", LifeBuoy]] as const;

  return (
    <div className="py-10">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Protected administration</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl bg-gradient-to-r from-white via-[#e8e3ff] to-[#b9a4ff] bg-clip-text text-transparent">
            Rakexura control center
          </h1>
          <p className="section-copy text-[#9ea6b9]">
            Run catalog, orders, promotions, and customer trust without touching code.
          </p>
        </div>
        <span className="flex min-h-11 items-center self-start rounded-md border border-[#00d68f]/15 bg-[#00d68f]/[.05] px-4 text-xs font-bold text-[#70efbb]">
          ADMIN SESSION VERIFIED
        </span>
      </header>
      
      <AdminOnboarding />
      
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {quick.map(([href, label, Icon]) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-24 flex-col justify-between rounded-md border border-[#8b5cf6]/20 bg-[#0d0b1a]/85 p-4 text-sm font-black transition duration-300 hover:-translate-y-0.5 hover:border-[#b9a4ff]/30 hover:shadow-[0_8px_20px_rgba(139,92,246,0.04)]"
          >
            <Icon size={19} className="text-[#b9a4ff] filter drop-shadow-[0_0_4px_rgba(139,92,246,0.3)]" />
            {label}
          </Link>
        ))}
      </section>
      
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value, Icon], idx) => {
          const isPurple = idx % 2 === 0;
          const iconClass = isPurple ? "text-[#b9a4ff] filter drop-shadow-[0_0_6px_rgba(139,92,246,0.4)]" : "text-[#facc15] filter drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]";
          const hoverClass = isPurple ? "hover:border-[#b9a4ff]/25 hover:shadow-[0_12px_28px_rgba(139,92,246,0.05)]" : "hover:border-[#facc15]/25 hover:shadow-[0_12px_28px_rgba(250,204,21,0.05)]";
          return (
            <article
              className={`premium-panel rounded-md p-5 bg-[#0f0c22]/80 border-[#8b5cf6]/20 transition duration-300 hover:-translate-y-1 ${hoverClass}`}
              key={label}
            >
              <Icon className={`mb-6 ${iconClass}`} />
              <strong className="block text-2xl text-white">{value}</strong>
              <span className="muted mt-1 text-xs">{label}</span>
            </article>
          );
        })}
      </div>
      
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Added min-w-0 to prevent layout overflow from the inner table min-w-[650px] on mobile devices */}
        <section className="min-w-0">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm text-[#b9a4ff] hover:text-[#c4b5fd] transition-colors">
              Open queue
            </Link>
          </div>
          <div className="overflow-x-auto rounded-md border border-[#8b5cf6]/20">
            <table className="w-full min-w-[650px] border-collapse text-left text-sm">
              <thead className="bg-white/[.04] text-[#8991a6]">
                <tr>
                  <th className="p-4">Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {latestOrders?.map((order) => (
                  <tr key={order.id} className="border-t border-white/[.07] transition hover:bg-white/[.025]">
                    <td className="p-4 font-bold">{order.order_reference || `#${order.id}`}</td>
                    <td className="p-4">{order.customer_name}</td>
                    <td className="p-4">
                      <span className="rounded bg-white/[.06] px-3 py-2 text-xs">{order.order_status}</span>
                    </td>
                    <td className="p-4 font-bold">{formatPrice(order.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        
        <aside className="space-y-4 min-w-0">
          <div className="premium-panel rounded-md p-5 bg-[#0f0c22]/80 border-[#8b5cf6]/20">
            <p className="eyebrow">Needs attention</p>
            <div className="mt-5 space-y-3">
              {[
                ["Pending orders", pending ?? 0, "/admin/orders"],
                ["Reviews to moderate", pendingReviews ?? 0, "/admin/reviews"],
                ["Game requests", pendingRequests ?? 0, "/admin/requests"],
                ["Open support tickets", openTickets ?? 0, "/admin/support"],
                ["Active coupons", activeCoupons ?? 0, "/admin/coupons"],
                ["Limited activation stock", lowStock ?? 0, "/admin/games"],
                ["Customer accounts", customers ?? 0, "/admin/customers"]
              ].map(([label, value, href]) => (
                <Link
                  key={String(label)}
                  href={String(href)}
                  className="flex min-h-12 items-center justify-between rounded-md border border-white/[.07] bg-black/20 px-4 text-sm transition hover:border-white/20"
                >
                  <span>{label}</span>
                  <strong>{value}</strong>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="premium-panel rounded-md p-5 bg-[#0f0c22]/80 border-[#8b5cf6]/20">
            <p className="eyebrow">Recent deliveries</p>
            <div className="mt-4 space-y-3">
              {deliveries?.map((delivery) => (
                <div key={delivery.id} className="rounded-md bg-black/20 p-3">
                  <strong className="block truncate text-sm">{delivery.game_title}</strong>
                  <span className="mt-1 block text-xs text-[#8991a6]">
                    {new Date(delivery.delivered_at).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
              {!deliveries?.length && <p className="text-sm text-[#8991a6]">No deliveries recorded yet.</p>}
            </div>
          </div>
        </aside>
      </div>
      
      <section className="mt-10">
        <h2 className="section-title mb-5">Operations</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map(([href, title, description, Icon]) => (
            <Link
              href={`/admin/${href}`}
              key={href}
              className="group spotlight-card rounded-md border border-[#8b5cf6]/20 bg-[#0e0b1f]/85 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#b9a4ff]/30 hover:shadow-[0_12px_28px_rgba(139,92,246,0.04)]"
            >
              <Icon size={20} className="text-[#b9a4ff] filter drop-shadow-[0_0_4px_rgba(139,92,246,0.3)]" />
              <h3 className="mt-6 font-black text-white group-hover:text-[#b9a4ff] transition-colors">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-[#8991a6]">{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
