import type { LucideIcon } from "lucide-react";
import { Flame, Gamepad2, MessageCircle, ShoppingCart, Sparkles, Zap, Package } from "lucide-react";
import { getMarqueeMessages } from "@/lib/supabase/queries";
import Link from "next/link";
import React from "react";

const iconMap: Record<string, LucideIcon> = {
  cart: ShoppingCart,
  flame: Flame,
  gamepad: Gamepad2,
  message: MessageCircle,
  spark: Sparkles,
  zap: Zap,
  bundle: Package,
};

// Curated 10/10 gaming announcements
const defaultAnnouncements = [
  { id: 1, icon_key: "spark", message: "COMBO DEALS: GET 2+ GAMES BUNDLED & SAVE" },
  { id: 2, icon_key: "flame", message: "PRE-ORDER NOW" },
  { id: 3, icon_key: "cart", message: "BUY 3+ GAMES & SAVE 10% WITH RAKE10" },
  { id: 4, icon_key: "message", message: "JOIN THE RAKEXURA WHATSAPP COMMUNITY" },
  { id: 5, icon_key: "gamepad", message: "ONIMUSHA AVAILABLE FOR PRE-ORDER" },
];

/**
 * Highlights key commercial tokens (RAKE10, 10%, PRE-ORDER, COMBO DEALS, LIVE) in Rakexura gold,
 * keeping the rest of the text in clean, crisp, highly legible off-white.
 */
function renderHighlightedMessage(message: string) {
  // Regex to split by key highlight words
  const parts = message.split(/(RAKE10|10%|PRE-ORDER|ONIMUSHA|COMBO DEALS|FLASH SALE|INSTANT DELIVERY|DISCOUNT)/gi);

  return parts.map((part, index) => {
    const upper = part.toUpperCase();
    if (upper === "RAKE10") {
      return (
        <span
          key={index}
          className="mx-0.5 inline-block rounded bg-[#facc15]/10 px-1.5 py-0.5 font-bold tracking-widest text-[#facc15] border border-[#facc15]/25"
        >
          RAKE10
        </span>
      );
    }
    if (upper === "COMBO DEALS" || upper === "10%" || upper === "FLASH SALE" || upper === "INSTANT DELIVERY" || upper === "DISCOUNT") {
      return (
        <span key={index} className="font-bold text-[#facc15]">
          {part}
        </span>
      );
    }
    if (upper === "PRE-ORDER") {
      return (
        <span key={index} className="font-bold text-[#facc15] tracking-wider">
          PRE-ORDER
        </span>
      );
    }
    if (upper === "ONIMUSHA") {
      return (
        <span key={index} className="font-bold text-white tracking-wider">
          ONIMUSHA
        </span>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export async function OfferMarquee() {
  const fetchedMessages = await getMarqueeMessages();
  const items = fetchedMessages && fetchedMessages.length > 0 ? fetchedMessages : defaultAnnouncements;

  if (!items || items.length === 0) return null;

  return (
    <aside
      className="offer-marquee relative flex h-9.5 sm:h-10 md:h-10.5 w-full items-center overflow-hidden border-b border-white/[0.08] bg-[#050505]/95 backdrop-blur-md select-none"
      aria-label="Store announcements and offers"
    >
      {/* Precision Left and Right Fade Masks */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-28 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-28 bg-gradient-to-l from-[#050505] via-[#050505]/90 to-transparent"
        aria-hidden="true"
      />

      {/* Infinitely Looping Track */}
      <div className="offer-marquee-track relative z-1 flex items-center whitespace-nowrap">
        {[0, 1].map((copyIndex) => (
          <div key={copyIndex} className="flex shrink-0 items-center">
            {items.map((item, index) => {
              const Icon = iconMap[item.icon_key] ?? Sparkles;
              const isWhatsApp = item.icon_key === "message" || item.message.toUpperCase().includes("WHATSAPP");
              const isBundle = item.icon_key === "bundle" || item.message.toUpperCase().includes("COMBO") || item.message.toUpperCase().includes("BUNDLE");

              const content = (
                <span className="inline-flex items-center gap-2 sm:gap-2.5 text-[12px] sm:text-[12.5px] font-bold uppercase tracking-[0.05em] text-zinc-300 transition-colors duration-150">
                  {/* Refined LIVE Badge with gently pulsing gold dot */}
                  {isWhatsApp && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#facc15]/15 border border-[#facc15]/40 px-2 py-0.5 text-[9px] font-black text-[#facc15] tracking-widest shadow-[0_0_8px_rgba(250,204,21,0.2)] shrink-0">
                      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#facc15] opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#facc15]" />
                      </span>
                      LIVE
                    </span>
                  )}

                  {/* Static, sharp Icon with subtle gold luster */}
                  <Icon size={14} className="text-[#facc15] filter drop-shadow-[0_0_6px_rgba(250,204,21,0.4)] shrink-0" aria-hidden="true" />

                  {/* Clean announcement text with selective gold highlights */}
                  <span className="text-zinc-200 font-bold">
                    {renderHighlightedMessage(item.message)}
                  </span>
                </span>
              );

              return (
                <div
                  key={`${copyIndex}-${item.id ?? index}-${index}`}
                  className="flex shrink-0 items-center"
                >
                  {isWhatsApp ? (
                    <a
                      href="https://wa.me/918317416695?text=Hello%20Rakexura%20Gaming%20Community"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center cursor-pointer hover:text-white hover:brightness-125 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#facc15]/60 focus-visible:rounded transition-all duration-150"
                      aria-label="Join the Rakexura WhatsApp Community"
                    >
                      {content}
                    </a>
                  ) : isBundle ? (
                    <Link
                      href="/bundles"
                      className="inline-flex items-center cursor-pointer hover:text-white hover:brightness-125 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#facc15]/60 focus-visible:rounded transition-all duration-150"
                      aria-label="View Combo Bundles"
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}

                  {/* Clean subtle bullet separator */}
                  <span
                    className="mx-6 sm:mx-8 md:mx-10 text-white/20 font-black text-sm select-none shrink-0"
                    aria-hidden="true"
                  >
                    •
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
