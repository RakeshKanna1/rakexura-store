"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers } from "lucide-react";

export function ComboDealsBanner() {
  const pathname = usePathname();

  // Hide on auth, checkout, and admin routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <div className="border-b border-white/[0.06] bg-[#07090e] py-1.5 sm:py-2 text-center select-none overflow-hidden">
      <div className="flex items-center justify-center gap-2 px-3 text-[12px] sm:text-[13px] whitespace-nowrap">
        <span className="font-black text-[#facc15] text-[11.5px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <Layers size={13} className="text-[#facc15] shrink-0" /> COMBO DEALS
        </span>
        <span className="text-white/30 text-[10px] select-none shrink-0">•</span>
        <span className="text-zinc-200 font-medium text-[11.5px] sm:text-[13px]">
          <span className="sm:hidden">Save on collections</span>
          <span className="hidden sm:inline">Save big on curated game collections!</span>
        </span>
        <Link 
          href="/bundles" 
          className="font-bold text-[#facc15] hover:underline transition-all ml-1 inline-flex items-center gap-0.5 shrink-0 text-[11.5px] sm:text-[13px]"
        >
          <span className="sm:hidden">View &rarr;</span>
          <span className="hidden sm:inline">View Bundles &rarr;</span>
        </Link>
      </div>
    </div>
  );
}