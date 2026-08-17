"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Bell, MessageCircle, Shield, ArrowRight, Loader2, X, CheckCircle2 } from "lucide-react";
import { saveWhatsAppNumber } from "@/app/dashboard/settings/actions";

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
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Skip checking or opening on authentication routes
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/auth")
    ) {
      setIsOpen(false);
      return;
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }

    let timer: NodeJS.Timeout;

    async function checkUserOnboarding() {
      try {
        const res = await supabase.auth.getUser().catch(() => null);
        const user = res?.data?.user;

        // Only prompt logged-in accounts for onboarding
        if (!user) {
          setUserId(null);
          setIsOpen(false);
          return;
        }

        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("whatsapp")
          .eq("id", user.id)
          .maybeSingle();

        const existingPhone = profile?.whatsapp || "";
        if (existingPhone) {
          setPhone(existingPhone);
        }

        const hasWhatsapp = existingPhone.trim() !== "";
        const isNotificationSupported = typeof window !== "undefined" && "Notification" in window;
        const needsNotifications = isNotificationSupported && Notification.permission === "default";

        // Session dismissal check
        const sessionDismissed = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("wp_modal_session_dismissed") : null;
        if (sessionDismissed === "true") {
          setIsOpen(false);
          return;
        }

        // If customer has NOT linked WhatsApp, prompt them
        if (!hasWhatsapp) {
          timer = setTimeout(() => {
            setStep(1);
            setIsOpen(true);
          }, 2000);
          return;
        }

        // If customer HAS WhatsApp but needs device notifications
        const lastPrompt = typeof window !== "undefined" ? localStorage.getItem("last_wp_onboard_prompt_time") : null;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const hasPromptedRecently = lastPrompt && (now - Number(lastPrompt) < oneDay);

        if (!hasPromptedRecently && needsNotifications) {
          timer = setTimeout(() => {
            setStep(2);
            setIsOpen(true);
          }, 2000);
        } else {
          setIsOpen(false);
        }
      } catch {
        setIsOpen(false);
      }
    }

    checkUserOnboarding();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem("wp_modal_session_dismissed");
        }
        checkUserOnboarding();
      }
    });

    return () => {
      if (timer) clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [supabase, pathname]);

  const handleWhatsappSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (userId) {
        const res = await saveWhatsAppNumber(phone);
        if (!res.success) {
          throw new Error(res.error || "Failed to update WhatsApp number");
        }
      } else if (typeof window !== "undefined") {
        localStorage.setItem("guest_whatsapp_phone", phone);
      }

      toast.success("Mobile/WhatsApp number linked successfully!");

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("profile-updated", { detail: { whatsapp: phone } }));
        sessionStorage.removeItem("wp_modal_session_dismissed");
      }
      router.refresh();

      if (userId && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
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
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("wp_modal_session_dismissed", "true");
    }
    setIsOpen(false);
  };

  // Exclude auth routes completely
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#08090c] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.9)] backdrop-blur-xl md:p-8 relative">
        {/* Subtle Ambient Accent */}
        <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-[#facc15]/5 blur-3xl pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-[#8b5cf6]/5 blur-3xl pointer-events-none" />

        {/* Close/Skip Button top-right */}
        <button
          onClick={handleSkipOrAcknowledge}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-md bg-white/[0.04] text-[#8991a6] hover:bg-white/10 hover:text-white transition-colors cursor-pointer border border-white/5"
          aria-label="Skip onboarding"
        >
          <X size={15} />
        </button>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className={`h-1 w-8 rounded-full transition-all duration-300 ${step === 1 ? "bg-[#25d366]" : "bg-white/15"}`} />
          <span className={`h-1 w-8 rounded-full transition-all duration-300 ${step === 2 ? "bg-[#facc15]" : "bg-white/15"}`} />
        </div>

        {step === 1 ? (
          <div>
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg border border-[#25d366]/30 bg-[#25d366]/10 text-[#25d366]">
              <MessageCircle size={22} />
            </div>
            <h2 className="text-xl font-black text-white text-center tracking-tight">
              Link Your WhatsApp
            </h2>
            <p className="mt-2 text-xs text-[#8991a6] text-center leading-relaxed">
              To ensure instant delivery of your game activation details, please link your active WhatsApp number before continuing.
            </p>

            <form onSubmit={handleWhatsappSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="whatsapp-phone" className="block text-[11px] font-black uppercase tracking-wider text-[#25d366]">
                  WhatsApp Number
                </label>
                <input
                  id="whatsapp-phone"
                  type="tel"
                  required
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +91 98765 43210"
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/40 px-3.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#25d366] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-[#25d366] hover:bg-[#20ba5a] h-11 font-black text-black transition shadow-md shadow-[#25d366]/15 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkipOrAcknowledge}
                className="w-full rounded-md border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] h-10 text-xs font-bold text-[#8991a6] hover:text-white transition cursor-pointer"
              >
                Configure Later / Skip
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg border border-[#facc15]/20 bg-[#facc15]/10 text-[#facc15]">
              <Bell size={22} />
            </div>
            <h2 className="text-xl font-black text-white text-center tracking-tight">
              Enable Device Notifications
            </h2>
            <p className="mt-2 text-xs text-[#8991a6] text-center leading-relaxed">
              Get real-time updates directly on your device lock screen when your orders are processed and ready for activation.
            </p>

            <div className="mt-6 space-y-3">
              {notifPermission === "granted" ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 size={16} /> Device Notifications Active
                  </div>
                  <p className="mt-1 text-xs text-emerald-200/80">You are configured to receive instant order status alerts.</p>
                  <button
                    type="button"
                    onClick={handleSkipOrAcknowledge}
                    className="mt-4 w-full rounded-md bg-emerald-500 hover:bg-emerald-400 h-10 text-xs font-black text-black transition cursor-pointer"
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
                    className="w-full rounded-md bg-[#facc15] hover:bg-[#ffe45c] h-11 font-black text-black shadow-md shadow-[#facc15]/10 transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Bell size={15} /> <span>Enable Device Notifications</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipOrAcknowledge}
                    className="w-full rounded-md border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] h-10 text-xs font-bold text-[#8991a6] hover:text-white transition cursor-pointer"
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
