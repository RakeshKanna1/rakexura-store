"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Check, ExternalLink, Package, ShieldCheck, AlertTriangle, Info, Megaphone } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

type Announcement = {
  id: number;
  message: string;
  icon_key: string;
};

const getNotificationTheme = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("deliver") || t.includes("success") || t.includes("complete")) {
    return {
      borderClass: "border-l-[#00d68f] bg-emerald-950/[0.02] hover:bg-emerald-950/[0.06] hover:border-l-[#00ffaa]",
      textClass: "text-[#70efbb]",
      iconColor: "text-[#00d68f] bg-[#00d68f]/10",
      icon: Package
    };
  }
  if (t.includes("verify") || t.includes("pay") || t.includes("confirm") || t.includes("approve")) {
    return {
      borderClass: "border-l-[#facc15] bg-yellow-950/[0.015] hover:bg-yellow-950/[0.04] hover:border-l-[#fcd34d]",
      textClass: "text-[#facc15]",
      iconColor: "text-[#facc15] bg-[#facc15]/10",
      icon: ShieldCheck
    };
  }
  if (t.includes("reject") || t.includes("cancel") || t.includes("fail")) {
    return {
      borderClass: "border-l-[#ef4444] bg-red-950/[0.02] hover:bg-red-950/[0.06] hover:border-l-[#f87171]",
      textClass: "text-[#ff7373]",
      iconColor: "text-[#ef4444] bg-[#ef4444]/10",
      icon: AlertTriangle
    };
  }
  return {
    borderClass: "border-l-[#8b5cf6] bg-purple-950/[0.02] hover:bg-purple-950/[0.06] hover:border-l-[#a78bfa]",
    textClass: "text-[#b9a4ff]",
    iconColor: "text-[#8b5cf6] bg-[#8b5cf6]/10",
    icon: Info
  };
};

export function HeaderNotificationButton() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUserNotifications = useCallback(async (uid: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id,title,message,read,link,created_at,type")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("marquee_messages")
      .select("id,message,icon_key")
      .eq("active", true)
      .limit(5);
    if (data) setAnnouncements(data);
  }, []);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      void fetchUserNotifications(user.id);
    } else {
      setUserId(null);
      setNotifications([]);
    }
    void fetchAnnouncements();
  }, [fetchUserNotifications, fetchAnnouncements]);

  useEffect(() => {
    void loadData();
    const supabase = createClient();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => void loadData());

    const handleUpdate = () => void loadData();
    window.addEventListener("rakexura-notifications-updated", handleUpdate);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("rakexura-notifications-updated", handleUpdate);
    };
  }, [loadData]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [open]);

  const markAsRead = async (id: number) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        suppressHydrationWarning
        onClick={() => setOpen(!open)}
        className="btn btn-secondary relative h-11 min-h-11 px-3 hover:border-[#facc15]/30 hover:bg-white/[.08]"
        aria-label="Open notifications"
      >
        <Bell size={19} className="text-[#aeb5c6] transition-colors hover:text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-black text-white ring-2 ring-[#050505] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-[86px] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-96 w-auto z-[99] overflow-hidden rounded-lg border border-white/10 bg-[#070913]/98 p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[.07] px-3 pb-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#d8dce6]">Notifications</span>
              {unreadCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444]/15 border border-[#ef4444]/30 px-1 text-[9px] font-bold text-[#ff7373]">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[9px] font-black uppercase tracking-wider text-[#facc15] hover:text-[#fbbf24] transition-colors bg-white/[0.03] hover:bg-white/[0.07] px-2.5 py-1 rounded border border-white/5 cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div data-lenis-prevent className="max-h-[340px] overflow-y-auto py-2 space-y-2 pr-1.5 custom-scrollbar">
            {userId ? (
              notifications.length > 0 ? (
                notifications.map((n) => {
                  const theme = getNotificationTheme(n.title);
                  const IconComponent = theme.icon;
                  return (
                    <div
                      key={n.id}
                      className={`group relative flex gap-3 p-3.5 transition rounded-md border border-white/[0.04] border-l-2 ${theme.borderClass} ${
                        !n.read ? "bg-white/[0.015]" : ""
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${theme.iconColor}`}>
                        <IconComponent size={15} />
                      </div>
                      <div className="min-w-0 flex-1 pr-8">
                        <div className="flex items-start justify-between gap-2">
                          <strong className={`text-xs font-black leading-tight tracking-wide ${!n.read ? "text-[#facc15]" : "text-[#d8dce6]"}`}>
                            {n.title}
                          </strong>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-[#8991a6] font-medium">{n.message}</p>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => setOpen(false)}
                            className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-[#b9a4ff] hover:text-white transition-colors bg-white/[0.03] hover:bg-white/[0.08] px-2 py-0.5 rounded border border-white/5"
                          >
                            Details <ExternalLink size={9} />
                          </Link>
                        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/[0.04] pt-2">
                          <span className="text-[9px] text-[#646b7b] font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!n.read ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n.id);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-[#00d68f]/10 hover:bg-[#00d68f]/20 border border-[#00d68f]/30 px-2 py-0.5 text-[9px] font-bold text-[#70efbb] transition-all cursor-pointer select-none"
                              title="Mark as read"
                            >
                              <Check size={10} /> Mark read
                            </button>
                          ) : (
                            <span className="text-[9px] font-semibold text-[#545c6e]">Read</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-12 text-center text-xs text-[#646b7b] font-bold">No notifications yet</div>
              )
            ) : (
              <div className="space-y-3.5 p-3">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#646b7b] px-1">
                  <Megaphone size={13} className="text-[#8b5cf6]" /> Store Announcements
                </span>
                {announcements.length > 0 ? (
                  announcements.map((a) => (
                    <div key={a.id} className="rounded-md border border-white/[0.05] bg-white/[0.015] p-3.5 text-xs leading-relaxed text-[#b5bdcf]">
                      {a.message}
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border border-white/[0.05] bg-white/[0.015] p-5 text-xs leading-relaxed text-center text-[#646b7b] font-semibold">
                    Welcome to Rakexura Store! Log in to receive personalized status updates.
                  </div>
                )}
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="mt-3.5 inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-md bg-[#8b5cf6] text-black font-extrabold text-xs shadow-[0_0_15px_rgba(139,92,246,0.15)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer hover:bg-[#a78bfa] text-white"
                >
                  Log in
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
