"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Bell, LogIn, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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

export function MobilePromptManager() {
  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState<"login" | "push" | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Only run on mobile/tablet viewports
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;

    const timer = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // User is NOT logged in: check if login prompt was already shown this session
          const hasShownLogin = sessionStorage.getItem("shown_mobile_login_prompt");
          if (!hasShownLogin) {
            setShowPrompt("login");
          }
        } else {
          // User IS logged in: check push permission status
          if ("Notification" in window && "serviceWorker" in navigator && "PushManager" in window) {
            const permission = Notification.permission;
            
            if (permission !== "granted") {
              const hasShownPush = sessionStorage.getItem("shown_mobile_push_prompt");
              if (!hasShownPush) {
                setShowPrompt("push");
              }
            }
          }
        }
      } catch (err) {
        console.error("Error in mobile prompt checking:", err);
      }
    }, 5500); // 5.5 seconds delay

    return () => clearTimeout(timer);
  }, [supabase]);

  useEffect(() => {
    const pushTimer = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if ("Notification" in window) {
            if (Notification.permission !== "granted") {
              const { sendPushEncouragement } = await import("@/app/admin/actions");
              await sendPushEncouragement();
            }
          }
        }
      } catch (err) {
        console.error("Error in push notification encouragement:", err);
      }
    }, 10000); // 10 seconds delay

    return () => clearTimeout(pushTimer);
  }, [supabase]);

  const handleDismiss = () => {
    if (showPrompt === "login") {
      sessionStorage.setItem("shown_mobile_login_prompt", "true");
    } else if (showPrompt === "push") {
      sessionStorage.setItem("shown_mobile_push_prompt", "true");
    }
    setShowPrompt(null);
  };

  const handleLoginRedirect = () => {
    sessionStorage.setItem("shown_mobile_login_prompt", "true");
    setShowPrompt(null);
    router.push("/login");
  };

  const handleEnablePush = async () => {
    setLoading(true);
    try {
      if (Notification.permission === "denied") {
        throw new Error(
          "Notification permission is blocked. Please tap the lock/info icon in your browser address bar and enable/allow notifications."
        );
      }

      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js");
      }

      await navigator.serviceWorker.ready;

      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        throw new Error("Push VAPID key is missing.");
      }

      let permissionResult: NotificationPermission = Notification.permission;
      if (permissionResult === "default") {
        permissionResult = await new Promise<NotificationPermission>((resolve) => {
          const res = Notification.requestPermission(resolve);
          if (res && typeof res.then === "function") {
            res.then(resolve);
          }
        });
      }

      if (permissionResult !== "granted") {
        throw new Error("Permission denied. Click 'Allow' when prompted by your browser.");
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

      sessionStorage.setItem("shown_mobile_push_prompt", "true");
      setShowPrompt(null);
      toast.success("Push notifications enabled successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-16 left-4 right-4 z-[200] max-w-sm mx-auto rounded-xl border border-white/[0.08] bg-black/95 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-fade-in-up">
      <button 
        type="button" 
        onClick={handleDismiss} 
        className="absolute right-3 top-3 rounded p-1 text-[#8991a6] hover:bg-white/5 hover:text-white transition"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>

      {showPrompt === "login" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#8b5cf6]/10 text-[#c9bcff]">
              <LogIn size={16} />
            </div>
            <h4 className="text-sm font-bold text-white">Sign in to Rakexura</h4>
          </div>
          <p className="text-xs leading-relaxed text-[#8991a6]">
            Create an account or login to unlock milestone coupon rewards, save games to your wishlist, and track order deliveries instantly.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-md border border-white/10 bg-white/[0.02] py-2 text-xs font-semibold text-[#8991a6] hover:bg-white/5 hover:text-white transition"
              type="button"
            >
              Later
            </button>
            <button
              onClick={handleLoginRedirect}
              className="flex-1 rounded-md bg-white py-2 text-xs font-black text-black hover:bg-neutral-100 transition"
              type="button"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {showPrompt === "push" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#facc15]/10 text-[#facc15]">
              <Bell size={16} />
            </div>
            <h4 className="text-sm font-bold text-white">Enable Notifications</h4>
          </div>
          <p className="text-xs leading-relaxed text-[#8991a6]">
            Get live, real-time alerts on your phone lock screen when your game payments are verified and game delivery instructions are ready!
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-md border border-white/10 bg-white/[0.02] py-2 text-xs font-semibold text-[#8991a6] hover:bg-white/5 hover:text-white transition"
              type="button"
            >
              Later
            </button>
            <button
              onClick={handleEnablePush}
              disabled={loading}
              className="flex-1 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 py-2 text-xs font-black text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition flex items-center justify-center gap-1.5"
              type="button"
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                "Enable"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
