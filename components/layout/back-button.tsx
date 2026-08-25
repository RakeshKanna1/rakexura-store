"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface BackButtonProps {
  label?: string;
  href?: string;
  className?: string;
}

export function BackButton({ label, href, className = "" }: BackButtonProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Do not show Back button on homepage or OTP preview
  if (!pathname || pathname === "/" || pathname === "/otp-preview") return null;

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

  if (href) {
    return (
      <div className={`relative z-30 pointer-events-auto mb-2 sm:mb-3 ${className}`}>
        <Link
          href={href}
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm font-medium text-[#cbd5e1] transition-all hover:bg-white/[0.08] hover:border-white/20 hover:text-white active:scale-95 cursor-pointer shadow-sm backdrop-blur-md"
          aria-label={displayLabel}
        >
          <ArrowLeft size={15} className="shrink-0" />
          <span>{displayLabel}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={`relative z-30 pointer-events-auto mb-2 sm:mb-3 ${className}`}>
      <button
        suppressHydrationWarning
        type="button"
        onClick={goBack}
        className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm font-medium text-[#cbd5e1] transition-all hover:bg-white/[0.08] hover:border-white/20 hover:text-white active:scale-95 cursor-pointer shadow-sm backdrop-blur-md"
        aria-label={displayLabel}
      >
        <ArrowLeft size={15} className="shrink-0" />
        <span>{displayLabel}</span>
      </button>
    </div>
  );
}
