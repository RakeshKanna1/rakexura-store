export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, Gamepad2, Gift, Heart, LifeBuoy, PackageSearch, Send, Settings, ShieldCheck, ShoppingBag, TicketPercent, UserRound } from "lucide-react";
import { LogoutButton } from "@/components/account/logout-button";
import { EmptyState } from "@/components/common/empty-state";
import { OnboardingHint } from "@/components/common/onboarding-hint";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { RedeemFreebieButton } from "@/components/account/redeem-freebie-button";
import { GiftCelebration } from "@/components/dashboard/gift-celebration";

const modules = [
  ["orders", "My orders", "Payment and delivery history", PackageSearch],
  ["library", "My library", "Purchased games and guides", Gamepad2],
  ["wishlist", "Wishlist", "Saved titles and price alerts", Heart],
  ["rewards", "Rewards", "Points, level, and referrals", Gift],
  ["coupons", "Coupons", "Available account offers", TicketPercent],
  ["notifications", "Notifications", "Delivery and sale updates", Bell],
  ["support", "Support tickets", "Get help with an order", LifeBuoy],
  ["requests", "Game requests", "Track requested titles", Send],
] as const;

const quickActions = [
  ["/games", "Continue shopping", ShoppingBag, "text-[#b9a4ff] filter drop-shadow-[0_0_4px_rgba(139,92,246,0.3)] hover:text-[#c4b5fd]", "hover:border-[#b9a4ff]/30 hover:shadow-[0_8px_20px_rgba(139,92,246,0.04)]"],
  ["/dashboard/orders", "Track orders", PackageSearch, "text-[#b9a4ff] filter drop-shadow-[0_0_4px_rgba(139,92,246,0.3)] hover:text-[#c4b5fd]", "hover:border-[#b9a4ff]/30 hover:shadow-[0_8px_20px_rgba(139,92,246,0.04)]"],
  ["/dashboard/library", "My library", Gamepad2, "text-[#8b5cf6] filter drop-shadow-[0_0_4px_rgba(139,92,246,0.3)] hover:text-[#a78bfa]", "hover:border-[#8b5cf6]/30 hover:shadow-[0_8px_20px_rgba(139,92,246,0.04)]"],
  ["/dashboard/rewards", "Redeem rewards", Gift, "text-[#facc15] filter drop-shadow-[0_0_4px_rgba(250,204,21,0.3)] hover:text-[#fde047]", "hover:border-[#facc15]/30 hover:shadow-[0_8px_20px_rgba(250,204,21,0.04)]"],
  ["/support", "Support", LifeBuoy, "text-[#facc15] filter drop-shadow-[0_0_4px_rgba(250,204,21,0.3)] hover:text-[#fde047]", "hover:border-[#facc15]/30 hover:shadow-[0_8px_20px_rgba(250,204,21,0.04)]"],
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { data: orders }, { data: rewards }, { data: notifications }, { count: libraryCount }, { count: totalOrdersCount }, { count: referralCount }, { data: latestTicket }, { count: purchasedLibraryCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("id,order_reference,order_status,total_price,created_at,cart_items,payment_reference,coupon_usage(coupons(code))").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("user_rewards").select("points,level").eq("user_id", user.id).maybeSingle(),
    supabase.from("notifications").select("id,title,message").eq("user_id", user.id).eq("read", false),
    supabase.from("customer_library").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", user.id),
    supabase.from("support_tickets").select("status").eq("user_id", user.id).or("subject.eq.Request Diamond Code,subject.ilike.Loyalty Freebie Request%").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("customer_library").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("platform", "Gifted"),
  ]);

  const isApproved = latestTicket?.status === "resolved" || latestTicket?.status === "Approved";

  const dbPoints = rewards?.points;
  const totalPoints = dbPoints !== undefined && dbPoints !== null ? dbPoints : Math.min(10000, (purchasedLibraryCount ?? 0) * 100 + (referralCount ?? 0) * 500);

  const hasUnreadGift = notifications?.some(n => 
    String(n.title).includes("Gift") || 
    String(n.message || "").toLowerCase().includes("gift") || 
    String(n.message || "").toLowerCase().includes("giveaway")
  ) ?? false;

  let currentLevel = "Bronze";
  if (totalPoints >= 10000) currentLevel = "Platinum";
  else if (totalPoints >= 4000) currentLevel = "Diamond";
  else if (totalPoints >= 2000) currentLevel = "Gold";
  else if (totalPoints >= 1000) currentLevel = "Silver";

  // Sync user_rewards table data inline
  await supabase.from("user_rewards").upsert({ user_id: user.id, points: totalPoints, level: currentLevel });

  const stats = [
    { label: "Orders", value: totalOrdersCount ?? 0, icon: PackageSearch, color: "text-[#b9a4ff] filter drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]", hover: "hover:border-[#b9a4ff]/25 hover:shadow-[0_12px_28px_rgba(139,92,246,0.05)]" },
    { label: "Games owned", value: libraryCount ?? 0, icon: Gamepad2, color: "text-[#8b5cf6] filter drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]", hover: "hover:border-[#8b5cf6]/25 hover:shadow-[0_12px_28px_rgba(139,92,246,0.05)]" },
    { label: "Reward points", value: totalPoints, icon: Gift, color: "text-[#facc15] filter drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]", hover: "hover:border-[#facc15]/25 hover:shadow-[0_12px_28px_rgba(250,204,21,0.05)]" },
    { label: "Level", value: currentLevel, icon: TicketPercent, color: "text-[#facc15] filter drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]", hover: "hover:border-[#facc15]/25 hover:shadow-[0_12px_28px_rgba(250,204,21,0.05)]" }
  ];

  const name = profile?.display_name || user.user_metadata.full_name || "Player";
  const visibleQuickActions = profile?.role === "admin"
    ? [
        ...quickActions,
        ["/admin", "Admin dashboard", ShieldCheck, "text-[#8b5cf6] filter drop-shadow-[0_0_4px_rgba(139,92,246,0.3)] hover:text-[#a78bfa]", "hover:border-[#8b5cf6]/30 hover:shadow-[0_8px_20px_rgba(139,92,246,0.04)]"] as const
      ]
    : quickActions;

  const visibleModules = modules.filter(([href]) => href !== "coupons" || isApproved);

  return (
    <div className="page-shell py-8 sm:py-10">
      {/* Profile Header Wrapper with gold gradients */}
      <header className="relative overflow-hidden rounded-2xl border border-[#8b5cf6]/25 bg-[#0e0a1f]/85 p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="eyebrow text-transparent bg-clip-text bg-gradient-to-r from-[#b9a4ff] to-[#8b5cf6] font-black">Customer dashboard</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl bg-gradient-to-r from-white via-[#e8e3ff] to-[#b9a4ff] bg-clip-text text-transparent">Hi, {name}</h1>
            <p className="section-copy text-[#8991a6]">Your games, orders, rewards, and support in one secure place.</p>
          </div>
          
          <div className="flex items-center gap-3.5 rounded-xl border border-white/[0.08] bg-[#070912]/80 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:border-[#b9a4ff]/20 transition-all duration-300">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#8b5cf6]/5 border border-[#8b5cf6]/15 text-[#b9a4ff] shadow-[0_0_10px_rgba(139,92,246,0.15)]">
              <UserRound size={20} />
            </span>
            <div className="min-w-0">
              <strong className="block truncate text-xs font-black text-white">{user.email}</strong>
              <Link href="/dashboard/settings" className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-black text-[#b9a4ff] hover:text-[#d2c7ff] transition-colors">
                <Settings size={12} /> Account settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-6">
        <OnboardingHint id="first-login" title="Welcome to your Rakexura account">
          Start with My Orders after checkout. Delivered purchases automatically appear in My Library with activation guidance.
        </OnboardingHint>
      </div>

      {/* Dynamic Rank Progression Progress Bar (Capped at exactly 10,000 points for Platinum Rank Milestone) */}
      <section className="mt-6 premium-panel bg-[#0f0c22]/80 border-[#8b5cf6]/20 rounded-xl p-5 shadow-[0_12px_36px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white tracking-wide uppercase">Rank Progression</h3>
            <p className="mt-1 text-xs text-[#aeb5c6]">
              Current Tier: <span className="text-[#b9a4ff] font-black uppercase tracking-wider">{currentLevel}</span>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-[#e2e8f0] font-bold">{totalPoints.toLocaleString()} / 10,000 pts</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/45 border border-white/5">
            <div 
              style={{ width: `${Math.min(100, (totalPoints / 10000) * 100)}%` }} 
              className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#a78bfa] to-[#facc15] shadow-[0_0_10px_rgba(139,92,246,0.4)] transition-all duration-500" 
            />
          </div>
          <div className="mt-2.5 flex justify-between text-[9px] font-black tracking-wider text-[#646b7b] uppercase">
            <span>Bronze (0)</span>
            <span>Silver (1K)</span>
            <span>Gold (2K)</span>
            <span>Diamond (4K)</span>
            <span>Platinum (10K)</span>
          </div>
          <RedeemFreebieButton points={totalPoints} initialLastRequestDate={profile?.last_request_date || null} isApproved={isApproved} />
        </div>
      </section>

      {/* Quick Actions Panel */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#aeb5c6]">Quick Actions</h2>
          <span className="text-[10px] font-black text-[#b9a4ff] tracking-widest uppercase">Direct Shortcuts</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {visibleQuickActions.map(([href, label, Icon, iconClass, hoverClass]) => (
            <Link
              href={href}
              key={href}
              className={`group flex min-h-24 flex-col justify-between rounded-xl border border-[#8b5cf6]/20 bg-[#0c0a1a]/80 p-4 transition-all duration-300 hover:-translate-y-1 active:scale-[0.97] ${hoverClass}`}
            >
              <Icon size={18} className={`${iconClass} group-hover:scale-110 transition-transform duration-300`} />
              <span className="mt-4 flex items-center justify-between text-xs font-black tracking-wide text-[#e2e8f0]">
                {label}
                <ArrowRight size={13} className="opacity-40 transition-all group-hover:translate-x-1 group-hover:opacity-100 text-[#b9a4ff]" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Statistics Row Card Groupings */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, hover }) => (
          <article
            key={label}
            className={`relative overflow-hidden rounded-xl border border-[#8b5cf6]/20 bg-[#0c0a1a]/85 p-5 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] group ${hover}`}
          >
            <Icon size={20} className={`mb-4 ${color}`} />
            <strong className="block text-3xl font-black text-white tracking-tight">{value}</strong>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#646b7b] mt-1.5 block">{label}</span>
          </article>
        ))}
      </div>

      {/* Account Modules Block Layout */}
      <section className="mt-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-[#aeb5c6] mb-5">Account Center</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleModules.map(([href, title, text, Icon], idx) => {
            const isPurple = idx % 2 === 0;
            const hoverBorder = isPurple ? "hover:border-[#b9a4ff]/30 hover:shadow-[0_12px_28px_rgba(139,92,246,0.04)]" : "hover:border-[#facc15]/30 hover:shadow-[0_12px_28px_rgba(250,204,21,0.04)]";
            const barBg = isPurple ? "bg-[#b9a4ff]" : "bg-[#facc15]";
            const iconWrapper = isPurple ? "bg-[#8b5cf6]/5 border-[#8b5cf6]/10 group-hover:border-[#b9a4ff]/30 group-hover:bg-[#8b5cf6]/10" : "bg-[#facc15]/5 border-[#facc15]/10 group-hover:border-[#facc15]/30 group-hover:bg-[#facc15]/10";
            const iconColor = isPurple ? "text-[#b9a4ff] filter drop-shadow-[0_0_4px_rgba(139,92,246,0.3)]" : "text-[#facc15] filter drop-shadow-[0_0_4px_rgba(250,204,21,0.3)]";
            const titleColor = isPurple ? "group-hover:text-[#b9a4ff]" : "group-hover:text-[#facc15]";
            
            return (
              <Link
                href={href === "wishlist" ? "/wishlist" : `/dashboard/${href}`}
                key={href}
                className={`group relative overflow-hidden rounded-xl border border-[#8b5cf6]/20 bg-[#0c0a1a]/85 p-5 transition-all duration-300 hover:-translate-y-1 active:scale-[0.97] ${hoverBorder}`}
              >
                {/* Left indicator bar on hover */}
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-all duration-300 ${barBg}`} />
                
                {/* Icon wrapper frame */}
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-300 ${iconWrapper}`}>
                  <Icon size={18} className={iconColor} />
                </div>
                
                <h3 className={`mt-4 text-sm font-black text-white transition-colors ${titleColor}`}>{title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#8991a6]">{text}</p>
                
                {href === "notifications" && notifications?.length ? (
                  <span className="absolute right-4 top-4 rounded-full bg-[#facc15] px-2 py-0.5 text-[9px] font-black text-black shadow-[0_0_8px_rgba(250,204,21,0.4)] animate-pulse">
                    {notifications.length} NEW
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Balanced Content Separation Grid for Recent Orders */}
      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#aeb5c6]">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-xs font-black text-[#facc15] hover:text-[#fbbf24] transition-colors">
            View All Orders &rarr;
          </Link>
        </div>
        
        {orders?.length ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = order.order_status;
              let badgeColor = "border-white/10 bg-white/[0.03] text-[#8991a6]";
              if (status === "Delivered" || status === "Completed") {
                badgeColor = "border-[#00d68f]/20 bg-[#00d68f]/10 text-[#00d68f]";
              } else if (status === "Verified" || status === "Processing") {
                badgeColor = "border-[#facc15]/20 bg-[#facc15]/10 text-[#facc15]";
              } else if (status === "Rejected") {
                badgeColor = "border-red-500/20 bg-red-500/10 text-red-400";
              }
              
              return (
                <Link
                  href={`/track?order=${encodeURIComponent(order.order_reference || String(order.id))}`}
                  key={order.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#8b5cf6]/20 bg-[#0c0a1a]/80 p-5 transition-all duration-300 hover:border-[#b9a4ff]/25 hover:shadow-[0_8px_24px_rgba(139,92,246,0.04)] active:scale-[0.985]"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Visual Asset Frame */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/[0.02] border border-white/10 group-hover:border-[#b9a4ff]/30 group-hover:bg-[#8b5cf6]/5 transition-all duration-300">
                      <PackageSearch size={20} className="text-[#8991a6] group-hover:text-[#b9a4ff] transition-colors" />
                    </div>
                    
                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-white group-hover:text-[#b9a4ff] transition-colors">
                        Order {order.order_reference || `#${order.id}`}
                      </strong>
                      <p className="mt-1 text-[11px] font-medium text-[#646b7b]">
                        Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {order.total_price === 0 && (() => {
                        const isGifted = order.payment_reference === "GIFTED" || order.payment_reference === "GIVEAWAY";
                        if (isGifted) {
                          return (
                            <p className="mt-1.5 text-[10px] font-bold text-[#c4b5fd] flex items-center gap-1">
                              <Gift size={11} className="text-[#facc15]" />
                              Gifted by Owner
                            </p>
                          );
                        }
                        const usage = order.coupon_usage as { coupons: { code: string }[] }[] | null;
                        const couponCode = usage?.[0]?.coupons?.[0]?.code;
                        return (
                          <p className="mt-1.5 text-[10px] font-bold text-[#c4b5fd] flex items-center gap-1">
                            <TicketPercent size={11} className="text-[#facc15]" />
                            Free via coupon: <span className="text-white uppercase font-black">{couponCode || "FREEBIE"}</span>
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t border-white/[0.04] pt-3 sm:pt-0 sm:border-0">
                    <div className="text-left sm:text-right flex flex-col items-start sm:items-end justify-center">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${badgeColor}`}>
                        {status}
                      </span>
                      {order.total_price === 0 ? (
                        <div className="mt-1 flex flex-col items-start sm:items-end">
                          <span className="inline-block text-[9px] font-black uppercase tracking-wider text-[#00d68f]">Free</span>
                          <strong className="block text-sm font-black text-white">{formatPrice(0)}</strong>
                        </div>
                      ) : (
                        <strong className="mt-1 block text-sm font-black text-[#facc15] sm:mt-1.5">
                          {formatPrice(order.total_price)}
                        </strong>
                      )}
                    </div>
                    <ArrowRight size={15} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#b9a4ff] hidden sm:block" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={PackageSearch}
            title="No orders yet"
            description="Choose a game, complete payment, and your delivery status will appear here."
            href="/games"
            action="Browse games"
          />
        )}
      </section>

      <div className="mt-10 border-t border-white/[.07] pt-8 lg:hidden">
        <LogoutButton />
      </div>
      {hasUnreadGift && <GiftCelebration />}
    </div>
  );
}
