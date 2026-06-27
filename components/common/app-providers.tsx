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
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest("button, [role='button'], input[type='submit'], input[type='button']");
      if (!button) return;

      const btnText = (button.textContent || "").trim().toLowerCase();
      const btnClass = button.className.toLowerCase();
      const btnId = button.id.toLowerCase();
      const ariaLabel = (button.getAttribute("aria-label") || "").toLowerCase();

      // Exclude back buttons
      const isBackButton = 
        btnText.includes("back") ||
        btnText.includes("previous") ||
        btnText.includes("prev") ||
        btnText.includes("return") ||
        btnClass.includes("back") ||
        btnId.includes("back") ||
        ariaLabel.includes("back");

      if (isBackButton) return;

      // Exclude dismiss, close, cancel, remove, delete, quantity adjuster, pagination, ratings, carousel, or slider buttons
      const isDismissOrUtility = 
        btnText === "x" ||
        btnText === "×" ||
        btnText === "+" ||
        btnText === "-" ||
        btnText.includes("close") ||
        btnText.includes("cancel") ||
        btnText.includes("dismiss") ||
        btnText.includes("remove") ||
        btnText.includes("delete") ||
        btnClass.includes("close") ||
        btnClass.includes("dismiss") ||
        btnClass.includes("delete") ||
        btnClass.includes("remove") ||
        btnClass.includes("swiper") ||
        btnClass.includes("bullet") ||
        btnClass.includes("pagination") ||
        ariaLabel.includes("close") ||
        ariaLabel.includes("delete") ||
        ariaLabel.includes("star") ||
        ariaLabel.includes("rating") ||
        ariaLabel.includes("next slide") ||
        ariaLabel.includes("previous slide");

      if (isDismissOrUtility) return;

      // Only show receipt acknowledgement for specific essential form submissions
      const isSubmit = button.getAttribute("type") === "submit";
      const isInteractive = 
        (isSubmit && 
         !btnText.includes("review") && 
         !btnText.includes("request") && 
         !btnText.includes("login") && 
         !btnText.includes("sign") && 
         !btnText.includes("register") && 
         !btnText.includes("cart") && 
         !btnText.includes("coupon") && 
         !btnText.includes("save") && 
         !btnText.includes("settings") && 
         !btnText.includes("wishlist")) ||
        btnText === "create ticket" ||
        btnText === "send reply";

      if (isInteractive) {
        setTimeout(() => {
          // If no sonner toast is active in DOM, trigger general acknowledgement toast
          const activeToasts = document.querySelectorAll("[data-sonner-toast]");
          if (activeToasts.length === 0) {
            toast.success("We received your request.");
          }
        }, 100);
      }
    };

    document.addEventListener("click", handleGlobalClick, true);
    return () => document.removeEventListener("click", handleGlobalClick, true);
  }, []);

  return <QueryClientProvider client={queryClient}><SmoothScroll /><GsapEffects /><ServiceWorker /><StoreCloudSync /><RealtimeNotifications />{children}</QueryClientProvider>;
}
