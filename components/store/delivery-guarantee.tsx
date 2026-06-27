import Link from "next/link";
import { BadgeCheck, CircleHelp, Headphones, ShieldCheck } from "lucide-react";

export function DeliveryGuarantee() {
  return <section className="section-space"><div className="premium-panel grid gap-6 rounded-md p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8"><div><p className="eyebrow">Rakexura delivery guarantee</p><h2 className="section-title mt-3">Every order stays visible from payment to delivery.</h2><div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#aeb5c8]"><span className="flex items-center gap-2"><ShieldCheck size={17} className="text-[#00d68f]" /> Private payment review</span><span className="flex items-center gap-2"><BadgeCheck size={17} className="text-[#facc15]" /> Verified seller support</span><span className="flex items-center gap-2"><Headphones size={17} className="text-[#ffb800]" /> Human delivery assistance</span></div></div><div className="flex flex-wrap gap-2"><Link href="/faq" className="btn btn-secondary"><CircleHelp size={17} /> Read FAQ</Link><Link href="/support" className="btn btn-primary">Contact support</Link></div></div></section>;
}
