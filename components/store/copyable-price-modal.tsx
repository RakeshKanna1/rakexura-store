"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Check, X, Share2, MessageSquareText, ExternalLink, Zap, Layers, ListFilter, Megaphone } from "lucide-react";
import type { Game, Bundle, FlashSale } from "@/types/store";
import { calculatePlatformPrice, getPlatformRegularPrice, lowestPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { WHATSAPP_NUMBER, SITE_CONFIG } from "@/lib/config";
import { availablePlatforms } from "./game-card";

interface CopyablePriceModalProps {
  games: Game[];
  bundles: Bundle[];
  flashSales?: FlashSale[];
  isOpen: boolean;
  onClose: () => void;
}

export function CopyablePriceModal({ games, bundles, flashSales: initialFlashSales, isOpen, onClose }: CopyablePriceModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [flashSales, setFlashSales] = useState<FlashSale[]>(initialFlashSales ?? []);
  const [activeTab, setActiveTab] = useState<"full" | "flash" | "group" | "catalog">("full");
  const scrollRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch active live flash sales when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchLiveSales = async () => {
      try {
        const supabase = createClient();
        const now = new Date().toISOString();
        const { data } = await supabase
          .from("flash_sales")
          .select("*, games(*)")
          .eq("active", true)
          .lte("starts_at", now)
          .gt("ends_at", now)
          .order("ends_at");
        if (data) setFlashSales(data as unknown as FlashSale[]);
      } catch {
        // Fallback to initial
      }
    };
    void fetchLiveSales();
  }, [isOpen]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [isOpen]);

  // Include all non-archived games so price list is complete
  const activeGames = useMemo(() => games.filter((g) => !g.archived), [games]);

  // Helper to format detailed platform prices for each game in catalog
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
    return `- ${g.title}: ${priceStr}${statusStr}`;
  };

  // Group games by price categories based on lowest price
  const under99 = useMemo(() => activeGames.filter((g) => lowestPrice(g) > 0 && lowestPrice(g) <= 99).sort((a, b) => lowestPrice(a) - lowestPrice(b)), [activeGames]);
  const range100to199 = useMemo(() => activeGames.filter((g) => lowestPrice(g) >= 100 && lowestPrice(g) <= 199).sort((a, b) => lowestPrice(a) - lowestPrice(b)), [activeGames]);
  const range200to499 = useMemo(() => activeGames.filter((g) => lowestPrice(g) >= 200 && lowestPrice(g) <= 499).sort((a, b) => lowestPrice(a) - lowestPrice(b)), [activeGames]);
  const range500plus = useMemo(() => activeGames.filter((g) => lowestPrice(g) >= 500).sort((a, b) => lowestPrice(a) - lowestPrice(b)), [activeGames]);

  // Build clean WhatsApp formatted message using WhatsApp-native Markdown
  const formattedText = useMemo(() => {
    const lines: string[] = [];
    const publicStoreUrl = SITE_CONFIG.siteUrl;
    const contactNumber = `+${WHATSAPP_NUMBER.replace(/\D/g, "") || "916381765192"}`;

    const hasFlashSales = flashSales.length > 0;

    // A. GROUP / COMMUNITY ANNOUNCEMENT TAB
    if (activeTab === "group") {
      lines.push("🚨 *ATTENTION GAMERS — SPECIAL OFFER IS LIVE!* 🚨\n");
      lines.push("Hey everyone! 👋 We just dropped massive limited-time flash discounts on your favorite titles:\n");

      if (hasFlashSales) {
        lines.push("*⚡ HOTTEST PICKS OF THE SALE:*\n");
        for (const fs of flashSales) {
          const game = fs.games || games.find((g) => g.id === fs.game_id);
          if (!game) continue;
          const platforms = availablePlatforms(game);

          if (game.is_subscription) {
            const subLines: string[] = [];
            const plans = ["1 Month", "2 Months", "3 Months", "6 Months", "12 Months"] as const;
            for (const plan of plans) {
              if (!platforms.includes(plan)) continue;
              const reg = getPlatformRegularPrice(game, plan);
              const fl = calculatePlatformPrice(game, plan, fs);
              if (reg > 0 && fl < reg) {
                subLines.push(`  - ${plan}: ~₹${reg}~ -> *₹${fl}*`);
              }
            }
            if (subLines.length > 0) {
              lines.push(`*${game.title}*`);
              subLines.forEach((sl) => lines.push(sl));
              lines.push("");
            }
          } else {
            const validPlatforms = platforms.filter((p) => !p.includes("Month") && !p.includes("Year"));
            const platformDeals: Array<{ name: string; regular: number; flash: number }> = [];
            for (const p of validPlatforms) {
              const reg = getPlatformRegularPrice(game, p);
              const fl = calculatePlatformPrice(game, p, fs);
              if (reg > 0 && fl < reg) {
                platformDeals.push({ name: p, regular: reg, flash: fl });
              }
            }
            if (platformDeals.length > 0) {
              lines.push(`*${game.title}*`);
              const offlineDeal = platformDeals.find((d) => d.name === "Offline");
              const steamDeal = platformDeals.find((d) => d.name === "Steam");
              const epicDeal = platformDeals.find((d) => d.name === "Epic");
              const onlineDeal = platformDeals.find((d) => d.name === "Online");
              const processed = new Set<string>();

              if (offlineDeal && steamDeal && offlineDeal.regular === steamDeal.regular && offlineDeal.flash === steamDeal.flash) {
                lines.push(`  - Steam / Offline: ~₹${steamDeal.regular}~ -> *₹${steamDeal.flash}*`);
                processed.add("Offline");
                processed.add("Steam");
              }
              if (epicDeal && onlineDeal && epicDeal.regular === onlineDeal.regular && epicDeal.flash === onlineDeal.flash) {
                lines.push(`  - Epic / Online: ~₹${epicDeal.regular}~ -> *₹${epicDeal.flash}*`);
                processed.add("Epic");
                processed.add("Online");
              }
              for (const d of platformDeals) {
                if (processed.has(d.name)) continue;
                lines.push(`  - ${d.name}: ~₹${d.regular}~ -> *₹${d.flash}*`);
              }
              lines.push("");
            }
          }
        }
      }

      if (bundles.length > 0) {
        lines.push("*📦 Combo Offer Deals:*\n");
        for (const b of bundles) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const gameTitles = b.bundle_games?.map((bg: any) => bg.games?.title || bg.games?.[0]?.title).filter(Boolean) || [];
          const includesText = gameTitles.length > 0 ? ` (${gameTitles.join(", ")})` : "";
          const origPrice = Number(b.original_price || Math.round(b.bundle_price * 1.35));
          lines.push(`- *${b.title}*${includesText}: ~₹${origPrice}~ -> *₹${b.bundle_price}*`);
        }
        lines.push("");
      }

      lines.push("🔒 *Why buy from Rakexura Store?*");
      lines.push("✅ 100% Genuine, Permanent & Safe Accounts");
      lines.push("✅ Instant Delivery within Minutes");
      lines.push("✅ Full Lifetime Tech Support\n");
      lines.push("⏰ *Limited Slots Available!* Prices will revert back once the sale timer expires.\n");
      lines.push(`📲 *DM us directly to lock in your game before slots run out:*`);
      lines.push(`👉 ${contactNumber}\n`);
      lines.push(`🌐 *Browse Full Catalog Online:*`);
      lines.push(`${publicStoreUrl}`);

      return lines.join("\n");
    }

    // B. STANDARD BROADCAST / CATALOG TABS
    // 1. FLASH SALE / WEEKEND OFFER HEADER & DEALS
    if ((activeTab === "full" || activeTab === "flash") && hasFlashSales) {
      lines.push("*WEEKEND OFFER IS LIVE!* 🔥\n");
      lines.push("*⚡ Flash Sale Deals:*\n");

      for (const fs of flashSales) {
        const game = fs.games || games.find((g) => g.id === fs.game_id);
        if (!game) continue;

        const platforms = availablePlatforms(game);

        if (game.is_subscription) {
          const subLines: string[] = [];
          const plans = ["1 Month", "2 Months", "3 Months", "6 Months", "12 Months"] as const;

          for (const plan of plans) {
            if (!platforms.includes(plan)) continue;
            const reg = getPlatformRegularPrice(game, plan);
            const fl = calculatePlatformPrice(game, plan, fs);
            if (reg > 0 && fl < reg) {
              subLines.push(`  - ${plan}: ~₹${reg}~ -> *₹${fl}*`);
            }
          }

          if (subLines.length > 0) {
            lines.push(`*${game.title}*`);
            subLines.forEach((sl) => lines.push(sl));
            lines.push("");
          }
        } else {
          // Standard PC Game (Offline, Steam, Epic, Online, Xbox, Nvidia GeForce)
          const validPlatforms = platforms.filter((p) => !p.includes("Month") && !p.includes("Year"));
          const platformDeals: Array<{ name: string; regular: number; flash: number }> = [];

          for (const p of validPlatforms) {
            const reg = getPlatformRegularPrice(game, p);
            const fl = calculatePlatformPrice(game, p, fs);
            if (reg > 0 && fl < reg) {
              platformDeals.push({ name: p, regular: reg, flash: fl });
            }
          }

          if (platformDeals.length > 0) {
            lines.push(`*${game.title}*`);

            const offlineDeal = platformDeals.find((d) => d.name === "Offline");
            const steamDeal = platformDeals.find((d) => d.name === "Steam");
            const epicDeal = platformDeals.find((d) => d.name === "Epic");
            const onlineDeal = platformDeals.find((d) => d.name === "Online");

            const processed = new Set<string>();

            if (
              offlineDeal &&
              steamDeal &&
              offlineDeal.regular === steamDeal.regular &&
              offlineDeal.flash === steamDeal.flash
            ) {
              lines.push(`  - Steam / Offline: ~₹${steamDeal.regular}~ -> *₹${steamDeal.flash}*`);
              processed.add("Offline");
              processed.add("Steam");
            }

            if (
              epicDeal &&
              onlineDeal &&
              epicDeal.regular === onlineDeal.regular &&
              epicDeal.flash === onlineDeal.flash
            ) {
              lines.push(`  - Epic / Online: ~₹${epicDeal.regular}~ -> *₹${epicDeal.flash}*`);
              processed.add("Epic");
              processed.add("Online");
            }

            for (const d of platformDeals) {
              if (processed.has(d.name)) continue;
              lines.push(`  - ${d.name}: ~₹${d.regular}~ -> *₹${d.flash}*`);
            }

            lines.push("");
          }
        }
      }

      // COMBO BUNDLE DEALS
      if (bundles.length > 0) {
        lines.push("*📦 Combo Offer Deals:*\n");
        for (const b of bundles) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const gameTitles = b.bundle_games?.map((bg: any) => bg.games?.title || bg.games?.[0]?.title).filter(Boolean) || [];
          const includesText = gameTitles.length > 0 ? ` (${gameTitles.join(", ")})` : "";
          const origPrice = Number(b.original_price || Math.round(b.bundle_price * 1.35));
          lines.push(`- *${b.title}*${includesText}: ~₹${origPrice}~ -> *₹${b.bundle_price}*`);
        }
        lines.push("");
      }

      lines.push("*💥 Limited time weekend deals!*");
      lines.push("⏰ Offer valid for 48 hours only");
      lines.push("Grab now before it's gone!\n");
      lines.push(`📩 *DM NOW TO BOOK:* ${contactNumber}`);
      lines.push(`🌐 *Store:* ${publicStoreUrl}\n`);
    }

    // 2. COMPLETE CATALOG CATEGORIES
    if (activeTab === "full" || activeTab === "catalog" || (!hasFlashSales && activeTab === "flash")) {
      if (activeTab === "full" && hasFlashSales) {
        lines.push("━━━━━━━━━━━━━━━━━━━━");
        lines.push("*🛍️ FULL CATALOG & PRICE LIST:*\n");
      } else {
        lines.push("*🛍️ RAKEXURA STORE — COMPLETE CATALOG & PRICE LIST*\n");
      }

      if (under99.length > 0) {
        lines.push("*🔥 UNDER ₹99 GAMES:*");
        under99.forEach((g) => lines.push(formatGameLine(g)));
        lines.push("");
      }

      if (range100to199.length > 0) {
        lines.push("*⚡ ₹100 - ₹199 GAMES:*");
        range100to199.forEach((g) => lines.push(formatGameLine(g)));
        lines.push("");
      }

      if (range200to499.length > 0) {
        lines.push("*🎮 ₹200 - ₹499 GAMES:*");
        range200to499.forEach((g) => lines.push(formatGameLine(g)));
        lines.push("");
      }

      if (range500plus.length > 0) {
        lines.push("*💎 ₹500+ PREMIUM GAMES:*");
        range500plus.forEach((g) => lines.push(formatGameLine(g)));
        lines.push("");
      }

      if (bundles.length > 0 && activeTab === "catalog") {
        lines.push("*📦 COMBO BUNDLES:*");
        bundles.forEach((b) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const gameTitles = b.bundle_games?.map((bg: any) => bg.games?.title || bg.games?.[0]?.title).filter(Boolean) || [];
          const includesText = gameTitles.length > 0 ? ` (${gameTitles.join(", ")})` : "";
          lines.push(`- ${b.title}: ₹${b.bundle_price}${includesText}`);
        });
        lines.push("");
      }

      lines.push("💬 To order, reply with the game title or visit our storefront!");
      lines.push(`📱 WhatsApp: ${contactNumber}`);
    }

    return lines.join("\n");
  }, [flashSales, games, bundles, activeTab, under99, range100to199, range200to499, range500plus]);

  if (!isOpen || !mounted) return null;

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

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedText)}`;

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
                    {flashSales.length > 0 ? `${flashSales.length} flash deals active · ` : ""}{activeGames.length} games & {bundles.length} bundles
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

            {/* Quick Filter Tabs for WhatsApp Broadcast Formats */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("full")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "full"
                    ? "bg-[#facc15] text-black shadow-sm"
                    : "bg-white/[0.05] text-[#8991a8] hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                <Layers size={13} /> Full Broadcast
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("group")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "group"
                    ? "bg-[#facc15] text-black shadow-sm"
                    : "bg-white/[0.05] text-[#8991a8] hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                <Megaphone size={13} /> Group Announcement
              </button>
              {flashSales.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("flash")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "flash"
                      ? "bg-[#facc15] text-black shadow-sm"
                      : "bg-[#facc15]/10 text-[#facc15] hover:bg-[#facc15]/20 border border-[#facc15]/30"
                  }`}
                >
                  <Zap size={13} className="fill-current" /> Flash Deals ({flashSales.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab("catalog")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "catalog"
                    ? "bg-[#facc15] text-black shadow-sm"
                    : "bg-white/[0.05] text-[#8991a8] hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                <ListFilter size={13} /> Catalog Only
              </button>
            </div>

            {/* Helper label above textarea */}
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-[#8991a8]">
              <span className="flex items-center gap-1.5">
                <MessageSquareText size={13} className="text-[#8991a8]" /> Broadcast text formatted for WhatsApp & Telegram
              </span>
              <span className="text-[#70efbb]">Auto-formatted</span>
            </div>

            {/* Textarea Box */}
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
              className="my-2.5 h-96 min-h-[280px] max-h-[48vh] w-full resize-none rounded-lg border border-white/10 bg-[#06080e] p-4 text-[13px] font-sans font-medium text-slate-100 leading-relaxed tracking-wide outline-none custom-scrollbar focus:border-amber-400/40 select-all shadow-inner"
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 text-xs gap-2 min-h-10 w-full sm:w-auto justify-center"
              >
                <MessageSquareText size={16} /> Share directly on WhatsApp <ExternalLink size={14} />
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`btn min-h-10 gap-2 text-xs font-bold transition-all w-full sm:w-auto justify-center ${
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
