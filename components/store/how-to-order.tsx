import Link from "next/link";
import { CheckCircle2, MessageCircle, Search, ShoppingBag, Upload } from "lucide-react";

const steps = [
  ["1", "Choose your game", "Check available platforms and add the right edition to cart.", Search],
  ["2", "Review your cart", "Confirm platforms, bundles, coupon savings, and the final total.", ShoppingBag],
  ["3", "Pay and upload proof", "Pay the exact UPI total and upload the successful payment screenshot.", Upload],
  ["4", "Track delivery", "Copy your order reference and follow every delivery update.", CheckCircle2],
] as const;

export function HowToOrder() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695";
  return (
    <section className="section-space">
      <div className="section-head">
        <div>
          <p className="eyebrow">Simple assisted delivery</p>
          <h2 className="section-title mt-2">How to order</h2>
          <p className="section-copy">Four clear steps from discovery to your game library.</p>
        </div>
        <Link
          href="/track-order"
          className="btn btn-secondary shrink-0 whitespace-nowrap text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg border border-white/15 bg-white/[0.06] text-white hover:border-[#facc15]/50 hover:bg-[#facc15]/10 hover:text-[#facc15] transition-all flex items-center gap-1.5 active:scale-95"
        >
          <span>Track your order</span>
        </Link>
      </div>
      <div className="grid gap-2.5 sm:gap-3 grid-cols-2 lg:grid-cols-4">
        {steps.map(([numberLabel, title, text, Icon]) => (
          <article key={numberLabel} className="premium-panel rounded-xl p-3 sm:p-5 border border-white/[.08] bg-[#0c0f18] hover:border-[#facc15]/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-black text-[#facc15]">STEP {numberLabel}</span>
              <Icon size={16} className="text-[#facc15]" />
            </div>
            <h3 className="mt-3 sm:mt-6 font-black text-xs sm:text-base text-white leading-tight">{title}</h3>
            <p className="mt-1 sm:mt-2 text-[11px] sm:text-sm leading-snug sm:leading-relaxed text-[#8991a6]">{text}</p>
          </article>
        ))}
      </div>
      <div className="mt-3.5 sm:mt-5 grid grid-cols-2 gap-2 sm:gap-2.5 sm:flex sm:flex-wrap sm:items-center">
        <Link href="/games" className="btn btn-primary text-center justify-center min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm font-bold">
          Browse games
        </Link>
        <Link href="/dashboard/library" className="btn btn-secondary text-center justify-center min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm font-bold">
          My games
        </Link>
        <a
          href={`https://wa.me/${number}?text=${encodeURIComponent("Hi Rakexura, I need help placing an order.")}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary col-span-2 text-center justify-center min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm font-bold hover:border-emerald-500/40 hover:text-emerald-400"
        >
          <MessageCircle size={16} className="text-emerald-400" /> Need help?
        </a>
      </div>
    </section>
  );
}
