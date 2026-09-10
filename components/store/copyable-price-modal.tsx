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

  // Separate regular games from subscriptions for cleaner catalog display
  const regularGames = useMemo(() => activeGames.filter((g) => !g.is_subscription), [activeGames]);
  const subscriptionGames = useMemo(() => activeGames.filter((g) => Boolean(g.is_subscription)), [activeGames]);

  // Helper to format detailed platform prices for each game in catalog
  const formatGameLine = (g: Game) => {
    const parts: string[] = [];
    const offPrice = Number(g.offline_price ?? 0);
    const steamPrice = Number(g.steam_price ?? 0);
    const onPrice = Number(g.online_price ?? 0);
    const epicPrice = Number(g.epic_price ?? 0);
    const xboxPrice = Number(g.xbox_price ?? 0);
    const geforcePrice = Number(g.geforce_price ?? 0);
    const platforms = (g.available_platforms ?? []).filter(Boolean);

    const hasOffline = platforms.includes("Offline") || offPrice > 0;
    const hasOnline = platforms.includes("Online") || onPrice > 0;
    const hasSteam = platforms.includes("Steam") || steamPrice > 0;
    const hasEpic = platforms.includes("Epic") || epicPrice > 0;

    // 1. Offline Mode handling (collapse identical platform + mode prices)
    if (offPrice > 0 && steamPrice > 0 && offPrice === steamPrice) {
      parts.push(`₹${offPrice} (Steam Offline)`);
    } else if (offPrice > 0 && epicPrice > 0 && offPrice === epicPrice && !steamPrice) {
      parts.push(`₹${offPrice} (Epic Offline)`);
    } else if (offPrice > 0) {
      if (hasSteam && !hasEpic) {
        parts.push(`₹${offPrice} (Steam Offline)`);
      } else if (hasEpic && !hasSteam && epicPrice === offPrice) {
        parts.push(`₹${offPrice} (Epic Offline)`);
      } else {
        parts.push(`₹${offPrice} (Offline)`);
      }
    } else if (steamPrice > 0 && hasOffline && !hasOnline) {
      parts.push(`₹${steamPrice} (Steam Offline)`);
    } else if (epicPrice > 0 && hasOffline && !hasOnline && !steamPrice) {
      parts.push(`₹${epicPrice} (Epic Offline)`);
    }

    // 2. Online Mode handling (collapse identical platform + mode prices)
    if (onPrice > 0 && epicPrice > 0 && onPrice === epicPrice) {
      parts.push(`₹${onPrice} (Online / Epic)`);
    } else if (onPrice > 0 && steamPrice > 0 && onPrice === steamPrice && parts.length === 0) {
      parts.push(`₹${onPrice} (Steam Online)`);
    } else if (onPrice > 0) {
      if (hasEpic && !hasSteam) {
        parts.push(`₹${onPrice} (Online / Epic)`);
      } else if (hasSteam && parts.length === 0) {
        parts.push(`₹${onPrice} (Steam Online)`);
      } else {
        parts.push(`₹${onPrice} (Online)`);
      }
    }

    // 3. Any separate Steam price not covered above
    if (steamPrice > 0) {
      const alreadyHandled = parts.some((p) => p.includes(`₹${steamPrice}`) && p.includes("Steam"));
      if (!alreadyHandled) {
        if (hasOffline && parts.length === 0) {
          parts.push(`₹${steamPrice} (Steam Offline)`);
        } else if (hasOnline && parts.length === 0) {
          parts.push(`₹${steamPrice} (Steam Online)`);
        } else {
          parts.push(`₹${steamPrice} (Steam)`);
        }
      }
    }

    // 4. Any separate Epic price not covered above
    if (epicPrice > 0) {
      const alreadyHandled = parts.some((p) => p.includes(`₹${epicPrice}`) && p.includes("Epic"));
      if (!alreadyHandled) {
        if (hasOffline && parts.length === 0) {
          parts.push(`₹${epicPrice} (Epic Offline)`);
        } else if (hasOnline && parts.length === 0) {
          parts.push(`₹${epicPrice} (Epic Online)`);
        } else {
          parts.push(`₹${epicPrice} (Epic)`);
        }
      }
    }

    // 5. Xbox & GeForce
    if (xboxPrice > 0 && !parts.some((p) => p.includes("Xbox"))) {
      parts.push(`₹${xboxPrice} (Xbox)`);
    }
    if (geforcePrice > 0 && !parts.some((p) => p.includes("GeForce"))) {
      parts.push(`₹${geforcePrice} (GeForce)`);
    }

    const uniqueParts = Array.from(new Set(parts));
    const priceStr = uniqueParts.length > 0 ? uniqueParts.join(" | ") : `₹${lowestPrice(g)}`;
    const statusStr = g.out_of_stock || g.activation_slots === 0 ? " [Out of Stock]" : "";
    return `• ${g.title} — ${priceStr}${statusStr}`;
  };

  // Helper to format subscription plans cleanly
  const formatSubscriptionLine = (g: Game) => {
    const plans: string[] = [];
    if (g.price_1m && Number(g.price_1m) > 0) plans.push(`₹${g.price_1m} (1 Month)`);
    if (g.price_2m && Number(g.price_2m) > 0) plans.push(`₹${g.price_2m} (2 Months)`);
    if (g.price_3m && Number(g.price_3m) > 0) plans.push(`₹${g.price_3m} (3 Months)`);
    if (g.price_6m && Number(g.price_6m) > 0) plans.push(`₹${g.price_6m} (6 Months)`);
    if (g.price_12m && Number(g.price_12m) > 0) plans.push(`₹${g.price_12m} (12 Months)`);

    let priceStr = "";
    if (plans.length > 1) {
      priceStr = plans.join(" | ");
    } else if (plans.length === 1) {
      if (/month|year/i.test(g.title)) {
        priceStr = `₹${lowestPrice(g)}`;
      } else {
        priceStr = plans[0];
      }
    } else {
      priceStr = `₹${lowestPrice(g)}`;
    }
    const statusStr = g.out_of_stock || g.activation_slots === 0 ? " [Out of Stock]" : "";
    return `• ${g.title} — ${priceStr}${statusStr}`;
  };

  // Group regular games by price categories based on lowest price
  const under99 = useMemo(
    () => regularGames.filter((g) => lowestPrice(g) > 0 && lowestPrice(g) <= 99).sort((a, b) => lowestPrice(a) - lowestPrice(b) || a.title.localeCompare(b.title)),
    [regularGames]
  );
  const range100to199 = useMemo(
    () => regularGames.filter((g) => lowestPrice(g) >= 100 && lowestPrice(g) <= 199).sort((a, b) => lowestPrice(a) - lowestPrice(b) || a.title.localeCompare(b.title)),
    [regularGames]
  );
  const range200to499 = useMemo(
    () => regularGames.filter((g) => lowestPrice(g) >= 200 && lowestPrice(g) <= 499).sort((a, b) => lowestPrice(a) - lowestPrice(b) || a.title.localeCompare(b.title)),
    [regularGames]
  );
  const range500plus = useMemo(
    () => regularGames.filter((g) => lowestPrice(g) >= 500).sort((a, b) => lowestPrice(a) - lowestPrice(b) || a.title.localeCompare(b.title)),
    [regularGames]
  );

  // Build clean WhatsApp formatted message using WhatsApp-native Markdown
  const formattedText = useMemo(() => {
    const lines: string[] = [];
    const publicStoreUrl = SITE_CONFIG.siteUrl;
    const rawDigits = WHATSAPP_NUMBER.replace(/\D/g, "") || "918317416695";
    const cleanNumber = rawDigits.startsWith("91") ? rawDigits : `91${rawDigits}`;
    const formattedWhatsapp = cleanNumber.length === 12
      ? `+91 ${cleanNumber.slice(2, 7)} ${cleanNumber.slice(7)}`
      : `+${cleanNumber}`;

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
                subLines.push(`  • ${plan}: ~₹${reg}~ -> *₹${fl}*`);
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
                lines.push(`  • Steam / Offline: ~₹${steamDeal.regular}~ -> *₹${steamDeal.flash}*`);
                processed.add("Offline");
                processed.add("Steam");
              }
              if (epicDeal && onlineDeal && epicDeal.regular === onlineDeal.regular && epicDeal.flash === onlineDeal.flash) {
                lines.push(`  • Epic / Online: ~₹${epicDeal.regular}~ -> *₹${epicDeal.flash}*`);
                processed.add("Epic");
                processed.add("Online");
              }
              for (const d of platformDeals) {
                if (processed.has(d.name)) continue;
                lines.push(`  • ${d.name}: ~₹${d.regular}~ -> *₹${d.flash}*`);
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
          lines.push(`• *${b.title}*${includesText}: ~₹${origPrice}~ -> *₹${b.bundle_price}*`);
        }
        lines.push("");
      }

      lines.push("──────────────────");
      lines.push("🔒 *Why buy from Rakexura Store?*");
      lines.push("✅ 100% Genuine, Permanent & Safe Accounts");
      lines.push("✅ Instant Delivery within Minutes");
      lines.push("✅ Full Lifetime Tech Support\n");
      lines.push("⏰ *Limited Slots Available!* Prices will revert back once the sale timer expires.\n");
      lines.push(`📲 *DM us directly to lock in your game before slots run out:*`);
      lines.push(`👉 ${formattedWhatsapp}\n`);
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
              subLines.push(`  • ${plan}: ~₹${reg}~ -> *₹${fl}*`);
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
              lines.push(`  • Steam / Offline: ~₹${steamDeal.regular}~ -> *₹${steamDeal.flash}*`);
              processed.add("Offline");
              processed.add("Steam");
            }

            if (
              epicDeal &&
              onlineDeal &&
              epicDeal.regular === onlineDeal.regular &&
              epicDeal.flash === onlineDeal.flash
            ) {
              lines.push(`  • Epic / Online: ~₹${epicDeal.regular}~ -> *₹${epicDeal.flash}*`);
              processed.add("Epic");
              processed.add("Online");
            }

            for (const d of platformDeals) {
              if (processed.has(d.name)) continue;
              lines.push(`  • ${d.name}: ~₹${d.regular}~ -> *₹${d.flash}*`);
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
          lines.push(`• *${b.title}*${includesText}: ~₹${origPrice}~ -> *₹${b.bundle_price}*`);
        }
        lines.push("");
      }

      lines.push("──────────────────");
      lines.push("*💥 Limited time weekend deals!*");
      lines.push("⏰ Offer valid for 48 hours only");
      lines.push("Grab now before slots run out!\n");
      lines.push(`💬 *To order:* Reply with the game name!`);
      lines.push(`🌐 *Store:* ${publicStoreUrl}`);
      lines.push(`📱 *WhatsApp:* ${formattedWhatsapp}\n`);
    }

    // 2. COMPLETE CATALOG CATEGORIES
    if (activeTab === "full" || activeTab === "catalog" || (!hasFlashSales && activeTab === "flash")) {
      if (activeTab === "full" && hasFlashSales) {
        lines.push("──────────────────");
        lines.push("*🛍️ FULL CATALOG & PRICES:*\n");
      } else {
        lines.push("🛍️ *RAKEXURA STORE — COMPLETE CATALOG & PRICES*");
        lines.push("⚡ Instant Delivery | 100% Genuine Access\n");
      }

      if (under99.length > 0) {
        lines.push("*🔥 UNDER ₹99 GAMES:*");
        under99.forEach((g) => lines.push(formatGameLine(g)));
        lines.push("");
      }

      if (range100to199.length > 0) {
        lines.push("*⚡ ₹100 – ₹199 GAMES:*");
        range100to199.forEach((g) => lines.push(formatGameLine(g)));
        lines.push("");
      }

      if (range200to499.length > 0) {
        lines.push("*🎮 ₹200 – ₹499 GAMES:*");
        range200to499.forEach((g) => lines.push(formatGameLine(g)));
        lines.push("");
      }

      if (range500plus.length > 0) {
        lines.push("*💎 ₹500+ PREMIUM GAMES:*");
        range500plus.forEach((g) => lines.push(formatGameLine(g)));
        lines.push("");
      }

      if (subscriptionGames.length > 0) {
        lines.push("*🎟️ SUBSCRIPTIONS & CLOUD:*");
        subscriptionGames.forEach((g) => lines.push(formatSubscriptionLine(g)));
        lines.push("");
      }

      if (bundles.length > 0) {
        lines.push("*📦 COMBO BUNDLES:*");
        bundles.forEach((b) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const gameTitles = b.bundle_games?.map((bg: any) => bg.games?.title || bg.games?.[0]?.title).filter(Boolean) || [];
          const includesText = gameTitles.length > 0 ? ` (${gameTitles.join(", ")})` : "";
          lines.push(`• ${b.title} — ₹${b.bundle_price}${includesText}`);
        });
        lines.push("");
      }

      lines.push("──────────────────");
      lines.push("💬 *To order:* Reply with the game name or visit our storefront!");
      lines.push(`🌐 *Store:* ${publicStoreUrl}`);
      lines.push(`📱 *WhatsApp:* ${formattedWhatsapp}`);
    }

    return lines.join("\n");
  }, [flashSales, games, bundles, activeTab, under99, range100to199, range200to499, range500plus, subscriptionGames]);

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
