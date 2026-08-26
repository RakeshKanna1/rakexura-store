import Link from "next/link";
import { BadgeCheck, CircleHelp, Headphones, ShieldCheck } from "lucide-react";

export function DeliveryGuarantee() {
  return (
    <section className="section-space">
      <div className="premium-panel grid gap-4 sm:gap-6 rounded-xl p-4 sm:p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div>
          <p className="eyebrow">Rakexura delivery guarantee</p>
          <h2 className="section-title mt-1.5 sm:mt-3">Every order stays visible from payment to delivery.</h2>
          <div className="mt-3.5 sm:mt-5 flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-3 text-xs sm:text-sm text-[#aeb5c8]">
            <span className="flex items-center gap-1.5 sm:gap-2"><ShieldCheck size={15} className="text-[#00d68f] shrink-0" /> Private payment review</span>
            <span className="flex items-center gap-1.5 sm:gap-2"><BadgeCheck size={15} className="text-[#facc15] shrink-0" /> Verified seller support</span>
            <span className="flex items-center gap-1.5 sm:gap-2"><Headphones size={15} className="text-[#ffb800] shrink-0" /> Human delivery assistance</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Link href="/faq" className="btn btn-secondary flex-1 sm:flex-none justify-center min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm font-bold"><CircleHelp size={15} /> Read FAQ</Link>
          <Link href="/support" className="btn btn-primary flex-1 sm:flex-none justify-center min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm font-bold">Contact support</Link>
        </div>
      </div>
    </section>
  );
}
