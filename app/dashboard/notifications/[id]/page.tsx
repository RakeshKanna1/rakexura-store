import Link from "next/link";
import { ArrowLeft, Bell, Gift } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GiftCelebration } from "@/components/dashboard/gift-celebration";

export default async function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/notifications/${id}`)}`);

  // Fetch specific notification
  const { data: notification } = await supabase
    .from("notifications")
    .select("*")
    .eq("id", Number(id))
    .eq("user_id", user.id)
    .maybeSingle();

  if (!notification) notFound();

  // Mark notification as read when viewed
  if (!notification.read) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notification.id);
  }

  const isGift = notification.title === "Gift Received!" ||
                 String(notification.title).toLowerCase().includes("gift") ||
                 String(notification.message || "").toLowerCase().includes("gift") ||
                 String(notification.message || "").toLowerCase().includes("giveaway");

  return (
    <div className="page-shell py-10">
      <Link href="/dashboard/notifications" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#8991a6] hover:text-[#b9a4ff] transition-colors">
        <ArrowLeft size={16} /> Back to notifications
      </Link>
      <div className="mx-auto mt-6 max-w-2xl">
        <div className={`relative overflow-hidden rounded-md p-6 border ${
          isGift 
            ? "border-[#facc15]/40 bg-gradient-to-br from-[#27153d] via-[#1a112c] to-[#301622] shadow-[0_12px_36px_rgba(250,204,21,0.15)]" 
            : "premium-panel bg-[#0f0c22]/80 border-[#8b5cf6]/20 shadow-[0_12px_36px_rgba(0,0,0,0.3)]"
        }`}>
          {isGift && (
            <>
              {/* Vertical red ribbon */}
              <div className="absolute right-24 top-0 bottom-0 w-4 bg-gradient-to-b from-red-500 via-red-600 to-red-700 opacity-60 pointer-events-none" />
              <div className="absolute right-[100px] top-0 bottom-0 w-[1px] bg-[#facc15]/30 pointer-events-none" />
              
              {/* Horizontal red ribbon */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-4 bg-gradient-to-r from-red-500 via-red-600 to-red-700 opacity-20 pointer-events-none" />
              
              {/* Gift Bow Icon */}
              <div className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#facc15] text-[#111] shadow-[0_2px_10px_rgba(250,204,21,0.5)] pointer-events-none animate-bounce">
                <Gift size={16} />
              </div>
            </>
          )}

          <div className="relative z-10 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#b9a4ff] shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              {isGift ? <Gift className="text-[#facc15]" /> : <Bell />}
            </span>
            <div>
              <p className="eyebrow uppercase font-bold tracking-wider text-[#b9a4ff]">{notification.type || "general"}</p>
              <h1 className="mt-2 text-2xl font-black md:text-3xl bg-gradient-to-r from-white via-[#e8e3ff] to-[#b9a4ff] bg-clip-text text-transparent">
                {notification.title}
              </h1>
            </div>
          </div>
          <div className="relative z-10 mt-6 rounded-md bg-black/20 p-5 text-sm leading-7 text-[#b9c0d0] border border-white/5">
            {notification.message}
          </div>
          {notification.link && (
            <div className="relative z-10 mt-6 flex justify-end">
              <Link href={notification.link} className="btn btn-primary text-xs font-bold px-5">
                View related details
              </Link>
            </div>
          )}
        </div>
      </div>
      {isGift && <GiftCelebration />}
    </div>
  );
}
