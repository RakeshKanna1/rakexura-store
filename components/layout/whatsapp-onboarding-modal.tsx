"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Bell, MessageCircle, Shield, ArrowRight, Loader2 } from "lucide-react";

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

export function WhatsAppOnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkUserOnboarding() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsOpen(false);
        return;
      }

      setUserId(user.id);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("whatsapp")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile for onboarding:", error.message);
        return;
      }

      const hasWhatsapp = profile && profile.whatsapp && profile.whatsapp.trim() !== "";
      const isNotificationSupported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
      const needsNotifications = isNotificationSupported && Notification.permission === "default";

      if (!hasWhatsapp) {
        setStep(1);
        setIsOpen(true);
      } else if (needsNotifications) {
        setStep(2);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }

    checkUserOnboarding();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        checkUserOnboarding();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleWhatsappSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const cleanDigits = phone.replace(/\D/g, "");

    if (cleanDigits.length < 10 || cleanDigits.length > 15) {
      toast.error("Please enter a valid WhatsApp phone number (10 to 15 digits).");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ whatsapp: cleanDigits })
        .eq("id", userId);

      if (error) throw error;

      toast.success("WhatsApp number linked successfully!");

      const isNotificationSupported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
      const needsNotifications = isNotificationSupported && Notification.permission === "default";

      if (needsNotifications) {
        setStep(2);
      } else {
        setIsOpen(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update WhatsApp number");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      if (typeof window === "undefined") return;

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

      const { error } = await supabase.from("push_subscriptions").insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh,
        auth
      });

      if (error && error.code !== "23505") {
        throw error;
      }

      toast.success("Push notifications enabled successfully!");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to enable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipOrAcknowledge = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#8b5cf6]/20 bg-[#0c0a1a] p-6 shadow-2xl md:p-8">
        
        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className={`h-1.5 w-10 rounded-full transition-all duration-300 ${step === 1 ? "bg-[#8b5cf6]" : "bg-white/20"}`} />
          <span className={`h-1.5 w-10 rounded-full transition-all duration-300 ${step === 2 ? "bg-[#8b5cf6]" : "bg-white/20"}`} />
        </div>

        {step === 1 ? (
          <div>
            <div className="flex justify-center mb-4 text-[#8b5cf6]">
              <MessageCircle size={40} className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white text-center bg-gradient-to-r from-white to-[#b9a4ff] bg-clip-text text-transparent">
              📱 Link Your WhatsApp
            </h2>
            <p className="mt-4 text-sm text-[#9ea6b9] text-center leading-relaxed">
              To ensure instant delivery of your game activation details, please link your active WhatsApp number before continuing.
            </p>

            <form onSubmit={handleWhatsappSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="whatsapp-phone" className="block text-xs font-bold uppercase tracking-wider text-[#8b5cf6]">
                  WhatsApp Number
                </label>
                <input
                  id="whatsapp-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +91 98765 43210"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/45 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#8b5cf6] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-[#00d68f] py-3 font-semibold text-black transition hover:bg-[#00b076] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Continue <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="flex justify-center mb-4 text-[#8b5cf6]">
              <Bell size={40} className="animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-white text-center bg-gradient-to-r from-white to-[#b9a4ff] bg-clip-text text-transparent">
              🔔 Enable Notifications
            </h2>
            <p className="mt-4 text-sm text-[#9ea6b9] text-center leading-relaxed">
              Get real-time updates directly on your device lock screen when your orders are processed and ready for activation.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-bold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Bell size={16} /> Enable Device Notifications
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkipOrAcknowledge}
                className="w-full rounded-lg border border-white/10 bg-white/[0.02] py-3 text-xs font-semibold text-[#8991a6] hover:bg-white/5 hover:text-white transition"
              >
                Configure Later / Skip
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[10px] text-[#727a90] text-center pt-2">
                <Shield size={12} /> Secure push subscription via standard browser API.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
