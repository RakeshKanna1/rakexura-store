"use client";

import { BadgeCheck, Heart, ShieldCheck, ShoppingBag, TicketPercent, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/common/button";
import { ReviewForm } from "@/components/reviews/review-form";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/auth-modal";
import type { User } from "@supabase/supabase-js";
import { formatPrice, isDiamondOrPlatinumCoupon } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import type { Game, Platform } from "@/types/store";
import { availablePlatforms } from "./game-card";
import { OfferCountdown } from "./offer-countdown";
import { Confetti } from "@/components/common/confetti";

function price(game: Game, platform: Platform) {
  if (platform === "Epic") return Number(game.epic_price ?? 0);
  if (platform === "Offline") return Number(game.offline_price ?? 0);
  if (platform === "Online") return Number(game.online_price ?? 0);
  if (platform === "Xbox") return Number(game.xbox_price ?? 0);
  if (platform === "Nvidia GeForce") return Number(game.geforce_price ?? 0);
  return Number(game.steam_price ?? 0);
}

export function ProductActions({ game }: { game: Game }) {
  const [celebrate, setCelebrate] = useState(false);
  const platforms = availablePlatforms(game);
  const [selected, setSelected] = useState<Platform>(platforms[0] ?? "Steam");
  const add = useCartStore((state) => state.add);
  const setStoreQuantity = useCartStore((state) => state.setQuantity);
  const toggle = useCartStore((state) => state.toggleWishlist);
  const saved = useCartStore((state) => state.wishlistIds.includes(game.id));
  const lines = useCartStore((state) => state.lines);
  const coupon = useCartStore((state) => state.coupon);
  const setCoupon = useCartStore((state) => state.setCoupon);
  const [couponCode, setCouponCode] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setCheckedAuth(true);
    });
  }, []);

  useEffect(() => {
    if (mounted && coupon) {
      setCouponCode(coupon.code);
    }
  }, [mounted, coupon]);

  // Dynamic validation check for RAKETHREE quantity constraints on the game details page
  useEffect(() => {
    const totalSelected = lines.filter((l) => l.game.id !== game.id).length;
    const activeCount = quantity + totalSelected;
    if (coupon?.code === "RAKETHREE" && activeCount < 3) {
      setCoupon(null);
      setCouponCode("");
      toast.error("Coupon RAKETHREE removed: This code requires a minimum selection of 3 games.");
    }
  }, [coupon, quantity, lines, game.id, setCoupon]);

  // Dynamic validation check for general coupon game price constraints
  useEffect(() => {
    if (coupon && !isDiamondOrPlatinumCoupon(coupon.code)) {
      const basePrice = price(game, selected);
      if (basePrice * quantity <= 99) {
        setCoupon(null);
        setCouponCode("");
        toast.error("Coupon removed: General coupons can only be applied to games priced above Rs. 99.");
      }
    }
  }, [selected, coupon, game, quantity, setCoupon]);

  const basePrice = price(game, selected);
  const gameSubtotal = basePrice * quantity;
  const activeCoupon = mounted ? coupon : null;
  const couponSavings = activeCoupon && gameSubtotal >= activeCoupon.minimum_order ? Math.min(gameSubtotal, activeCoupon.discount_type === "percentage" ? gameSubtotal * activeCoupon.discount_value / 100 : activeCoupon.discount_value) : 0;
  const discountedPrice = Math.max(0, gameSubtotal - couponSavings);
  const isSaved = mounted && saved;

  async function checkCoupon() {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) return toast.error("Enter a coupon code");
    setCheckingCoupon(true);

    const totalSelected = useCartStore.getState().lines.filter((l) => l.game.id !== game.id).length;
    const activeCount = quantity + totalSelected;

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: normalized,
          gamePrice: basePrice,
          subtotal: gameSubtotal,
          quantity: quantity,
          cartItemsCount: activeCount
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setCoupon(null);
        toast.error(resData.error?.message || "This coupon is invalid or not active");
      } else {
        setCoupon({
          code: resData.data.code,
          discount_type: resData.data.discount_type,
          discount_value: resData.data.discount_value,
          minimum_order: resData.data.minimum_order
        });
        setCelebrate(true);
        toast.success("Coupon applied");
      }
    } catch {
      toast.error("Network error during coupon validation.");
    } finally {
      setCheckingCoupon(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass min-w-0 space-y-5 overflow-hidden rounded-lg p-4 sm:p-5">
        <OfferCountdown end={game.offer_end_date} />
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8991a8]">Choose platform</span>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {platforms.map((platform) => (
              <button
                key={platform}
                type="button"
                suppressHydrationWarning
                onClick={() => setSelected(platform)}
                className={`rounded-md border px-3 py-3 text-sm font-semibold transition ${
                  selected === platform
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-black/20 text-[#bbc1d1] hover:border-white/25"
                }`}
              >
                {game.is_subscription
                  ? game.duration
                    ? `${platform} (${game.duration})`
                    : platform === "Steam"
                    ? "1 Month"
                    : platform === "Epic"
                    ? "3 Months"
                    : platform === "Offline"
                    ? "12 Months"
                    : platform
                  : platform}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Platform Helper Tip */}
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3.5 text-xs leading-relaxed text-[#a0a8c0]">
          {selected === "Offline" && (
            <p>
              💡 <strong>Offline Activation:</strong> Play the full single-player campaign offline via a verified account. Game progress and saves are kept locally on your PC. Heavily discounted!
            </p>
          )}
          {selected === "Online" && (
            <p>
              💡 <strong>Online Activation:</strong> Assisted game setup with support for online/multiplayer features where available.
            </p>
          )}
          {selected === "Steam" && (
            <p>
              💡 <strong>Steam:</strong> Digital assisted delivery. The game is set up on your personal Steam client.
            </p>
          )}
          {selected === "Epic" && (
            <p>
              💡 <strong>Epic:</strong> Digital assisted delivery. The game is set up on your personal Epic Games client.
            </p>
          )}
          {selected === "Xbox" && (
            <p>
              💡 <strong>Xbox:</strong> Assisted setup for Xbox Play Anywhere or Microsoft Store game files.
            </p>
          )}
          {selected === "Nvidia GeForce" && (
            <p>
              💡 <strong>Nvidia GeForce Now:</strong> Setup assistance for cloud gaming compatibility.
            </p>
          )}
        </div>

        {/* Polished Minimalist Coupon Input Field inside Game Details */}
        <div className="border-t border-white/[.08] pt-4">
          <label htmlFor="loyalty-coupon-input" className="mb-2 flex items-center gap-2 text-xs font-bold text-[#8991a8]">
            <TicketPercent size={14} className="text-[#facc15]" /> Apply Loyalty Coupon
          </label>
          <div className="flex gap-2">
            <input 
              id="loyalty-coupon-input"
              name="coupon_code"
              suppressHydrationWarning
              value={couponCode} 
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
              placeholder="DIAMONDFREE" 
              className="h-10 min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-3 text-xs uppercase outline-none focus:border-[#8b5cf6] text-white" 
            />
            <button 
              type="button" 
              suppressHydrationWarning
              onClick={checkCoupon} 
              disabled={checkingCoupon} 
              className="btn btn-secondary h-10 min-h-10 px-3 text-xs font-semibold"
            >
              {checkingCoupon ? "..." : "Apply"}
            </button>
          </div>
          <AnimatePresence>
            {activeCoupon && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 flex items-center justify-between text-[11px] text-[#70efbb]"
              >
                <span>Coupon &quot;{activeCoupon.code}&quot; applied</span>
                <button type="button" onClick={() => { setCoupon(null); setCouponCode(""); }} className="underline hover:text-white transition-colors">Remove</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* High-end, low-intensity typographic promotional layout frame */}
          <div className="mt-3 rounded-md bg-white/[0.02] border border-white/[0.05] p-3 text-center">
            <p className="text-xs text-[#8991a8] font-semibold leading-relaxed">
              Add three more games to attain a code
            </p>
            <p className="mt-1.5 text-[10px] text-[#70efbb]/90 font-bold uppercase tracking-wider">
              Unlock 10% off with coupon: <span className="text-white bg-white/10 px-1.5 py-0.5 rounded font-mono font-black">RAKETHREE</span>
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-white/[.08] pt-5">
          <div>
            <span className="text-xs text-[#8991a8]">Current price</span>
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                {couponSavings > 0 ? (
                  <motion.div 
                    key="discounted"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex items-center gap-2"
                  >
                    <del className="text-sm text-[#646b7b]">{formatPrice(gameSubtotal)}</del>
                    <strong className="block text-3xl text-[#70efbb]">{formatPrice(discountedPrice)}</strong>
                  </motion.div>
                ) : (
                  <motion.strong 
                    key="regular"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="block text-3xl text-white"
                  >
                    {formatPrice(gameSubtotal)}
                  </motion.strong>
                )}
              </AnimatePresence>
            </div>
          </div>
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => {
              toggle(game.id);
              toast(saved ? "Removed from wishlist" : "Saved to wishlist");
            }}
            className="grid h-11 w-11 place-items-center rounded-md bg-white/[.07]"
            aria-label="Save game"
          >
            <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>

        {typeof game.activation_slots === "number" && game.activation_slots > 0 && <div className="flex items-center gap-2 rounded-md bg-[#ffb800]/[.06] px-3 py-2 text-xs text-[#ffca55]"><Zap size={15} /> {game.activation_slots} activation slots currently available</div>}
        
        {/* Sleek, minimalist horizontal quantity selector */}
        <div className="flex items-center justify-between border-t border-white/[.08] pt-4 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8991a8]">Quantity</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              suppressHydrationWarning
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/20 text-sm font-semibold transition hover:border-white/20 disabled:opacity-40 disabled:hover:border-white/10 text-white animate-pulse-slow"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-bold text-white">{quantity}</span>
            <button
              type="button"
              suppressHydrationWarning
              disabled={quantity >= 5}
              onClick={() => setQuantity((q) => Math.min(5, q + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/20 text-sm font-semibold transition hover:border-white/20 disabled:opacity-40 disabled:hover:border-white/10 text-white"
            >
              +
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 min-[430px]:grid-cols-2">
          {game.out_of_stock ? (
            <Button 
              type="button"
              suppressHydrationWarning
              className="w-full border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 min-[430px]:col-span-2" 
              onClick={() => { 
                toast.info("This game is currently out of stock. Please wait for some time, we will notify you once it becomes available!", {
                  duration: 6000,
                });
              }}
            >
              Out of stock
            </Button>
          ) : (
            <>
              <Button 
                type="button"
                suppressHydrationWarning
                className="w-full border border-white/10 bg-white/[.06] text-white hover:bg-white/[.1]" 
                onClick={() => { 
                  const action = () => {
                    add(game, selected); 
                    setStoreQuantity(game.id, selected, quantity);
                    toast.success(`${game.title} added to cart`); 
                  };
                  if (checkedAuth && !user) {
                    setPendingAction(() => action);
                    setShowAuthModal(true);
                  } else {
                    action();
                  }
                }}
              >
                <ShoppingBag size={18} /> Add to cart
              </Button>
              <Button 
                type="button"
                suppressHydrationWarning
                className="w-full bg-[#facc15] text-[#080808] hover:bg-[#ffe047] font-black" 
                onClick={() => { 
                  const action = () => {
                    add(game, selected); 
                    setStoreQuantity(game.id, selected, quantity);
                    router.push("/checkout"); 
                  };
                  if (checkedAuth && !user) {
                    setPendingAction(() => action);
                    setShowAuthModal(true);
                  } else {
                    action();
                  }
                }}
              >
                Buy now
              </Button>
            </>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-2 border-t border-white/[.08] pt-4 text-[11px] text-[#9ba3b7] min-[430px]:grid-cols-2"><span className="flex items-center gap-1.5"><BadgeCheck size={14} className="text-[#00d68f]" /> Verified seller</span><span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#facc15]" /> Secure payment</span></div>
        <p className="text-center text-xs leading-5 text-[#7f879d]">Coupon codes can be checked in cart. Payment is reviewed before delivery.</p>
      </div>
      <ReviewForm gameId={game.id} gameTitle={game.title} />
      <Confetti active={celebrate} onComplete={() => setCelebrate(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onContinueAsGuest={() => { if (pendingAction) pendingAction(); setShowAuthModal(false); }} />
      {/* Sticky Bottom Bar for Mobile View Only - Only show when out of stock */}
      {game.out_of_stock && (
        <div className="fixed bottom-[68px] left-0 right-0 z-50 border-t border-white/10 bg-black/90 p-3.5 backdrop-blur-lg lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-[#8991a8] uppercase font-bold tracking-wider">{selected} edition</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-[#70efbb]">{formatPrice(discountedPrice)}</span>
                {couponSavings > 0 && (
                  <span className="text-xs text-[#646b7b] line-through">{formatPrice(gameSubtotal)}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const element = document.querySelector(".game-detail-buy");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
                className="rounded-md border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/[0.1] active:scale-95 transition-all"
                type="button"
                suppressHydrationWarning
              >
                Options
              </button>
              <button
                onClick={() => {
                  toast.info("This game is currently out of stock. Please wait for some time, we will notify you once it becomes available!", {
                    duration: 6000,
                  });
                }}
                className="rounded-md px-5 py-2.5 text-xs font-black text-white active:scale-95 transition-all bg-red-600/40 border border-red-500/25 text-red-200"
                type="button"
                suppressHydrationWarning
              >
                Out of Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
