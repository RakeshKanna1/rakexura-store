"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Shield, ArrowRight, Loader2, X, CheckCircle2 } from "lucide-react";
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
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enablePush, setEnablePush] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 1. Skip on authentication, registration, or admin routes
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/admin")
    ) {
      setIsOpen(false);
      return;
    }

    let timer: NodeJS.Timeout;

    async function checkUserOnboarding() {
      try {
        const res = await supabase.auth.getUser().catch(() => null);
        const user = res?.data?.user;

        // Only prompt logged-in accounts
        if (!user) {
          setUserId(null);
          setIsOpen(false);
          return;
        }

        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("whatsapp, phone")
          .eq("id", user.id)
          .maybeSingle();

        const localPhone = typeof window !== "undefined" ? localStorage.getItem("guest_whatsapp_phone") || "" : "";
        const existingPhone = (profile?.whatsapp || profile?.phone || localPhone || "").trim();
        if (existingPhone) {
          setPhone(existingPhone);
        }

        // If user already has WhatsApp linked, NEVER show the modal
        if (existingPhone) {
          setIsOpen(false);
          return;
        }

        // Check if dismissed in this session
        const sessionDismissed = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("wp_modal_session_dismissed") : null;
        if (sessionDismissed === "true") {
          setIsOpen(false);
          return;
        }

        // Context-aware delay: immediate on dashboard/checkout (2s), graceful on browsing pages (6s)
        const isActionableRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/checkout") || pathname.startsWith("/account") || pathname.startsWith("/orders");
        const delayMs = isActionableRoute ? 1800 : 6000;

        timer = setTimeout(() => {
          setIsOpen(true);
        }, delayMs);
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
    const cleanDigits = phone.replace(/\D/g, "");

    if (!cleanDigits || cleanDigits.length < 10) {
      return toast.error("Please enter a valid 10-digit WhatsApp number");
    }

    setIsLoading(true);

    try {
      if (userId) {
        const res = await saveWhatsAppNumber(cleanDigits);
        if (!res.success) {
          throw new Error(res.error || "Failed to update WhatsApp number");
        }
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("guest_whatsapp_phone", cleanDigits);
        window.dispatchEvent(new CustomEvent("profile-updated", { detail: { whatsapp: cleanDigits } }));
        sessionStorage.removeItem("wp_modal_session_dismissed");
      }

      // Optional push notification subscription if selected and supported
      if (enablePush && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        try {
          const perm = await Notification.requestPermission();
          if (perm === "granted") {
            let reg = await navigator.serviceWorker.getRegistration();
            if (!reg) {
              reg = await navigator.serviceWorker.register("/sw.js");
            }
            await navigator.serviceWorker.ready;
            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (publicVapidKey && reg.pushManager) {
              const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
              });
              const p256dh = btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh") as ArrayBuffer)));
              const auth = btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth") as ArrayBuffer)));
              await supabase.from("push_subscriptions").insert({
                user_id: userId,
                endpoint: sub.endpoint,
                p256dh,
                auth
              });
            }
          }
        } catch {
          // Non-blocking: continue if push fails
        }
      }

      setIsSuccess(true);
      toast.success("WhatsApp number linked successfully!");
      router.refresh();

      setTimeout(() => {
        setIsOpen(false);
      }, 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link WhatsApp number");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("wp_modal_session_dismissed", "true");
    }
    setIsOpen(false);
  };

  // Skip completely on auth or admin routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#08090c] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.9)] backdrop-blur-xl md:p-8 relative">
        {/* Subtle Ambient Accent */}
        <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-[#25d366]/5 blur-3xl pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-[#facc15]/5 blur-3xl pointer-events-none" />

        {/* Close/Skip Button */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-md bg-white/[0.04] text-[#8991a6] hover:bg-white/10 hover:text-white transition-colors cursor-pointer border border-white/5"
          aria-label="Close modal"
        >
          <X size={15} />
        </button>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#25d366]/10 text-[#25d366] border border-[#25d366]/30">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-black text-white">WhatsApp Linked!</h3>
            <p className="text-xs text-[#8991a6]">
              Your account is ready for instant game key and order delivery.
            </p>
          </div>
        ) : (
          <div>
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg border border-[#25d366]/30 bg-[#25d366]/10 text-[#25d366]">
              <MessageCircle size={22} />
            </div>
            <h2 className="text-xl font-black text-white text-center tracking-tight">
              Link Your WhatsApp
            </h2>
            <p className="mt-2 text-xs text-[#8991a6] text-center leading-relaxed">
              We deliver your game keys, account credentials, and instant order updates directly via WhatsApp.
            </p>

            <form onSubmit={handleWhatsappSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="whatsapp-phone" className="block text-[11px] font-black uppercase tracking-wider text-[#25d366]">
                  WhatsApp Number *
                </label>
                <input
                  id="whatsapp-phone"
                  type="tel"
                  required
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/40 px-3.5 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#25d366] focus:outline-none font-mono"
                />
              </div>

              {/* Optional Push Notification Checkbox */}
              {typeof window !== "undefined" && "Notification" in window && Notification.permission === "default" && (
                <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer text-left">
                  <input
                    type="checkbox"
                    checked={enablePush}
                    onChange={(e) => setEnablePush(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-black/40 text-[#facc15] focus:ring-0 cursor-pointer"
                  />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-white block">Also enable device notifications</span>
                    <span className="text-[#8991a6]">Get instant popups when game keys are dispatched.</span>
                  </div>
                </label>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-[#25d366] hover:bg-[#20ba5a] h-11 font-black text-black transition shadow-md shadow-[#25d366]/15 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer mt-2"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin text-black" />
                ) : (
                  <>
                    <span>Confirm & Link Account</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full rounded-md border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] h-10 text-xs font-bold text-[#8991a6] hover:text-white transition cursor-pointer"
              >
                Configure Later / Skip
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[10px] text-[#727a90] text-center pt-1">
                <Shield size={12} className="text-[#25d366]" />
                <span>Your number is kept strictly private & used only for order delivery.</span>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
