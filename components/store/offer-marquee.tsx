import type { LucideIcon } from "lucide-react";
import { Flame, Gamepad2, MessageCircle, ShoppingCart, Sparkles, Zap } from "lucide-react";
import { getMarqueeMessages } from "@/lib/supabase/queries";

const iconMap: Record<string, LucideIcon> = {
  cart: ShoppingCart,
  flame: Flame,
  gamepad: Gamepad2,
  message: MessageCircle,
  spark: Sparkles,
  zap: Zap,
};

export async function OfferMarquee() {
  const messages = await getMarqueeMessages();

  if (!messages || messages.length === 0) return null;

  return (
    <aside 
      className="offer-marquee relative w-full overflow-hidden border-y border-[#facc15]/20 bg-[#08090f] py-2 select-none shadow-[0_2px_16px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(250,204,21,0.12)]" 
      aria-label="Current store offers"
    >
      {/* Subtle, soft gold ambient center wash */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.04)_0%,transparent_70%)]" />

      {/* Clean edge gradient fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#08090f] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#08090f] to-transparent" />

      <div className="offer-marquee-track relative z-1 flex items-center whitespace-nowrap">
        {[0, 1].map((copyIndex) => (
          <div key={copyIndex} className="flex shrink-0 items-center">
            {messages.map((item, index) => {
              const Icon = iconMap[item.icon_key] ?? Sparkles;
              const isLive = item.icon_key === "message" || item.icon_key === "live";
              return (
                <span key={`${copyIndex}-${item.id ?? index}-${index}`} className="flex shrink-0 items-center gap-2.5 px-6 text-xs select-none">
                  {isLive && (
                    <span className="inline-flex items-center gap-1.5 rounded bg-[#facc15]/10 border border-[#facc15]/35 px-2 py-0.5 text-[9px] font-black text-[#facc15] tracking-widest">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#facc15] animate-pulse" />
                      LIVE
                    </span>
                  )}
                  <Icon size={13} className="text-[#facc15] shrink-0 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]" />
                  <span className="text-[#facc15] font-black text-[11px] tracking-wider uppercase drop-shadow-[0_1px_4px_rgba(250,204,21,0.2)]">
                    {item.message}
                  </span>
                  <span className="ml-5 text-[#facc15]/60 font-black text-sm select-none">•</span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
