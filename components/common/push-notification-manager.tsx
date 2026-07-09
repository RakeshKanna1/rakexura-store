"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Bell, BellOff, Loader2 } from "lucide-react";

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationToggle({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      
      // Check active subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
          setLoading(false);
        }).catch(() => setLoading(false));
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const subscribeUser = async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "denied") {
          throw new Error("Notification permission is blocked by your browser. Please tap the lock/info icon in your browser address bar and enable/allow notifications.");
        }
      }

      // Register Service Worker if not registered
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js");
      }

      await navigator.serviceWorker.ready;

      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        throw new Error("Push VAPID key is missing.");
      }

      // Handle standard and callback requestPermission structures
      let permissionResult = Notification.permission;
      if (permissionResult === "default") {
        permissionResult = await new Promise<NotificationPermission>((resolve) => {
          const res = Notification.requestPermission(resolve);
          if (res && typeof res.then === "function") {
            res.then(resolve);
          }
        });
      }

      if (permissionResult !== "granted") {
        throw new Error("Notification permission denied. Please click 'Allow' when the browser asks for permission.");
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      const p256dh = btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh") as ArrayBuffer)));
      const auth = btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth") as ArrayBuffer)));

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("push_subscriptions").insert({
        user_id: user?.id || null,
        endpoint: subscription.endpoint,
        p256dh,
        auth
      });

      if (error && error.code !== "23505") {
        throw error;
      }

      setIsSubscribed(true);
      toast.success("Phone notifications enabled successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeUser = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", subscription.endpoint);
      }

      setIsSubscribed(false);
      toast.success("Phone notifications disabled.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to disable notifications");
    } finally {
      setLoading(false);
    }
  };

  const [testing, setTesting] = useState(false);

  const sendTestPush = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/notifications/test-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Test push triggered! Check your phone/system notifications.");
      } else {
        throw new Error(data.error || "Failed to trigger push.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Test push failed");
    } finally {
      setTesting(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="rounded-lg border border-white/5 bg-black/15 p-4 text-xs text-[#8991a6]">
        Browser push notifications are not supported on this device or connection.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.04] bg-black/35 p-5 shadow-inner">
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-lg shrink-0 ${isSubscribed ? "bg-[#8b5cf6]/10 text-[#c9bcff]" : "bg-white/5 text-[#8991a6]"}`}>
            {isSubscribed ? <Bell size={18} /> : <BellOff size={18} />}
          </div>
          <div>
            <strong className="text-sm font-black text-white block">Device Notifications</strong>
            <p className="mt-1 text-xs text-[#8991a6]">
              {isSubscribed 
                ? "You will receive native updates on this device." 
                : "Enable to receive live order updates on your phone lock screen."}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isSubscribed && isAdmin && (
            <button
              onClick={sendTestPush}
              disabled={testing || loading}
              className="btn btn-secondary text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 border border-white/10 hover:bg-white/5"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : "Send Test Push"}
            </button>
          )}
        <button
          onClick={isSubscribed ? unsubscribeUser : subscribeUser}
          disabled={loading || testing}
          className={`btn text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 ${
            isSubscribed 
              ? "btn-secondary text-[#ff8585] border-red-500/20 hover:bg-red-500/10" 
              : "btn-primary bg-white text-black"
          }`}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isSubscribed ? (
            "Disable"
          ) : (
            "Enable Notifications"
          )}
        </button>
      </div>
    </div>
    {!isSubscribed && (
      <p className="rounded-lg border border-[#facc15]/10 bg-[#facc15]/[0.02] p-4 text-[11px] leading-relaxed text-[#facc15]/90">
        💡 <strong>Instruction:</strong> Enable device notifications to get live order updates, game deliveries, and rank rewards directly on your phone lockscreen!
      </p>
    )}
  </div>
  );
}
