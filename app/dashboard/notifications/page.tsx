import Link from "next/link";
import { Bell, Gift } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GiftCelebration } from "@/components/dashboard/gift-celebration";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const currentFilter = params.filter || "all";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/notifications");

  // Fetch notifications with filter support
  let query = supabase
    .from("notifications")
    .select("id,title,message,read,link,type,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (currentFilter === "unread") {
    query = query.eq("read", false);
  }

  const { data: notifications = [] } = await query;

  // Stats for Filter Pills
  const { count: totalCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  const hasUnreadGift = notifications?.some((n) => {
    const isGift = n.title === "Gift Received!" ||
                   String(n.title).toLowerCase().includes("gift") ||
                   String(n.message || "").toLowerCase().includes("gift") ||
                   String(n.message || "").toLowerCase().includes("giveaway");
    return isGift && !n.read;
  });

  return (
    <div className="page-shell pb-16 pt-2">
      {/* Header Bar with Glowing Bell and Filter Tabs */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="flex items-center gap-3.5">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#b9a4ff] shadow-[0_0_15px_rgba(139,92,246,0.15)] shrink-0">
            <Bell size={22} />
          </span>
          <div>
            <p className="eyebrow uppercase font-bold tracking-wider text-[#b9a4ff]">ACCOUNT</p>
            <h1 className="mt-1 text-2xl font-black md:text-3xl bg-gradient-to-r from-white via-[#e8e3ff] to-[#b9a4ff] bg-clip-text text-transparent">
              Notifications
            </h1>
          </div>
        </div>

        {/* All & Unread Filter Pills */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/notifications"
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition duration-150 ${
              currentFilter === "all"
                ? "bg-white text-black shadow-sm"
                : "border border-white/10 bg-[#0d0f17] text-[#8991a6] hover:text-white hover:border-white/20"
            }`}
          >
            All ({totalCount || 0})
          </Link>
          <Link
            href="/dashboard/notifications?filter=unread"
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition duration-150 flex items-center gap-1.5 ${
              currentFilter === "unread"
                ? "bg-white text-black shadow-sm"
                : "border border-white/10 bg-[#0d0f17] text-[#8991a6] hover:text-white hover:border-white/20"
            }`}
          >
            <span>Unread</span>
            {(unreadCount || 0) > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${currentFilter === "unread" ? "bg-black text-white" : "bg-[#8b5cf6] text-white"}`}>
                {unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Notifications List */}
      {notifications && notifications.length > 0 ? (
        <div className="space-y-3.5">
          {notifications.map((n) => {
            const isGift = n.title === "Gift Received!" ||
                           String(n.title).toLowerCase().includes("gift") ||
                           String(n.message || "").toLowerCase().includes("gift") ||
                           String(n.message || "").toLowerCase().includes("giveaway");

            return (
              <Link
                href={n.link || `/dashboard/notifications/${n.id}`}
                key={n.id}
                className={`relative block overflow-hidden rounded-xl border p-5 transition duration-200 hover:border-[#b9a4ff]/40 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer shadow-lg ${
                  isGift
                    ? "border-[#facc15]/40 bg-gradient-to-br from-[#27153d] via-[#1a112c] to-[#301622] shadow-[0_12px_36px_rgba(250,204,21,0.15)]"
                    : "border-white/10 bg-[#0d0f17] hover:bg-[#121420]"
                }`}
              >
                {/* Special Gift Wrapper Ribbon Artwork */}
                {isGift && (
                  <>
                    {/* Vertical red ribbon */}
                    <div className="absolute right-24 top-0 bottom-0 w-4 bg-gradient-to-b from-red-500 via-red-600 to-red-700 opacity-60 pointer-events-none" />
                    <div className="absolute right-[100px] top-0 bottom-0 w-[1px] bg-[#facc15]/30 pointer-events-none" />

                    {/* Horizontal red ribbon */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-4 bg-gradient-to-r from-red-500 via-red-600 to-red-700 opacity-20 pointer-events-none" />

                    {/* Bouncing Gift Bow Icon */}
                    <div className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#facc15] text-[#111] shadow-[0_2px_10px_rgba(250,204,21,0.5)] pointer-events-none animate-bounce">
                      <Gift size={16} />
                    </div>
                  </>
                )}

                <div className="relative z-10 pr-12">
                  <strong className={`block text-base font-bold tracking-tight ${isGift ? "text-[#facc15]" : "text-white"}`}>
                    {n.title}
                  </strong>
                  <p className="mt-2 text-sm leading-relaxed text-[#8991a6]">
                    {n.message}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="premium-panel rounded-xl border border-white/10 bg-[#0d0f17] p-12 text-center shadow-xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.03] border border-white/10 text-[#8991a6]">
            <Bell size={24} />
          </div>
          <h2 className="mt-4 text-base font-black text-white">
            {currentFilter === "unread" ? "No unread notifications" : "No notifications yet"}
          </h2>
          <p className="mt-1.5 text-xs text-[#8991a6] max-w-md mx-auto leading-relaxed">
            {currentFilter === "unread"
              ? "You're all caught up! Switch back to All to view your notification history."
              : "When you receive game orders, slot credentials, or promotional alerts, they will appear here."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {currentFilter === "unread" ? (
              <Link href="/dashboard/notifications" className="btn btn-primary text-xs px-4 py-2 font-bold">
                View All Notifications
              </Link>
            ) : (
              <>
                <Link href="/dashboard" className="btn btn-secondary text-xs px-4 py-2">
                  Back to Dashboard
                </Link>
                <Link href="/games" className="btn btn-primary text-xs px-4 py-2 font-bold">
                  Browse Games
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {hasUnreadGift && <GiftCelebration />}
    </div>
  );
}
