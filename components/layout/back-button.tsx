"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function BackButton({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  // Do not show Back button on homepage
  if (!pathname || pathname === "/" || pathname === "/otp-preview") return null;

  function goBack() {
    // 1. Admin hierarchy
    if (pathname.startsWith("/admin/") && pathname !== "/admin") {
      router.push("/admin");
      return;
    }
    if (pathname === "/admin") {
      router.push("/");
      return;
    }

    // 2. Dashboard hierarchy
    if (pathname.startsWith("/dashboard/") && pathname !== "/dashboard") {
      router.push("/dashboard");
      return;
    }
    if (pathname === "/dashboard" || pathname === "/profile") {
      router.push("/");
      return;
    }

    // 3. Checkout flow
    if (pathname === "/checkout") {
      router.push("/cart");
      return;
    }

    // 4. Safe internal history check
    const isInternalReferrer = typeof document !== "undefined" && document.referrer && document.referrer.includes(window.location.host);

    if (isInternalReferrer && window.history.length > 1) {
      router.back();
      return;
    }

    // 5. Intelligent Fallback Routing
    if (pathname.startsWith("/games/")) {
      router.push("/games");
    } else if (pathname.startsWith("/bundles/")) {
      router.push("/bundles");
    } else if (pathname === "/cart") {
      router.push("/games");
    } else {
      router.push("/");
    }
  }

  return (
    <div className={`relative z-30 pointer-events-auto mb-2 sm:mb-3 ${className}`}>
      <button
        suppressHydrationWarning
        type="button"
        onClick={goBack}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-[#a0a8c0] transition-all hover:bg-white/[0.08] hover:border-white/20 hover:text-white active:scale-95 cursor-pointer shadow-sm"
        aria-label="Go back"
      >
        <ArrowLeft size={14} /> <span>Back</span>
      </button>
    </div>
  );
}
