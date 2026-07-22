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
            className="rounded bg-[#facc15] px-4 py-2 text-sm font-bold text-black hover:bg-[#ffe45c] transition-colors duration-200"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
