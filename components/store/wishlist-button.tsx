"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store";

type WishlistButtonProps = {
  gameId: number;
  size?: number;
  className?: string;
  variant?: "default" | "card" | "details";
};

type FloatingHeart = {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export function WishlistButton({
  gameId,
  size = 20,
  className = "",
  variant = "default",
}: WishlistButtonProps) {
  const toggleWishlist = useCartStore((state) => state.toggleWishlist);
  const wishlistIds = useCartStore((state) => state.wishlistIds || []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSaved = mounted && (wishlistIds || []).includes(gameId);

  const [particles, setParticles] = useState<FloatingHeart[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newSaved = !isSaved;
    toggleWishlist(gameId);
    toast(newSaved ? "Saved to wishlist ❤️" : "Removed from wishlist");

    if (newSaved) {
      setIsAnimating(true);
      const newParticles: FloatingHeart[] = Array.from({ length: 7 }).map((_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 50,
        y: -35 - Math.random() * 40,
        scale: 0.5 + Math.random() * 0.6,
        rotation: (Math.random() - 0.5) * 45,
      }));
      setParticles(newParticles);

      setTimeout(() => {
        setIsAnimating(false);
        setParticles([]);
      }, 950);
    }
  };

  const getContainerStyle = () => {
    if (variant === "details") {
      return "relative grid h-11 w-11 place-items-center rounded-md bg-white/[.07] border border-white/10 hover:bg-white/15 active:scale-95 transition-all overflow-visible shadow-md cursor-pointer select-none";
    }
    if (variant === "card") {
      return "relative flex h-8 w-8 min-h-0 min-w-0 shrink-0 aspect-square items-center justify-center rounded-full border border-white/15 bg-black/75 backdrop-blur-md hover:scale-110 hover:border-white/40 hover:bg-black/90 active:scale-90 transition-all duration-200 overflow-visible cursor-pointer select-none";
    }
    return `relative flex items-center justify-center transition-all overflow-visible cursor-pointer select-none ${className}`;
  };

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={handleToggle}
      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
      className={`${getContainerStyle()} ${variant === "default" ? className : ""}`}
    >
      {/* Shockwave Aura Ring Animation on Wishlist Add */}
      <AnimatePresence>
        {isAnimating && (
          <motion.span
            key="ring"
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-red-500 bg-red-500/20"
          />
        )}
      </AnimatePresence>

      {/* Floating Pop-up Hearts Burst */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.4, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              x: p.x,
              y: p.y,
              scale: p.scale,
              rotate: p.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.85)]"
            style={{ zIndex: 50 }}
          >
            <Heart size={size * 0.75} fill="currentColor" />
          </motion.span>
        ))}
      </AnimatePresence>

      {/* Main Animated Heart Icon */}
      <motion.div
        animate={
          isAnimating
            ? {
                scale: [1, 1.45, 0.85, 1.2, 1],
                rotate: [0, -14, 14, -7, 0],
              }
            : isSaved
            ? { scale: [1, 1.15, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="relative flex items-center justify-center"
      >
        <Heart
          size={size}
          fill={isSaved ? "#ef4444" : "none"}
          className={`transition-colors duration-300 ${
            isSaved
              ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]"
              : "text-white/80 hover:text-white"
          }`}
        />
      </motion.div>
    </button>
  );
}
