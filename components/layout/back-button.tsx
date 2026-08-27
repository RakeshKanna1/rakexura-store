"use client";

import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface BackButtonProps {
  label?: string;
  href?: string;
  className?: string;
}

export function BackButton({ label, href, className = "" }: BackButtonProps) {
  const pathname = usePathname() || "";
  const router = useRouter();

  // If on homepage or otp-preview and no explicit href, don't show
  if (!href && (pathname === "/" || pathname === "/otp-preview")) return null;

  function goBack(e: React.MouseEvent) {
    if (href) return;
    e.preventDefault();

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

  const defaultLabel = pathname.startsWith("/games/")
    ? "Back to Games"
    : pathname.startsWith("/bundles/")
      ? "Back to Bundles"
      : pathname === "/checkout"
        ? "Back to Cart"
        : pathname.startsWith("/admin/")
          ? "Back to Admin"
          : "Back";

  const displayLabel = label ?? defaultLabel;

  // Small & compact back button styling
  const btnClasses = "group inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#121212]/80 px-2.5 py-1 text-[11px] font-medium tracking-wide text-[#a0a8c0] backdrop-blur-md transition-all duration-150 hover:border-white/20 hover:bg-[#1a1a1a] hover:text-white active:scale-95 cursor-pointer select-none shadow-sm";

  if (href) {
    return (
      <div className={`relative z-30 pointer-events-auto ${className}`}>
        <Link
          href={href}
          className={btnClasses}
          aria-label={displayLabel}
        >
          <ChevronLeft size={13} className="shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5" />
          <span>{displayLabel}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={`relative z-30 pointer-events-auto ${className}`}>
      <button
        suppressHydrationWarning
        type="button"
        onClick={goBack}
        className={btnClasses}
        aria-label={displayLabel}
      >
        <ChevronLeft size={13} className="shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5" />
        <span>{displayLabel}</span>
      </button>
    </div>
  );
}
