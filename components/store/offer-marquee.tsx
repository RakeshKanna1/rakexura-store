import type { LucideIcon } from "lucide-react";
import { Flame, Gamepad2, MessageCircle, ShoppingCart, Sparkles, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ScrollVelocity } from "@/components/animations/scroll-velocity";

const iconMap: Record<string, LucideIcon> = {
  cart: ShoppingCart,
  flame: Flame,
  gamepad: Gamepad2,
  message: MessageCircle,
  spark: Sparkles,
  zap: Zap,
};

const badgeMap: Record<string, string> = {
  flame: "DEAL",
  gamepad: "NEW",
  zap: "FAST",
  cart: "SAVE",
  message: "LIVE",
  spark: "HOT",
};

const fallback = [
  { icon_key: "flame", message: "GTA V from Rs. 130" },
  { icon_key: "gamepad", message: "New games added weekly" },
  { icon_key: "zap", message: "Fast assisted delivery" },
  { icon_key: "cart", message: "Buy 3+ games and save 10% with RAKE10" },
];

export async function OfferMarquee() {
  const supabase = await createClient();
  const { data } = await supabase.from("marquee_messages").select("id,message,icon_key").eq("active", true).order("sort_order");
  const messages = data?.length ? data : fallback;

  // Render a single joined row of items inside the parallax scroll track
  const marqueeContent = (
    <div className="flex items-center">
      {messages.map((item, index) => {
        const Icon = iconMap[item.icon_key] ?? Sparkles;
        const badgeText = badgeMap[item.icon_key] || "INFO";
        return (
          <span key={`${"id" in item ? item.id : item.message}-${index}`} className="flex shrink-0 items-center gap-3 px-8 text-xs font-black uppercase tracking-wide select-none">
            <span className="rounded bg-gradient-to-r from-[#b89412]/20 to-[#e5c158]/20 border border-[#e5c158]/60 px-2.5 py-0.5 text-[9px] text-[#facc15] font-black tracking-widest shadow-[0_0_8px_rgba(250,204,21,0.2)]">
              {badgeText}
            </span>
            <Icon size={13} className="text-[#facc15] filter drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
            <span className="text-[#f3f4f6] font-bold tracking-wider text-[11px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              {item.message}
            </span>
            <span className="ml-5 text-[#facc15] drop-shadow-[0_0_6px_rgba(250,204,21,0.5)] font-black text-sm">•</span>
          </span>
        );
      })}
    </div>
  );

  return (
    <aside className="offer-marquee overflow-hidden border-y border-[#facc15]/20 bg-[#060813] py-2.5 shadow-[0_4px_30px_rgba(250,204,21,0.06),inset_0_1px_0_rgba(250,204,21,0.15),inset_0_-1px_0_rgba(250,204,21,0.15)] backdrop-blur-md relative" aria-label="Current store offers">
      {/* Subtle overlay for gold reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#facc15]/5 to-transparent pointer-events-none" />
      
      <ScrollVelocity 
        texts={[marqueeContent]} 
        velocity={28} 
        numCopies={4} 
        stiffness={300}
        damping={40}
        scrollerClassName="flex items-center" 
      />
    </aside>
  );
}

