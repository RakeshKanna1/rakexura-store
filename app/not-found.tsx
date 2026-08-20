import Link from "next/link";
import { Gamepad2, Home, Search, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        {/* Minimal Epic-style 404 Icon */}
        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-[#12141a] text-[#facc15] shadow-lg">
          <Gamepad2 size={32} />
          <span className="absolute -bottom-2 -right-2 rounded-[4px] border border-black bg-[#facc15] px-1.5 py-0.5 text-[9px] font-black uppercase text-black">
            404
          </span>
        </div>

        <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-[#81889a] mb-2">
          Page Not Found
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Looking for a Game?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#9da5b8] max-w-md mx-auto">
          The title, bundle, or page you were looking for doesn&apos;t exist or has moved. Explore the latest store deals below.
        </p>

        {/* Epic-style Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/games"
            className="w-full sm:w-auto inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[4px] bg-[#facc15] px-7 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-[#ffe45c] active:scale-95 cursor-pointer shadow-sm"
          >
            <Search size={14} strokeWidth={2.5} />
            <span>Browse All Games</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[4px] border border-white/20 bg-transparent px-7 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white/[0.08] hover:border-white/40 active:scale-95"
          >
            <Home size={14} strokeWidth={2.5} />
            <span>Return to Store</span>
          </Link>
        </div>

        {/* Quick Links Footer */}
        <div className="mt-10 pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-6 text-xs text-[#8991a6]">
          <Link href="/track-order" className="hover:text-[#facc15] transition-colors inline-flex items-center gap-1">
            Track Order <ArrowRight size={12} />
          </Link>
          <Link href="/faq" className="hover:text-[#facc15] transition-colors inline-flex items-center gap-1">
            Help & FAQ <ArrowRight size={12} />
          </Link>
          <Link href="/support" className="hover:text-[#facc15] transition-colors inline-flex items-center gap-1">
            Contact Support <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </main>
  );
}
