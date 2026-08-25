"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface BackButtonProps {
  label?: string;
  href?: string;
  className?: string;
  variant?: "box" | "ghost";
}

export function BackButton({ label, href, className = "", variant = "ghost" }: BackButtonProps) {
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
          : pathname.startsWith("/dashboard/")
            ? "Back to Dashboard"
            : "Back";

  const displayLabel = label ?? defaultLabel;

  const btnClasses = variant === "ghost"
    ? "group inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white transition-all active:scale-95 cursor-pointer drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none"
    : "group inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm font-medium text-[#cbd5e1] transition-all hover:bg-white/[0.08] hover:border-white/20 hover:text-white active:scale-95 cursor-pointer shadow-sm backdrop-blur-md select-none";

  if (href) {
    return (
      <div className={`relative z-30 pointer-events-auto ${variant === "box" ? "mb-2 sm:mb-3" : ""} ${className}`}>
        <Link
          href={href}
          className={btnClasses}
          aria-label={displayLabel}
        >
          <ArrowLeft size={16} className="shrink-0 transition-transform group-hover:-translate-x-1 stroke-[2.5]" />
          <span>{displayLabel}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={`relative z-30 pointer-events-auto ${variant === "box" ? "mb-2 sm:mb-3" : ""} ${className}`}>
      <button
        suppressHydrationWarning
        type="button"
        onClick={goBack}
        className={btnClasses}
        aria-label={displayLabel}
      >
        <ArrowLeft size={16} className="shrink-0 transition-transform group-hover:-translate-x-1 stroke-[2.5]" />
        <span>{displayLabel}</span>
      </button>
    </div>
  );
}
