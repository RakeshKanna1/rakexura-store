"use client";

import { useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Segment Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.2)] mb-4">
        <AlertTriangle size={26} />
      </div>
      <h2 className="text-2xl font-black text-white tracking-tight">Something went wrong!</h2>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[#8991a6]">
        An unexpected error occurred while loading this section. Tap below to reload the page.
      </p>
      <button
        onClick={() => {
          try {
            reset();
          } catch {}
          window.location.reload();
        }}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] via-[#a78bfa] to-[#facc15] px-6 py-3 text-xs font-black uppercase tracking-wider text-black shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_25px_rgba(250,204,21,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
      >
        <RefreshCw size={14} className="text-black" />
        <span>Try again & Reload</span>
      </button>
    </div>
  );
}
