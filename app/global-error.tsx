"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

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
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#05070f] text-white font-sans">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-black tracking-tight">Something went wrong!</h2>
          <p className="text-sm text-[#8991a6]">The application encountered a critical rendering error.</p>
          <button
            onClick={() => {
              try {
                reset();
              } catch {}
              window.location.reload();
            }}
            className="rounded-xl bg-gradient-to-r from-[#8b5cf6] via-[#a78bfa] to-[#facc15] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_25px_rgba(250,204,21,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
