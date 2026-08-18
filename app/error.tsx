"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
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
      <div className="w-full max-w-lg text-center">
        {/* Sleek Minimal Epic-style Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-[#12141a] text-[#facc15] shadow-lg">
          <AlertCircle size={30} strokeWidth={2.2} />
        </div>

        {/* Clean Professional Hierarchy */}
        <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#81889a] mb-2">
          Storefront Notice
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Unable to Load Content
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[#9da5b8] max-w-md mx-auto">
          An unexpected issue occurred while communicating with the store servers. Your account, library, and cart items remain unaffected.
        </p>

        {/* Diagnostic Digest if present */}
        {error?.digest && (
          <div className="mt-4">
            <span className="inline-block rounded bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 font-mono text-[11px] text-zinc-400">
              Error ID: {error.digest}
            </span>
          </div>
        )}

        {/* Epic-style Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[4px] bg-[#facc15] px-7 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-[#ffe45c] active:scale-95 cursor-pointer shadow-sm"
          >
            <RotateCcw size={14} strokeWidth={2.5} />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[4px] border border-white/20 bg-transparent px-7 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white/[0.08] hover:border-white/40 active:scale-95"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            <span>Back to Store</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
