import { ArrowUpRight, BadgeCheck, Instagram, MessageCircle, ShieldCheck } from "lucide-react";

export default function SupportPage() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695";
  const channel = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || `https://wa.me/${number}?text=${encodeURIComponent("Hi Rakexura, I would like to join the game deals channel.")}`;
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/";
  const cards = [
    { title: "WhatsApp Support", subtitle: "Official customer support", text: "Order, payment, delivery, and activation assistance.", href: `https://wa.me/${number}?text=${encodeURIComponent("Hi Rakexura, I need help with an order.")}`, icon: MessageCircle, color: "text-[#25d366]" },
    { title: "WhatsApp Channel", subtitle: "Official deals channel", text: "New games, offers, giveaways, and store announcements.", href: channel, icon: MessageCircle, color: "text-[#25d366]" },
    { title: "Instagram", subtitle: "Official social page", text: "Game drops, visual updates, proof posts, and community news.", href: instagram, icon: Instagram, color: "text-[#f05a8a]" },
  ];
  return <div className="page-shell py-10"><p className="eyebrow">Support & social</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">Talk to Rakexura</h1><p className="section-copy max-w-2xl">For order help, include your order ID. Use only the official links shown here.</p><div className="mt-9 grid gap-4 md:grid-cols-3">{cards.map(({ title, subtitle, text, href, icon: Icon, color }) => <a key={title} href={href} target="_blank" rel="noreferrer" className="group rounded-lg border border-white/[.08] bg-[#0b0f19] p-6 transition hover:-translate-y-1 hover:border-white/20"><div className="flex items-start justify-between"><Icon className={color} /><ArrowUpRight size={17} className="text-[#697084] transition group-hover:text-white" /></div><h2 className="mt-7 flex items-center gap-2 font-black">{title}<BadgeCheck size={16} className="text-[#8b5cf6]" /></h2><p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#9b86e8]">{subtitle}</p><p className="mt-3 text-sm leading-6 text-[#8991a6]">{text}</p></a>)}</div><div className="mt-5 flex gap-3 rounded-md border border-white/[.08] bg-white/[.025] p-5 text-sm text-[#a0a8c0]"><ShieldCheck size={19} className="shrink-0 text-[#00d68f]" /> Rakexura will never request your account password, bank PIN, OTP, or remote access to your device.</div></div>;
}
