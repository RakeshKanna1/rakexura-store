"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";

export function ComboDealsBanner({ children }: { children?: React.ReactNode }) {
  const [closed, setClosed] = useState(false);

  return (
    <div className={`transition-all duration-300 ${closed ? "mt-5 sm:mt-6 md:mt-7" : "mt-2.5 sm:mt-3 md:mt-3.5"}`}>
      {!closed && (
        <aside
          aria-label="Combo deals"
          className="relative z-20 w-full border-y border-[#facc15]/15 bg-[#0e0c06]/95 py-1.5 sm:py-2 px-4 select-none overflow-hidden shadow-[inset_0_1px_12px_rgba(250,204,21,0.06)]"
        >
          {/* Subtle warm ambient gold wash */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.08)_0%,transparent_75%)]"
            aria-hidden="true"
          />

          <div className="shell relative z-10 flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-3 text-xs sm:text-[13px] min-w-0">
              <Link
                href="/bundles"
                className="group inline-flex items-center gap-1.5 sm:gap-3 text-zinc-300 hover:text-white transition-colors min-w-0 cursor-pointer"
              >
                {/* Mobile version: crisp, single-line, zero ellipsis */}
                <div className="flex sm:hidden items-center gap-1.5 text-[11px] font-bold text-zinc-200">
                  <span className="inline-flex items-center gap-1 font-black text-[#facc15] uppercase tracking-wide">
                    <Sparkles size={11} className="text-[#facc15]" />
                    <span>COMBO DEALS</span>
                  </span>
                  <span className="text-white/25 text-[9px]">•</span>
                  <span>Bundle & Save</span>
                  <span className="inline-flex items-center gap-0.5 text-[#facc15] font-black ml-0.5">
                    <span>View →</span>
                  </span>
                </div>

                {/* Tablet / Desktop version: full rich copy */}
                <div className="hidden sm:inline-flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 font-black text-[#facc15] text-xs uppercase tracking-wider shrink-0 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">
                    <Sparkles size={12} className="text-[#facc15]" />
                    <span>COMBO DEALS</span>
                  </span>

                  <span className="text-white/25 text-[10px] select-none shrink-0">•</span>

                  <span className="text-zinc-200 text-[13px] font-medium">
                    Get 2+ games bundled together with instant package discount
                  </span>

                  <span className="inline-flex items-center gap-1 font-bold text-[#facc15] group-hover:text-[#fef08a] group-hover:underline text-[13px] shrink-0 ml-1">
                    <span>View Bundles</span>
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            </div>

            <button
              type="button"
              suppressHydrationWarning={true}
              onClick={() => setClosed(true)}
              className="shrink-0 flex items-center justify-center h-5.5 w-5.5 sm:h-6 sm:w-6 rounded-full border border-white/15 bg-white/[0.06] text-zinc-300 hover:text-[#facc15] hover:border-[#facc15]/50 hover:bg-[#facc15]/10 hover:shadow-[0_0_8px_rgba(250,204,21,0.25)] transition-all cursor-pointer active:scale-95"
              aria-label="Close combo deals banner"
              title="Dismiss banner"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>
        </aside>
      )}
      {children}
    </div>
  );
}