"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DashboardRealtimeSync({ userId }: { userId: string }) {
  const router = useRouter();
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  const debouncedRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      router.refresh();
    }, 120);
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    // 1. Listen to real-time changes on user_rewards, orders, and support_tickets
    const channel = supabase
      .channel(`dashboard-sync-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_rewards",
          filter: `user_id=eq.${userId}`,
        },
        debouncedRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        debouncedRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
          filter: `user_id=eq.${userId}`,
        },
        debouncedRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        debouncedRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customer_library",
          filter: `user_id=eq.${userId}`,
        },
        debouncedRefresh
      )
      .subscribe();

    // 2. Revalidate on tab focus / visibility change
    const onFocus = () => {
      debouncedRefresh();
    };
    window.addEventListener("focus", onFocus);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        debouncedRefresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId, debouncedRefresh]);

  return null;
}
