"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Check, X, Share2, MessageSquareText, ExternalLink } from "lucide-react";
import type { Game, Bundle } from "@/types/store";
import { lowestPrice } from "@/lib/utils";

interface CopyablePriceModalProps {
  games: Game[];
  bundles: Bundle[];
  isOpen: boolean;
  onClose: () => void;
}

export function CopyablePriceModal({ games, bundles, isOpen, onClose }: CopyablePriceModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Include all non-archived games so price list is complete
  const activeGames = games.filter((g) => !g.archived);

  // Helper to format detailed platform prices for each game
  const formatGameLine = (g: Game) => {
    const parts: string[] = [];
    if (g.offline_price && Number(g.offline_price) > 0) parts.push(`₹${g.offline_price} (Offline)`);
    if (g.steam_price && Number(g.steam_price) > 0) parts.push(`₹${g.steam_price} (Steam)`);
    if (g.online_price && Number(g.online_price) > 0) parts.push(`₹${g.online_price} (Online)`);
    if (g.epic_price && Number(g.epic_price) > 0) parts.push(`₹${g.epic_price} (Epic)`);
    if (g.xbox_price && Number(g.xbox_price) > 0) parts.push(`₹${g.xbox_price} (Xbox)`);
    if (g.geforce_price && Number(g.geforce_price) > 0) parts.push(`₹${g.geforce_price} (GeForce)`);

    const priceStr = parts.length > 0 ? parts.join(" | ") : `₹${lowestPrice(g)}`;
    const statusStr = g.out_of_stock ? " [Out of Stock]" : "";
    return `• ${g.title} — ${priceStr}${statusStr}`;
  };

  // Group games by price categories based on lowest price
  const under99 = activeGames.filter((g) => lowestPrice(g) > 0 && lowestPrice(g) <= 99).sort((a, b) => lowestPrice(a) - lowestPrice(b));
  const range100to199 = activeGames.filter((g) => lowestPrice(g) >= 100 && lowestPrice(g) <= 199).sort((a, b) => lowestPrice(a) - lowestPrice(b));
  const range200to499 = activeGames.filter((g) => lowestPrice(g) >= 200 && lowestPrice(g) <= 499).sort((a, b) => lowestPrice(a) - lowestPrice(b));
  const range500plus = activeGames.filter((g) => lowestPrice(g) >= 500).sort((a, b) => lowestPrice(a) - lowestPrice(b));

  // Build clean plain text message
  const messageLines: string[] = [];

  messageLines.push("*RAKEXURA STORE — COMPLETE GAMES & BUNDLES PRICE LIST*\n");

  if (under99.length > 0) {
    messageLines.push("*UNDER ₹99 GAMES:*");
    under99.forEach((g) => messageLines.push(formatGameLine(g)));
    messageLines.push("");
  }

  if (range100to199.length > 0) {
    messageLines.push("*₹100 - ₹199 GAMES:*");
    range100to199.forEach((g) => messageLines.push(formatGameLine(g)));
    messageLines.push("");
  }

  if (range200to499.length > 0) {
    messageLines.push("*₹200 - ₹499 GAMES:*");
    range200to499.forEach((g) => messageLines.push(formatGameLine(g)));
    messageLines.push("");
  }

  if (range500plus.length > 0) {
    messageLines.push("*₹500+ PREMIUM GAMES:*");
    range500plus.forEach((g) => messageLines.push(formatGameLine(g)));
    messageLines.push("");
  }

  if (bundles.length > 0) {
    messageLines.push("*COMBO BUNDLES:*");
    bundles.forEach((b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gameTitles = b.bundle_games?.map((bg: any) => bg.games?.title || bg.games?.[0]?.title).filter(Boolean) || [];
      const includesText = gameTitles.length > 0 ? ` (${gameTitles.join(", ")})` : "";
      messageLines.push(`• ${b.title} — ₹${b.bundle_price}${includesText}`);
    });
    messageLines.push("");
  }

  messageLines.push("To order, reply with the game title or visit our storefront!");

  const formattedText = messageLines.join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = formattedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(formattedText)}`;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-white/15 bg-[#0d1017] p-5 md:p-7 shadow-2xl"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Copyable Inventory List</h3>
                  <p className="text-xs text-[#8991a6]">
                    {activeGames.length} games & {bundles.length} bundles categorized by price
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="rounded-lg border border-white/10 p-2 text-[#8991a6] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Textarea Box - Natively Mouse Wheel Scrollable */}
            <textarea
              ref={scrollRef}
              readOnly
              data-lenis-prevent
              data-lenis-prevent-wheel
              value={formattedText}
              style={{
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-y"
              }}
              className="my-4 h-96 min-h-[280px] max-h-[50vh] w-full resize-none rounded-lg border border-white/10 bg-[#06080d] p-4 text-xs font-mono text-neutral-200 leading-relaxed outline-none custom-scrollbar focus:border-amber-400/40 select-all"
            />

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 text-xs gap-2 min-h-10"
              >
                <MessageSquareText size={16} /> Share directly on WhatsApp <ExternalLink size={14} />
              </a>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`btn min-h-10 gap-2 text-xs font-bold transition-all ${
                    copied
                      ? "bg-emerald-500 text-black border-emerald-400"
                      : "btn-primary"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={16} /> Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copy Message
                    </>
                  )}
                </button>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
