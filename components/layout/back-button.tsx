"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function BackButton() {
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
    <div className="relative z-30 page-shell pt-3 pointer-events-auto">
      <button
        suppressHydrationWarning
        type="button"
        onClick={goBack}
        className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-[#a0a8c0] transition hover:bg-white/[.05] hover:text-white cursor-pointer"
        aria-label="Go back"
      >
        <ArrowLeft size={17} /> Back
      </button>
    </div>
  );
}
