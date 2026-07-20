import { ArrowUpRight, BadgeCheck, Instagram, MessageCircle, ShieldCheck, Clock, CreditCard, Key } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695";
  const channel = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || `https://wa.me/${number}?text=${encodeURIComponent("Hi Rakexura, I would like to join the game deals channel.")}`;
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/";
  
  const cards = [
    { 
      title: "WhatsApp Support", 
      subtitle: "Official customer support", 
      text: "Order, payment, delivery, and activation assistance.", 
      href: `https://wa.me/${number}?text=${encodeURIComponent("Hi Rakexura, I need help with an order.")}`, 
      icon: MessageCircle, 
      color: "text-[#25d366]",
      hoverClass: "hover:border-[#25d366]/30 hover:shadow-[#25d366]/5"
    },
    { 
      title: "WhatsApp Channel", 
      subtitle: "Official deals channel", 
      text: "New games, offers, giveaways, and store announcements.", 
      href: channel, 
      icon: MessageCircle, 
      color: "text-[#25d366]",
      hoverClass: "hover:border-[#25d366]/30 hover:shadow-[#25d366]/5"
    },
    { 
      title: "Instagram", 
      subtitle: "Official social page", 
      text: "Game drops, visual updates, proof posts, and community news.", 
      href: instagram, 
      icon: Instagram, 
      color: "text-[#f05a8a]",
      hoverClass: "hover:border-[#f05a8a]/30 hover:shadow-[#f05a8a]/5"
    },
  ];

  return (
    <div className="page-shell py-12 md:py-16 relative overflow-hidden text-white">
      {/* Decorative ambient flares matching social network colors */}
      <div className="absolute top-40 left-0 -z-10 w-96 h-96 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-20 -z-10 w-96 h-96 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <p className="eyebrow">Support & social</p>
      
      <h1 className="mt-4 text-4xl font-black sm:text-6xl">
        Talk to <span className="bg-gradient-to-r from-[#8b5cf6] via-[#a78bfa] to-[#facc15] bg-clip-text text-transparent">Rakexura</span>
      </h1>
      
      <p className="section-copy max-w-2xl mt-3 text-neutral-400">
        For order help, include your order ID. Use only the official links shown here.
      </p>

      {/* Social Cards Grid */}
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {cards.map(({ title, subtitle, text, href, icon: Icon, color, hoverClass }) => (
          <a 
            key={title} 
            href={href} 
            target="_blank" 
            rel="noreferrer" 
            className={`group rounded-xl border border-white/[.07] bg-[#0c0f17]/90 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-[#0e121d] ${hoverClass}`}
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <Icon className={`${color} w-6 h-6`} />
              </div>
              <ArrowUpRight size={18} className="text-neutral-500 transition-colors group-hover:text-white" />
            </div>
            
            <h2 className="mt-6 flex items-center gap-1.5 text-lg font-extrabold text-white">
              {title}
              <BadgeCheck size={17} className="text-[#8b5cf6] shrink-0" />
            </h2>
            
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#9b86e8]">
              {subtitle}
            </p>
            
            <p className="mt-3.5 text-xs leading-relaxed text-[#8991a6]">
              {text}
            </p>
          </a>
        ))}
      </div>

      {/* Safety Warning Panel */}
      <div className="mt-6 flex gap-3.5 rounded-xl border border-orange-500/20 bg-orange-500/[0.02] p-5 text-xs leading-relaxed text-orange-200/80 max-w-4xl">
        <ShieldCheck size={20} className="shrink-0 text-orange-400 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5 font-bold uppercase tracking-wider text-[10px]">Security Advisory</strong>
          Rakexura will never request your account password, bank PIN, OTP, or remote access to your device. Keep your credentials safe.
        </div>
      </div>

      {/* New Support guidelines panel to cover plain space */}
      <div className="mt-12 pt-8 border-t border-white/5 max-w-4xl space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">
          Support Guidelines
        </h3>
        
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Clock size={15} className="text-[#8b5cf6]" />
              Response Times
            </div>
            <p className="text-[11px] text-[#8991a6] leading-relaxed">
              We typically respond within 5 to 15 minutes during active store hours (9:00 AM - 11:00 PM).
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <CreditCard size={15} className="text-[#8b5cf6]" />
              Payment Queries
            </div>
            <p className="text-[11px] text-[#8991a6] leading-relaxed">
              For payment queries, please keep your UPI, GPAY, or PhonePe transaction receipt screenshot ready.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Key size={15} className="text-[#8b5cf6]" />
              Key Activations
            </div>
            <p className="text-[11px] text-[#8991a6] leading-relaxed">
              Need help redeeming your keys? Ping our support on WhatsApp for a quick step-by-step setup guide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
