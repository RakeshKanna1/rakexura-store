import Link from "next/link";
import { Gamepad2, Home, Search, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        {/* Glow ambient circle */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-[#facc15]/30 bg-[#facc15]/10 text-[#facc15] shadow-[0_0_35px_rgba(250,204,21,0.25)]">
          <Gamepad2 size={44} className="animate-pulse" />
          <span className="absolute -bottom-2 -right-2 rounded-full border border-black bg-[#facc15] px-2 py-0.5 text-[10px] font-black uppercase text-black">
            404
          </span>
        </div>

        <p className="eyebrow text-[#facc15] tracking-widest uppercase font-bold text-xs">
          Level Not Found
        </p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl text-white tracking-tight">
          Lost in the Matrix?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#8991a6]">
          The game title, bundle, or page you were looking for doesn&apos;t exist or has moved to another sector.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/games"
            className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#facc15] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-[#ffe45c] hover:shadow-[0_0_25px_rgba(250,204,21,0.4)] active:scale-95"
          >
            <Search size={15} />
            <span>Browse All Games</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white/[0.08] hover:border-white/30 active:scale-95"
          >
            <Home size={15} />
            <span>Return Home</span>
          </Link>
        </div>

        {/* Quick Links Footer */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-wrap items-center justify-center gap-6 text-xs text-[#71788e]">
          <Link href="/track-order" className="hover:text-[#facc15] transition-colors inline-flex items-center gap-1">
            Track Your Order <ArrowRight size={12} />
          </Link>
          <Link href="/faq" className="hover:text-[#facc15] transition-colors inline-flex items-center gap-1">
            Help & FAQ <ArrowRight size={12} />
          </Link>
          <Link href="/contact" className="hover:text-[#facc15] transition-colors inline-flex items-center gap-1">
            Contact Support <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </main>
  );
}
