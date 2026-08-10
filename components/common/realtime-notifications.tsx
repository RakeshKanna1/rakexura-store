"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type NotificationRow = { title?: string; message?: string };

export function RealtimeNotifications() {
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let active = true;

    async function setupRealtime() {
      try {
        const res = await supabase.auth.getUser().catch(() => null);
        if (!res?.data?.user || !active) return;
        const user = res.data.user;
        
        channel = supabase
          .channel(`notifications:${user.id}`)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload: { new: Record<string, unknown> }) => {
            const notification = payload.new as NotificationRow;
            toast(notification.title || "Rakexura update", { description: notification.message });
          })
          .subscribe();
      } catch {
        // Silently catch network errors during offline or server restart
      }
    }

    void setupRealtime();

    return () => {
      active = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  return null;
}
