"use client";

import { useState } from "react";
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

  if (!isOpen) return null;

  // Filter available (non-archived, non-out-of-stock) games
  const activeGames = games.filter((g) => !g.archived && !g.out_of_stock);

  // Group games by price categories
  const under99 = activeGames.filter((g) => lowestPrice(g) <= 99).sort((a, b) => lowestPrice(a) - lowestPrice(b));
  const range100to199 = activeGames.filter((g) => lowestPrice(g) >= 100 && lowestPrice(g) <= 199).sort((a, b) => lowestPrice(a) - lowestPrice(b));
  const range200to499 = activeGames.filter((g) => lowestPrice(g) >= 200 && lowestPrice(g) <= 499).sort((a, b) => lowestPrice(a) - lowestPrice(b));
  const range500plus = activeGames.filter((g) => lowestPrice(g) >= 500).sort((a, b) => lowestPrice(a) - lowestPrice(b));

  // Build clean plain text message with minimal emojis
  const messageLines: string[] = [];

  messageLines.push("*RAKEXURA STORE — AVAILABLE GAMES & BUNDLES LIST*\n");

  if (under99.length > 0) {
    messageLines.push("*UNDER ₹99 GAMES:*");
    under99.forEach((g) => {
      messageLines.push(`• ${g.title} — ₹${lowestPrice(g)}`);
    });
    messageLines.push("");
  }

  if (range100to199.length > 0) {
    messageLines.push("*₹100 - ₹199 GAMES:*");
    range100to199.forEach((g) => {
      messageLines.push(`• ${g.title} — ₹${lowestPrice(g)}`);
    });
    messageLines.push("");
  }

  if (range200to499.length > 0) {
    messageLines.push("*₹200 - ₹499 GAMES:*");
    range200to499.forEach((g) => {
      messageLines.push(`• ${g.title} — ₹${lowestPrice(g)}`);
    });
    messageLines.push("");
  }

  if (range500plus.length > 0) {
    messageLines.push("*₹500+ PREMIUM GAMES:*");
    range500plus.forEach((g) => {
      messageLines.push(`• ${g.title} — ₹${lowestPrice(g)}`);
    });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-white/15 bg-[#0d1017] p-5 md:p-7 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#facc15]/10 text-[#facc15]">
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
            className="rounded-lg border border-white/10 p-2 text-[#8991a6] hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Text Preview Box */}
        <div
          data-lenis-prevent
          onWheel={(e) => {
            e.stopPropagation();
            e.currentTarget.scrollTop += e.deltaY;
          }}
          style={{
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y"
          }}
          className="my-4 max-h-[55vh] flex-1 overflow-y-auto rounded-lg border border-white/10 bg-[#06080d] p-4 text-xs font-mono text-neutral-200 leading-relaxed custom-scrollbar whitespace-pre-wrap select-all"
        >
          {formattedText}
        </div>

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

      </div>
    </div>
  );
}
