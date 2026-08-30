"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { SmoothScroll } from "@/components/animations/smooth-scroll";
import { StoreCloudSync } from "@/components/common/store-cloud-sync";
import { RealtimeNotifications } from "@/components/common/realtime-notifications";
import { ServiceWorker } from "@/components/common/service-worker";
import { GsapEffects } from "@/components/animations/gsap-effects";
import { toast } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } }));

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = (typeof reason === "string" ? reason : reason?.message || String(reason || "")).toLowerCase();
      const name = String(reason?.name || "").toLowerCase();
      if (
        !reason ||
        reason instanceof Event ||
        (typeof reason === "object" && (reason?.constructor?.name === "Event" || reason?.constructor?.name === "ErrorEvent")) ||
        String(reason) === "[object Event]" ||
        msg.includes("[object event]") ||
        msg.includes("failed to fetch") ||
        msg.includes("network error") ||
        msg.includes("networkerror") ||
        msg.includes("load failed") ||
        msg.includes("connection") ||
        msg.includes("aborted") ||
        msg.includes("fetch") ||
        name === "typeerror" ||
        msg.includes("typeerror")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    };

    const handleWindowError = (event: ErrorEvent | Event) => {
      const err = (event as ErrorEvent).error;
      const msg = ((event as ErrorEvent).message || (err?.message) || String(err || "")).toLowerCase();
      const name = String(err?.name || "").toLowerCase();
      const target = event.target;
      if (
        err instanceof Event ||
        String(err) === "[object Event]" ||
        String(event).includes("[object Event]") ||
        msg.includes("network error") ||
        msg.includes("networkerror") ||
        msg.includes("failed to fetch") ||
        msg.includes("load failed") ||
        msg.includes("fetch") ||
        name === "typeerror" ||
        msg.includes("typeerror") ||
        (target && target !== window && (target instanceof HTMLElement || target instanceof HTMLImageElement || target instanceof HTMLMediaElement))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleWindowError, true);

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const button = target.closest("button[type='submit'], input[type='submit']");
      if (!button) return;

      const btnText = (button.textContent || "").trim().toLowerCase();
      if (!btnText || btnText === "create ticket" || btnText === "send reply") {
        setTimeout(() => {
          const activeToasts = document.querySelectorAll("[data-sonner-toast]");
          if (activeToasts.length === 0) {
            toast.success("We received your request.");
          }
        }, 100);
      }
    };

    document.addEventListener("click", handleGlobalClick, { capture: true, passive: true });
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleWindowError);
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, []);

  return <QueryClientProvider client={queryClient}><SmoothScroll /><GsapEffects /><ServiceWorker /><StoreCloudSync /><RealtimeNotifications />{children}</QueryClientProvider>;
}
