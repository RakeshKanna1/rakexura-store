import { ArrowUpRight, BadgeCheck, MessageCircle } from "lucide-react";

export function WhatsAppCommunity() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695";
  const message = encodeURIComponent("Hi Rakexura, I would like to join the community for game deals and updates.");
  const channel = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || `https://wa.me/${number}?text=${message}`;
  return <section className="section-space pb-1"><div className="flex flex-col justify-between gap-5 rounded-md border border-white/[.08] backdrop-blur-md p-5 text-white shadow-[0_20px_70px_rgba(0,0,0,.24)] sm:flex-row sm:items-center md:px-7" style={{ background: "linear-gradient(135deg, rgba(30, 20, 40, 0.35) 0%, rgba(25, 25, 15, 0.35) 100%)" }}><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-[#25d366]/10 text-[#58e98d]"><MessageCircle size={22} /></span><div><h2 className="flex items-center gap-2 text-lg font-black">Join our WhatsApp Channel <BadgeCheck size={16} className="text-[#8b5cf6]" /></h2><p className="mt-1 text-sm font-medium text-[#9da5b8]">Get new deals, game drops, giveaways, and exclusive offers directly on WhatsApp.</p></div></div><a href={channel} target="_blank" rel="noreferrer" className="btn shrink-0 bg-[#25d366] text-[#07130b] hover:bg-[#55e88a]">Open Official Channel <ArrowUpRight size={16} /></a></div></section>;
}
