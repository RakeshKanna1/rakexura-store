"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        Sentry.captureException(error);
      }
    } catch {}
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#05070f] text-white font-sans px-4 select-none">
        {/* Subtle radial ambient background glow */}
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(250,204,21,0.06),transparent_60%)] pointer-events-none" />

        {/* Elevated frosted glass error card */}
        <div className="relative z-10 w-full max-w-md text-center rounded-2xl border border-white/[0.08] bg-[#0c0f18]/90 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Glowing Amber Badge */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#facc15]/25 bg-[#facc15]/10 text-[#facc15] shadow-[0_0_24px_rgba(250,204,21,0.15)]">
            <AlertTriangle size={26} strokeWidth={2.2} />
          </div>

          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-[#81889a] mb-2">
            System Notice
          </span>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Temporary Disruption
          </h2>

          <p className="mt-2.5 text-xs sm:text-sm text-[#8991a6] leading-relaxed">
            The storefront experienced a temporary connection glitch. Your account, wishlist, and cart remain safely saved.
          </p>

          {error?.digest && (
            <div className="mt-3.5">
              <span className="inline-block rounded-md bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 font-mono text-[10px] text-zinc-400">
                Ref: {error.digest}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                try {
                  reset();
                } catch {}
                window.location.reload();
              }}
              className="w-full sm:w-auto inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-[#facc15] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-[#facc15]/20 transition-all hover:bg-[#fde047] hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <RefreshCw size={13} strokeWidth={2.5} />
              <span>Reload Store</span>
            </button>

            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="w-full sm:w-auto inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white/[0.1] hover:border-white/40 active:scale-95 cursor-pointer"
            >
              <Home size={13} strokeWidth={2.5} />
              <span>Home Page</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
