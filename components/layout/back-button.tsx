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

    // 1. If user has internal navigation history, naturally go back to their previous page/filter/scroll state
    const isInternalReferrer = 
      typeof document !== "undefined" && 
      document.referrer && 
      (document.referrer.includes(window.location.host) || document.referrer.startsWith("/"));

    if (typeof window !== "undefined" && window.history.length > 1 && (isInternalReferrer || !document.referrer)) {
      router.back();
      return;
    }

    // 2. Intelligent Hierarchy Fallback when landing directly on a sub-page without history
    if (pathname.startsWith("/admin/") && pathname !== "/admin") {
      router.push("/admin");
    } else if (pathname === "/admin") {
      router.push("/");
    } else if (pathname.startsWith("/dashboard/") && pathname !== "/dashboard") {
      router.push("/dashboard");
    } else if (pathname === "/dashboard" || pathname === "/profile") {
      router.push("/");
    } else if (pathname === "/checkout") {
      router.push("/cart");
    } else if (pathname.startsWith("/games/")) {
      router.push("/");
    } else if (pathname.startsWith("/bundles/")) {
      router.push("/bundles");
    } else if (pathname === "/cart") {
      router.push("/games");
    } else {
      router.push("/");
    }
  }

  const defaultLabel = pathname.startsWith("/admin/")
    ? "Back to Admin"
    : "Back";

  const displayLabel = label ?? defaultLabel;

  // Small & compact back button styling
  const btnClasses = "group inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#121212]/80 px-2.5 py-1 text-[11px] font-medium tracking-wide text-[#a0a8c0] backdrop-blur-md transition-all duration-150 hover:border-white/20 hover:bg-[#1a1a1a] hover:text-white active:scale-95 cursor-pointer select-none shadow-sm";

  const handleMouseEnter = () => {
    if (href) {
      router.prefetch(href);
      return;
    }
    if (pathname.startsWith("/admin/") && pathname !== "/admin") {
      router.prefetch("/admin");
    } else if (pathname === "/admin") {
      router.prefetch("/");
    } else if (pathname.startsWith("/dashboard/") && pathname !== "/dashboard") {
      router.prefetch("/dashboard");
    } else if (pathname === "/dashboard" || pathname === "/profile") {
      router.prefetch("/");
    } else if (pathname === "/checkout") {
      router.prefetch("/cart");
    } else if (pathname.startsWith("/games/")) {
      router.prefetch("/");
    } else if (pathname.startsWith("/bundles/")) {
      router.prefetch("/bundles");
    } else if (pathname === "/cart") {
      router.prefetch("/games");
    } else {
      router.prefetch("/");
    }
  };

  if (href) {
    return (
      <div className={`relative z-30 pointer-events-auto ${className}`}>
        <Link
          href={href}
          prefetch={true}
          onMouseEnter={handleMouseEnter}
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
        onMouseEnter={handleMouseEnter}
        onFocus={handleMouseEnter}
        className={btnClasses}
        aria-label={displayLabel}
      >
        <ChevronLeft size={13} className="shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5" />
        <span>{displayLabel}</span>
      </button>
    </div>
  );
}
