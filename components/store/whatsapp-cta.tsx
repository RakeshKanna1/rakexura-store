import { ArrowUpRight, MessageCircle, ShieldCheck } from "lucide-react";

export function WhatsAppCta() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695";
  const message = encodeURIComponent("Hi Rakexura, I need help choosing a game.");
  return <section className="section-space"><div className="relative overflow-hidden rounded-lg border border-[#facc15]/15 bg-[linear-gradient(115deg,#11131a,#0c0d10)] p-7 md:p-10"><div className="relative flex flex-col items-start justify-between gap-7 md:flex-row md:items-center"><div className="max-w-2xl"><span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#facc15]"><ShieldCheck size={16} /> Direct human support</span><h2 className="section-title mt-3">Not sure which edition or platform to choose?</h2><p className="section-copy">Ask before paying. We will help you confirm availability, platform, and delivery steps.</p></div><a href={`https://wa.me/${number}?text=${message}`} target="_blank" rel="noreferrer" className="magnetic-button btn shrink-0 bg-[#facc15] text-black hover:-translate-y-0.5"><MessageCircle size={18} /> Chat on WhatsApp <ArrowUpRight size={16} /></a></div></div></section>;
}
