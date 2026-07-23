"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, X, TicketPercent } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { assetUrl, formatPrice, lowestPrice } from "@/lib/utils";
import { triggerFlyToCart } from "@/components/common/fly-to-cart-animator";
import { useCartStore } from "@/stores/cart-store";
import type { Game } from "@/types/store";
import { availablePlatforms } from "./game-card";
import { Confetti } from "@/components/common/confetti";

export function QuickViewModal({ game, onClose }: { game: Game | null; onClose: () => void }) {
  const [celebrate, setCelebrate] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const add = useCartStore((state) => state.add);
  const toggle = useCartStore((state) => state.toggleWishlist);
  const saved = useCartStore((state) => state.wishlistIds.includes(game?.id ?? -1));
  const coupon = useCartStore((state) => state.coupon);
  const setCoupon = useCartStore((state) => state.setCoupon);
  const [couponCode, setCouponCode] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  useEffect(() => {
    if (mounted && coupon) {
      setCouponCode(coupon.code);
    }
  }, [mounted, coupon]);

  const activeCoupon = mounted ? coupon : null;
  const isSaved = mounted ? saved : false;

  const lowest = game ? lowestPrice(game) : 0;
  const couponSavings = activeCoupon && lowest >= activeCoupon.minimum_order ? Math.min(lowest, activeCoupon.discount_type === "percentage" ? lowest * activeCoupon.discount_value / 100 : activeCoupon.discount_value) : 0;
  const discountedPrice = Math.max(0, lowest - couponSavings);

  async function checkCoupon() {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) return toast.error("Enter a coupon code");
    setCheckingCoupon(true);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: normalized,
          gamePrice: lowest,
          subtotal: lowest,
          quantity: 1
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
    <AnimatePresence>
      {game && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) onClose();
          }}
        >
          <motion.article
            role="dialog"
            aria-modal="true"
            aria-label={`${game.title} quick view`}
            initial={{ opacity: 0, y: 35, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="premium-panel relative grid max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg md:grid-cols-[42%_1fr] border border-white/[0.08] hover:border-purple-500/20 hover:shadow-[0_0_50px_rgba(139,92,246,0.15)] transition-all duration-500"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/65 backdrop-blur hover:scale-110 hover:bg-black/85 active:scale-95 transition-all duration-200"
              aria-label="Close quick view"
            >
              <X size={18} />
            </button>
            <div className="relative min-h-[320px] md:min-h-[520px]">
              <Image
                src={assetUrl(game.cover_image)}
                alt={game.title}
                fill
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-7 md:p-10">
              <p className="eyebrow">Quick view</p>
              <h2 className="mt-3 text-3xl font-black md:text-4xl">{game.title}</h2>
              <p className="mt-4 line-clamp-2 leading-7 text-[#a0a8c0]">{game.description || game.tagline}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {availablePlatforms(game).map((platform) => (
                  <span key={platform} className="rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold">
                    {game.is_subscription ? (game.duration ? `${platform} (${game.duration})` : (platform === "Steam" ? "1 Month" : platform === "Epic" ? "3 Months" : "12 Months")) : platform}
                  </span>
                ))}
              </div>

              {/* Polished Minimalist Coupon Input Field in Dialog Quick View */}
              <div className="mt-6 border-t border-white/[0.08] pt-4">
                <label htmlFor="quickview-coupon-input" className="mb-2 flex items-center gap-2 text-xs font-bold text-[#8991a8]">
                  <TicketPercent size={14} className="text-[#facc15]" /> Apply Loyalty Coupon
                </label>
                <div className="flex gap-2">
                  <input
                    id="quickview-coupon-input"
                    name="coupon_code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="DIAMONDFREE"
                    className="h-10 min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-3 text-xs uppercase outline-none focus:border-[#8b5cf6] text-white"
                  />
                  <button
                    type="button"
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
                      <button
                        type="button"
                        onClick={() => {
                          setCoupon(null);
                          setCouponCode("");
                        }}
                        className="underline hover:text-white transition-colors"
                      >
                        Remove
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-6 flex items-end justify-between border-t border-white/[0.08] pt-5">
                <div>
                  <span className="text-xs font-medium text-[#8991a8]">Current price</span>
                  <div className="flex items-baseline gap-2.5 mt-1">
                    <AnimatePresence mode="wait">
                      {couponSavings > 0 ? (
                        <motion.div
                          key="discounted"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="flex items-baseline gap-2.5"
                        >
                          <del className="text-sm font-medium text-[#8991a8] line-through decoration-red-500 decoration-2 select-none">{formatPrice(lowest)}</del>
                          <strong className="block text-3xl font-black text-[#70efbb] tracking-tight">{formatPrice(discountedPrice)}</strong>
                        </motion.div>
                      ) : (
                        <motion.strong
                          key="regular"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="block text-3xl font-black text-white tracking-tight"
                        >
                          {formatPrice(lowest)}
                        </motion.strong>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-[1fr_auto] gap-2">
                <button
                  onClick={(e) => {
                    triggerFlyToCart(assetUrl(game.cover_image), e.currentTarget);
                    add(game, availablePlatforms(game)[0] ?? "Steam");
                    toast.success(`${game.title} added to cart`);
                  }}
                  className="btn btn-primary"
                >
                  <ShoppingBag size={17} /> Add to cart
                </button>
                <button
                  onClick={() => {
                    toggle(game.id);
                    toast(isSaved ? "Removed from wishlist" : "Saved to wishlist");
                  }}
                  className="btn btn-secondary btn-icon"
                  aria-label="Save to wishlist"
                >
                  <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                </button>
              </div>
              <Link href={`/games/${game.id}`} className="mt-3 text-center text-sm font-semibold text-[#f6dc73]">
                Open full game page
              </Link>
            </div>
            <Confetti active={celebrate} onComplete={() => setCelebrate(false)} />
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

