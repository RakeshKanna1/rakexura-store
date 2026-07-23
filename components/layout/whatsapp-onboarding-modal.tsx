"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Bell, MessageCircle, Shield, ArrowRight, Loader2, X, CheckCircle2 } from "lucide-react";

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
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }

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

      const existingPhone = profile?.whatsapp || "";
      if (existingPhone) {
        setPhone(existingPhone);
      }

      const hasWhatsapp = existingPhone.trim() !== "";
      const isNotificationSupported = typeof window !== "undefined" && "Notification" in window;
      const needsNotifications = isNotificationSupported && Notification.permission === "default";

      // Daily Prompt Logic: Don't show if prompted within the last 24 hours
      const lastPrompt = typeof window !== "undefined" ? localStorage.getItem("last_wp_onboard_prompt_time") : null;
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const hasPromptedRecently = lastPrompt && (now - Number(lastPrompt) < oneDay);

      if (hasPromptedRecently) {
        setIsOpen(false);
        return;
      }

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

    let cleanDigits = phone.replace(/\D/g, "");
    if (cleanDigits.length === 10) {
      cleanDigits = `91${cleanDigits}`;
    }

    if (cleanDigits.length < 10 || cleanDigits.length > 15) {
      toast.error("Please enter a valid WhatsApp phone number (10 to 15 digits).");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, whatsapp: cleanDigits, updated_at: new Date().toISOString() });

      if (error) throw error;

      toast.success("WhatsApp number linked successfully!");

      // Dispatch custom event & refresh router so profile tabs receive the new number immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("profile-updated", { detail: { whatsapp: cleanDigits } }));
      }
      router.refresh();

      // ALWAYS transition to Step 2 (Enable Notifications) when user clicks Continue
      setStep(2);
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
          "Notification permission is blocked. Please tap the lock/info icon in your browser address bar to enable notifications."
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

      setNotifPermission(permissionResult);

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
    if (typeof window !== "undefined") {
      localStorage.setItem("last_wp_onboard_prompt_time", Date.now().toString());
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#05070f]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl md:p-8 relative">
        {/* Glow Effects */}
        <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 h-36 w-36 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        {/* Close/Skip Button top-right */}
        <button
          onClick={handleSkipOrAcknowledge}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/[0.05] text-[#8991a6] hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Skip onboarding"
        >
          <X size={16} />
        </button>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className={`h-1.5 w-10 rounded-full transition-all duration-300 ${step === 1 ? "bg-[#facc15]" : "bg-white/20"}`} />
          <span className={`h-1.5 w-10 rounded-full transition-all duration-300 ${step === 2 ? "bg-[#facc15]" : "bg-white/20"}`} />
        </div>

        {step === 1 ? (
          <div>
            <div className="flex justify-center mb-4 text-[#facc15]">
              <MessageCircle size={40} className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white text-center bg-gradient-to-r from-white via-amber-200 to-[#facc15] bg-clip-text text-transparent flex items-center justify-center gap-2">
              <MessageCircle className="w-6 h-6 text-[#facc15]" /> Link Your WhatsApp
            </h2>
            <p className="mt-4 text-xs text-[#9ea6b9] text-center leading-relaxed">
              To ensure instant delivery of your game activation details, please link your active WhatsApp number before continuing.
            </p>

            <form onSubmit={handleWhatsappSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="whatsapp-phone" className="block text-xs font-bold uppercase tracking-wider text-[#facc15]">
                  WhatsApp Number
                </label>
                <input
                  id="whatsapp-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +91 98765 43210"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#facc15] focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 py-3 font-black text-black transition shadow-lg shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Continue <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkipOrAcknowledge}
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-xs font-semibold text-[#8991a6] hover:bg-white/5 hover:text-white transition"
              >
                Configure Later / Skip
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="flex justify-center mb-4 text-[#facc15]">
              <Bell size={40} className="animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-white text-center bg-gradient-to-r from-white via-amber-200 to-[#facc15] bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Bell className="w-6 h-6 text-[#facc15]" /> Enable Notifications
            </h2>
            <p className="mt-4 text-xs text-[#9ea6b9] text-center leading-relaxed">
              Get real-time updates directly on your device lock screen when your orders are processed and ready for activation.
            </p>

            <div className="mt-6 space-y-3">
              {notifPermission === "granted" ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 size={18} /> Device Notifications Active
                  </div>
                  <p className="mt-1 text-xs text-emerald-200/80">You are configured to receive instant order status alerts.</p>
                  <button
                    type="button"
                    onClick={handleSkipOrAcknowledge}
                    className="mt-4 w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-black hover:bg-emerald-400 transition"
                  >
                    Done / Finish
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleEnableNotifications}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 py-3 font-black text-black shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 text-sm"
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
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-3 text-xs font-semibold text-[#8991a6] hover:bg-white/5 hover:text-white transition"
                  >
                    Configure Later / Skip
                  </button>
                </>
              )}

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
