"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        {/* Amber Glow Warning Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <AlertTriangle size={36} />
        </div>

        <p className="eyebrow text-amber-400 font-bold uppercase tracking-widest text-xs">
          System Signal Interrupted
        </p>
        <h1 className="mt-2 text-2xl font-black text-white tracking-tight">
          Temporary Glitch Detected
        </h1>
        <p className="mt-3 text-xs leading-relaxed text-[#8991a6]">
          We encountered an issue loading this section. Your account, cart, and orders remain completely safe.
        </p>

        {/* Retry & Home CTAs */}
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#facc15] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-[#ffe45c] hover:shadow-[0_0_25px_rgba(250,204,21,0.35)] active:scale-95 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white/[0.08] active:scale-95"
          >
            <Home size={14} />
            <span>Return to Store</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
