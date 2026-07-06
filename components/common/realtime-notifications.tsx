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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !active) return;
        
        channel = supabase
          .channel(`notifications:${user.id}`)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
            const notification = payload.new as NotificationRow;
            toast(notification.title || "Rakexura update", { description: notification.message });
          })
          .subscribe();
      } catch (err) {
        console.warn("Could not setup realtime notifications:", err);
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
