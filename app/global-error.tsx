"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#050505] text-white font-sans px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-[#12141a] text-[#facc15] shadow-lg">
            <AlertCircle size={30} strokeWidth={2.2} />
          </div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#81889a] mb-2">
            Storefront Critical Error
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Unable to Load Application
          </h2>
          <p className="mt-3 text-sm text-[#8991a6] leading-relaxed">
            The storefront encountered an unexpected runtime exception.
          </p>
          <div className="mt-7">
            <button
              onClick={() => {
                try {
                  reset();
                } catch {}
                window.location.reload();
              }}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[4px] bg-[#facc15] px-7 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-colors duration-200 hover:bg-[#ffe45c] cursor-pointer"
            >
              <RotateCcw size={14} strokeWidth={2.5} />
              <span>Reload Storefront</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
