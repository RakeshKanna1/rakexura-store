import Link from "next/link";
import { ArrowLeft, ArrowRight, Bell, Gamepad2, Gift, Key, LifeBuoy, PackageSearch, Send, TicketPercent } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/common/empty-state";
import { SupportTicketForm } from "@/components/support/support-ticket-form";
import { createClient } from "@/lib/supabase/server";
import { assetUrl, formatPrice } from "@/lib/utils";
import { WriteReviewTrigger } from "@/components/dashboard/write-review-trigger";


const config = {
  orders: { title: "My orders", icon: PackageSearch, empty: ["No orders yet", "Completed purchases and delivery progress will appear here.", "/games", "Browse games"] },
  library: { title: "My games library", icon: Gamepad2, empty: ["Your library is ready", "Games appear here automatically after an order is delivered.", "/games", "Find your next game"] },
  rewards: { title: "Rewards & referrals", icon: Gift, empty: ["Start earning rewards", "Purchases and successful referrals add points to your account.", "/games", "Continue shopping"] },
  coupons: { title: "My coupons", icon: TicketPercent, empty: ["No active coupons", "New account and campaign offers will appear here when available.", "/games", "Browse current deals"] },
  notifications: { title: "Notifications", icon: Bell, empty: ["You are all caught up", "Order updates, deliveries, and account alerts will appear here.", "/dashboard", "Back to dashboard"] },
  support: { title: "Support tickets", icon: LifeBuoy, empty: ["No support tickets", "Create a ticket below whenever you need help with an order.", "/faq", "Read common answers"] },
  requests: { title: "Game requests", icon: Send, empty: ["No game requests", "Ask Rakexura to consider a game that is not listed yet.", "/requests", "Request a game"] },
} as const;

function rowTitle(row: Record<string, unknown>) {
  const game = row.games as { title?: string } | null;
  return String(row.order_reference || game?.title || row.title || row.game_name || row.subject || row.reason || row.code || `Item #${row.id}`);
}

export default async function DashboardSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!(section in config)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const current = config[section as keyof typeof config];
  const Icon = current.icon;
  let rows: Array<Record<string, unknown>> = [];
  const gamesMap: Record<number, { title: string; cover_image: string | null; is_subscription?: boolean }> = {};

  if (section === "orders") {
    const ordersResult = await supabase.from("orders").select("id,order_reference,order_status,total_price,created_at,cart_items,payment_reference,account_access,customer_whatsapp,coupon_usage(coupons(code))").eq("user_id", user.id).order("created_at", { ascending: false });
    rows = (ordersResult.data as Record<string, unknown>[]) ?? [];
    
    const gameIds = Array.from(new Set(
      rows.flatMap(r => {
        const items = Array.isArray(r.cart_items) ? r.cart_items : [];
        return items.map(item => Number(item.game_id || item.gameId)).filter(Boolean);
      })
    ));
    if (gameIds.length > 0) {
      const { data: gamesData } = await supabase
        .from("games")
        .select("id, title, cover_image, sale_price, original_price, genres, is_subscription")
        .in("id", gameIds);
      if (gamesData) {
        gamesData.forEach(g => {
          gamesMap[g.id] = g;
        });
      }
    }
  }
  if (section === "library") rows = (await supabase.from("customer_library").select("id,platform,purchased_at,activation_guide,delivery_notes,games(title,cover_image)").eq("user_id", user.id).order("purchased_at", { ascending: false })).data ?? [];
  if (section === "rewards") {
    const [{ data: reward }, { data: transactions }, { data: referrals }] = await Promise.all([
      supabase.from("user_rewards").select("points,level").eq("user_id", user.id).maybeSingle(),
      supabase.from("reward_transactions").select("id,points,reason,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("referrals").select("id,code,status,created_at").eq("referrer_id", user.id).order("created_at", { ascending: false }),
    ]);
    rows = [{ id: "reward-summary", reason: `${reward?.level ?? "Bronze"} level`, points: reward?.points ?? 0 }, ...(transactions ?? []), ...(referrals ?? []).map((referral) => ({ ...referral, reason: `Referral code: ${referral.code}` }))];
  }
  if (section === "coupons") {
    // Query approved/resolved support tickets for voucher requests
    const { data: approvedTickets } = await supabase
      .from("support_tickets")
      .select("id, status, subject, message")
      .eq("user_id", user.id)
      .or("subject.eq.Request Diamond Code,subject.ilike.Loyalty Freebie Request%")
      .in("status", ["resolved", "Approved"]);

    if (!approvedTickets || approvedTickets.length === 0) {
      redirect("/dashboard");
    }

    // Query user's current loyalty level/rank
    const { data: rewardsData } = await supabase
      .from("user_rewards")
      .select("level")
      .eq("user_id", user.id)
      .maybeSingle();

    const userLevel = rewardsData?.level ?? "Bronze";

    // Extract approved voucher codes from resolved support ticket messages
    const approvedCodes: string[] = [];
    approvedTickets.forEach((ticket) => {
      const match = ticket.message?.match(/\[Approved Code:\s*([A-Z0-9_-]+)\]/i);
      if (match && match[1]) {
        approvedCodes.push(match[1].toUpperCase());
      }
    });

    if (userLevel === "Diamond") {
      if (approvedCodes.length > 0) {
        rows = (await supabase
          .from("coupons")
          .select("id,code,discount_type,discount_value,minimum_order,expires_at")
          .eq("active", true)
          .in("code", approvedCodes)
          .order("expires_at")).data ?? [];
      } else {
        rows = [];
      }
    } else {
      // Non-Diamond users (e.g. Platinum, Gold, etc.) see all active coupons globally
      rows = (await supabase
        .from("coupons")
        .select("id,code,discount_type,discount_value,minimum_order,expires_at")
        .eq("active", true)
        .order("expires_at")).data ?? [];
    }
  }
  if (section === "notifications") rows = (await supabase.from("notifications").select("id,title,message,type,read,created_at").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [];
  if (section === "support") rows = (await supabase.from("support_tickets").select("id,subject,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [];
  if (section === "requests") rows = (await supabase.from("game_requests").select("id,game_name,platform,votes,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [];
  const [emptyTitle, emptyMessage, emptyHref, emptyAction] = current.empty;

  return <div className="page-shell py-10"><Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-[#b9a4ff] transition-colors"><ArrowLeft size={16} /> Dashboard</Link><div className="mt-8 flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-md bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#b9a4ff] shadow-[0_0_15px_rgba(139,92,246,0.15)]"><Icon /></span><div><p className="eyebrow">Account</p><h1 className="text-3xl font-black md:text-5xl bg-gradient-to-r from-white via-[#e8e3ff] to-[#b9a4ff] bg-clip-text text-transparent">{current.title}</h1></div></div>{section === "library" ? (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {rows.map((row) => {
        const game = row.games as { title?: string; cover_image?: string } | null;
        const gameTitle = game?.title || "Unknown Game";
        const coverUrl = game?.cover_image ? assetUrl(game.cover_image) : null;
        return (
          <Link
            key={String(row.id)}
            href="/dashboard/orders"
            className="group relative flex flex-col overflow-hidden rounded-lg border border-white/[.06] bg-[#0c0e18]/80 transition-all duration-300 hover:-translate-y-1 hover:border-[#facc15]/30 hover:shadow-[0_8px_24px_rgba(250,204,21,0.06)]"
          >
            {/* Card Image */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#05060b]">
              {coverUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={coverUrl}
                  alt={gameTitle}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#101424] to-[#080a12]">
                  <Gamepad2 className="h-8 w-8 text-white/20 animate-pulse" />
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-transparent to-transparent opacity-65" />
              {/* Platform tag */}
              <span className={`absolute top-2 left-2 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                row.platform === "Gifted" 
                  ? "bg-[#8b5cf6]/90 text-white border-[#8b5cf6]/30 shadow shadow-[#8b5cf6]/50 animate-pulse" 
                  : "bg-black/75 text-white border-white/10"
              }`}>
                {row.platform === "Gifted" ? "Gifted by Owner" : String(row.platform || "Steam")}
              </span>
            </div>

            {/* Card Info */}
            <div className="flex flex-1 flex-col p-3">
              <h3 className="truncate text-xs font-black text-white group-hover:text-[#facc15] transition-colors">
                {gameTitle}
              </h3>
              <span className="mt-1 block text-[9px] text-[#646b7b] uppercase font-black">
                Owned Since {row.purchased_at ? new Date(String(row.purchased_at)).toLocaleDateString("en-IN") : "Recent"}
              </span>

              {!!(row.activation_guide || row.delivery_notes) && (
                <div className="mt-2 flex-1 rounded bg-white/[0.02] p-2 border border-white/[.03]">
                  <p className="text-[10px] leading-relaxed text-[#8991a6] line-clamp-2 hover:line-clamp-none transition-all duration-300">
                    {String(row.activation_guide || row.delivery_notes)}
                  </p>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  ) : (
    <div className="mt-8 space-y-3">
      {rows.map((row) => {
        const isGiftNotification = section === "notifications" && (
          String(row.title).includes("Gift") ||
          String(row.message || "").toLowerCase().includes("gift") ||
          String(row.message || "").toLowerCase().includes("giveaway")
        );
        const orderRefStr = String(row.order_reference || row.id || "");
        const phoneStr = String(row.customer_whatsapp || "");
        const orderTrackUrl = `/track-order?order=${encodeURIComponent(orderRefStr)}${phoneStr ? `&phone=${encodeURIComponent(phoneStr)}` : ""}`;
        
        return (
          <article
            key={String(row.id)}
            className={`relative overflow-hidden rounded-md p-5 border ${
              isGiftNotification
                ? "border-[#facc15]/40 bg-gradient-to-br from-[#27153d] via-[#1a112c] to-[#301622] shadow-[0_0_20px_rgba(250,204,21,0.12)]"
                : "premium-panel border-white/[.06]"
            }`}
          >
            {isGiftNotification && (
              <>
                {/* Vertical Ribbon */}
                <div className="absolute right-14 top-0 bottom-0 w-3 bg-gradient-to-b from-red-500 via-red-600 to-red-700 opacity-60 pointer-events-none" />
                <div className="absolute right-[59px] top-0 bottom-0 w-[1px] bg-[#facc15]/30 pointer-events-none" />
                
                {/* Horizontal Ribbon */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 bg-gradient-to-r from-red-500 via-red-600 to-red-700 opacity-20 pointer-events-none" />
                
                {/* Gift Bow Icon */}
                <div className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-[#facc15] text-[#111] shadow-[0_2px_8px_rgba(250,204,21,0.4)] pointer-events-none animate-bounce">
                  <Gift size={12} />
                </div>
              </>
            )}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <strong>
                  {section === "notifications" ? (
                    <Link href={`/dashboard/notifications/${row.id}`} className={`${isGiftNotification ? 'text-[#fde047] hover:text-white' : 'hover:text-[#b9a4ff]'} hover:underline transition-colors`}>
                      {rowTitle(row)}
                    </Link>
                  ) : section === "orders" ? (
                    <Link href={orderTrackUrl} className="hover:text-[#b9a4ff] hover:underline transition-colors flex items-center gap-2">
                      <span>{rowTitle(row)}</span>
                      <ArrowRight size={14} className="text-[#b9a4ff] opacity-60" />
                    </Link>
                  ) : (
                    rowTitle(row)
                  )}
                </strong>
                <p className={`mt-2 line-clamp-2 text-sm ${isGiftNotification ? 'text-[#e9d5ff]' : 'text-[#8991a6]'}`}>
                  {String(row.message || row.activation_guide || row.delivery_notes || row.platform || row.type || "Rakexura account record")}
                </p>
              {section === "orders" && row.total_price === 0 && (() => {
                const isGifted = row.payment_reference === "GIFTED" || row.payment_reference === "GIVEAWAY";
                if (isGifted) {
                  return (
                    <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl border border-[#8b5cf6]/35 bg-[#8b5cf6]/5 px-3 py-1.5 text-xs font-black text-[#c4b5fd] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                      <Gift size={14} className="text-[#facc15] shrink-0 animate-pulse" />
                      <span>Gifted by Owner</span>
                    </div>
                  );
                }
                const usage = row.coupon_usage as Record<string, unknown>[] | null | undefined;
                const couponCode = (usage?.[0]?.coupons as Record<string, unknown> | null | undefined)?.code as string | undefined;
                return (
                  <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl border border-[#8b5cf6]/35 bg-[#8b5cf6]/5 px-3 py-1.5 text-xs font-black text-[#c4b5fd] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                    <TicketPercent size={14} className="text-[#facc15] shrink-0 animate-pulse" />
                    <span>Delivered free via coupon: <code className="text-white bg-[#8b5cf6]/20 px-1.5 py-0.5 rounded border border-[#8b5cf6]/30 font-extrabold uppercase tracking-wider">{couponCode || "LOYALTY-FREEBIE"}</code></span>
                  </div>
                );
              })()}
              {section === "orders" && (
                <Link
                  href={orderTrackUrl}
                  className="group/acc mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#8b5cf6]/30 bg-gradient-to-r from-[#8b5cf6]/10 via-[#181132] to-[#0d091e] p-3 transition-all duration-300 hover:border-[#b9a4ff]/60 hover:shadow-[0_4px_20px_rgba(139,92,246,0.18)] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#8b5cf6]/40 bg-[#8b5cf6]/20 text-[#facc15] shadow-[0_0_12px_rgba(139,92,246,0.3)] group-hover/acc:scale-110 transition-transform">
                      <Key size={16} />
                    </div>
                    <div>
                      <strong className="block text-xs font-extrabold text-white group-hover/acc:text-[#b9a4ff] transition-colors">
                        Account Login Credentials & Delivery Status
                      </strong>
                      <span className="text-[10px] text-[#8991a6]">Click to access your game login details & activation guidance</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-black text-[#b9a4ff] group-hover/acc:text-white group-hover/acc:translate-x-1 transition-all flex items-center gap-1">
                    View <ArrowRight size={13} />
                  </span>
                </Link>
              )}
              {(() => {
                if (section !== "orders") return null;
                const isDelivered = row.order_status === "Delivered" || row.order_status === "Completed";
                if (!isDelivered || !row.account_access) return null;

                return (
                  <details className="mt-4 group border border-[#8b5cf6]/35 bg-[#8b5cf6]/5 rounded-md overflow-hidden max-w-md">
                    <summary className="flex items-center justify-between px-4 py-2.5 text-xs font-black text-[#c4b5fd] cursor-pointer hover:bg-[#8b5cf6]/10 select-none list-none [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center gap-1.5">🔑 Quick View: Game Activation / Account Credentials</span>
                      <span className="text-[#8b5cf6] text-[10px] group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="px-4 py-3 border-t border-[#8b5cf6]/20 bg-black/40 text-xs text-slate-300 leading-relaxed shadow-inner">
                      <p className="font-bold text-[#cbbfff] mb-1.5">Your Activation / Account Credentials:</p>
                      <div className="font-mono bg-black/40 p-2.5 rounded border border-white/5 select-all whitespace-pre-wrap">
                        {String(row.account_access)}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-[10px] text-[#8991a6]">
                          Please use these details to access your game.
                        </p>
                        <Link href={orderTrackUrl} className="text-[11px] font-black text-[#b9a4ff] hover:underline flex items-center gap-1">
                          Full Account Details <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </details>
                );
              })()}
            </div>
            <div className="text-right flex flex-col items-end justify-center">
              {row.status || row.order_status ? (
                section === "orders" ? (
                  <Link
                    href={orderTrackUrl}
                    className={`rounded px-3 py-1.5 text-xs font-black inline-flex items-center gap-1.5 transition-all duration-200 hover:scale-105 ${
                      row.order_status === "Delivered" || row.order_status === "Completed"
                        ? "bg-[#00d68f]/15 text-[#00d68f] border border-[#00d68f]/30 hover:bg-[#00d68f]/25 shadow-[0_0_12px_rgba(0,214,143,0.2)]"
                        : "bg-white/[.06] text-white hover:bg-white/10"
                    }`}
                    title="Click to open full account login details page"
                  >
                    <span>{String(row.status || row.order_status)}</span>
                    <ArrowRight size={12} className="opacity-70" />
                  </Link>
                ) : (
                  <span className="rounded bg-white/[.06] px-3 py-1 text-xs font-bold block w-fit">
                    {String(row.status || row.order_status)}
                  </span>
                )
              ) : null}
              {typeof row.total_price === "number" && (
                row.total_price === 0 ? (
                  <div className="mt-2">
                    <span className="inline-block rounded-full bg-[#00d68f]/10 border border-[#00d68f]/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#00d68f] mb-1">
                      Free Order
                    </span>
                    <strong className="block text-sm font-black text-white">{formatPrice(0)}</strong>
                  </div>
                ) : (
                  <b className="mt-2 block text-white">{formatPrice(row.total_price)}</b>
                )
              )}
              {typeof row.points === "number" && (
                <b className={`mt-2 block ${row.points >= 0 ? "text-[#70efbb]" : "text-[#ff8585]"}`}>
                  {row.points > 0 ? "+" : ""}{row.points} points
                </b>
              )}
            </div>
          </div>
          {section === "orders" && Array.isArray(row.cart_items) && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="mb-3.5 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#aeb5c6]">Purchased Items</h4>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#c4b5fd]">
                  <Key size={10} className="text-[#facc15]" /> Click game for credentials
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(row.cart_items as Array<{ game_id?: number; gameId?: number; platform?: string; quantity?: number; unit_price?: number; price?: number }>).map((item) => {
                  const gameId = Number(item.game_id || item.gameId);
                  const game = gamesMap[gameId];
                  if (!game) return null;
                  return (
                    <div
                      key={`${row.id}-${gameId}-${item.platform}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[.06] bg-[#0a0816]/90 p-3.5 transition-all duration-300 hover:border-[#8b5cf6]/40 hover:bg-[#120d28] hover:shadow-[0_8px_24px_rgba(139,92,246,0.12)] group/game"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Link href={orderTrackUrl} className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-[#08090c] shadow-md group-hover/game:shadow-[0_0_16px_rgba(139,92,246,0.3)] transition-all" title="Click for account & activation details">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={assetUrl(game.cover_image)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover/game:scale-105" loading="lazy" />
                        </Link>
                        <div className="min-w-0">
                          <Link href={orderTrackUrl} title="Click for account & activation details">
                            <strong className="block truncate text-xs font-black text-white group-hover/game:text-[#b9a4ff] transition-colors">{game.title}</strong>
                            <span className="mt-1.5 inline-block rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#a4abbc]">
                              {item.platform || "Steam"} · Qty: {item.quantity}
                            </span>
                          </Link>
                          <strong className="mt-2 block text-xs font-black text-[#facc15] filter drop-shadow-[0_0_6px_rgba(250,204,21,0.3)]">
                            {formatPrice(item.unit_price || item.price)}
                          </strong>
                        </div>
                      </div>
                      {row.order_status === "Delivered" && (
                        <div className="shrink-0">
                          <WriteReviewTrigger gameId={gameId} gameTitle={game.title} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </article>
      );
    })}
  </div>
  )}
  {!rows.length && (
    <EmptyState
      icon={Icon}
      title={emptyTitle}
      message={emptyMessage}
      href={emptyHref}
      action={emptyAction}
    />
  )}
  {section === "support" && <SupportTicketForm />}
  {section === "requests" && rows.length > 0 && (
    <Link href="/requests" className="btn btn-primary mt-6">
      Request another game
    </Link>
  )}
</div>;
}
