"use client";

import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface BackButtonProps {
  label?: string;
  href?: string;
  className?: string;
}

function getNavigationInfo(pathname: string) {
  // 1. Admin Hierarchy
  if (pathname.startsWith("/admin/") && pathname !== "/admin") {
    return { target: "/admin", defaultLabel: "Back to Admin", preferHistory: false };
  }
  if (pathname === "/admin") {
    return { target: "/", defaultLabel: "Back to Store", preferHistory: false };
  }

  // 2. Customer Dashboard Hierarchy
  if (pathname.startsWith("/dashboard/") && pathname !== "/dashboard") {
    return { target: "/dashboard", defaultLabel: "Back to Dashboard", preferHistory: false };
  }
  if (pathname === "/dashboard" || pathname === "/profile") {
    return { target: "/", defaultLabel: "Back to Store", preferHistory: false };
  }

  // 3. Checkout & Cart Flow
  if (pathname === "/checkout") {
    return { target: "/cart", defaultLabel: "Back to Cart", preferHistory: false };
  }
  if (pathname === "/cart") {
    return { target: "/games", defaultLabel: "Continue Shopping", preferHistory: false };
  }

  // 4. Catalog Pages
  if (pathname.startsWith("/games/")) {
    return { target: "/games", defaultLabel: "Back to Games", preferHistory: true };
  }
  if (pathname.startsWith("/bundles/")) {
    return { target: "/bundles", defaultLabel: "Back to Bundles", preferHistory: true };
  }

  // 5. Default Public Standalone Pages
  return { target: "/", defaultLabel: "Back to Store", preferHistory: false };
}

export function BackButton({ label, href, className = "" }: BackButtonProps) {
  const pathname = usePathname() || "";
  const router = useRouter();

  // If on homepage or preview and no explicit href, don't show
  if (!href && (pathname === "/" || pathname === "/otp-preview")) return null;

  const navInfo = getNavigationInfo(pathname);
  const targetHref = href ?? navInfo.target;
  const displayLabel = label ?? navInfo.defaultLabel;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If an explicit href is set, let Link handle it naturally
    if (href) return;

    // If preferHistory is true (e.g. from a game detail back to a filtered game list),
    // and the user has previous in-app history, use router.back() to preserve search/filters
    if (navInfo.preferHistory && typeof window !== "undefined" && window.history.length > 1) {
      const isInternal =
        typeof document !== "undefined" &&
        document.referrer &&
        (document.referrer.includes(window.location.host) || document.referrer.startsWith("/"));

      if (isInternal) {
        e.preventDefault();
        router.back();
      }
    }
  };

  const btnClasses =
    "group inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#121212]/85 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#a0a8c0] backdrop-blur-md transition-all duration-150 hover:border-white/25 hover:bg-[#1a1a1a] hover:text-white active:scale-95 cursor-pointer select-none shadow-sm";

  return (
    <div className={`relative z-30 pointer-events-auto ${className}`}>
      <Link
        href={targetHref}
        prefetch={true}
        onClick={handleClick}
        className={btnClasses}
        aria-label={displayLabel}
      >
        <ChevronLeft
          size={14}
          className="shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5 text-[#8b5cf6]"
        />
        <span>{displayLabel}</span>
      </Link>
    </div>
  );
}
