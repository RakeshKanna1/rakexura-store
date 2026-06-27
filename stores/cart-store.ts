"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Bundle, BundleCartLine, CartLine, Game, Platform } from "@/types/store";

type CartState = {
  lines: CartLine[];
  bundleLines: BundleCartLine[];
  wishlistIds: number[];
  coupon: { code: string; discount_type: "percentage" | "flat"; discount_value: number; minimum_order: number } | null;
  drawerOpen: boolean;
  add: (game: Game, platform: Platform) => void;
  addBundle: (bundle: Bundle) => void;
  setQuantity: (gameId: number, platform: Platform, quantity: number) => void;
  setBundleQuantity: (bundleId: number, quantity: number) => void;
  remove: (gameId: number, platform: Platform) => void;
  removeBundle: (bundleId: number) => void;
  clear: () => void;
  resetUserData: () => void;
  toggleWishlist: (gameId: number) => void;
  replaceFromCloud: (lines: CartLine[], bundleLines: BundleCartLine[], wishlistIds: number[]) => void;
  setCoupon: (coupon: CartState["coupon"]) => void;
  setDrawerOpen: (open: boolean) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      bundleLines: [],
      wishlistIds: [],
      coupon: null,
      drawerOpen: false,
      add: (game, platform) => set((state) => {
        const exists = state.lines.some((line) => line.game.id === game.id && line.platform === platform);
        return exists ? state : { lines: [...state.lines, { game, platform, quantity: 1 }] };
      }),
      addBundle: (bundle) => set((state) => state.bundleLines.some((line) => line.bundle.id === bundle.id) ? state : { bundleLines: [...state.bundleLines, { bundle, quantity: 1 }] }),
      setQuantity: (gameId, platform, quantity) => set((state) => ({ lines: state.lines.map((line) => line.game.id === gameId && line.platform === platform ? { ...line, quantity: Math.max(1, Math.min(5, quantity)) } : line) })),
      setBundleQuantity: (bundleId, quantity) => set((state) => ({ bundleLines: state.bundleLines.map((line) => line.bundle.id === bundleId ? { ...line, quantity: Math.max(1, Math.min(5, quantity)) } : line) })),
      remove: (gameId, platform) => set((state) => ({
        lines: state.lines.filter((line) => line.game.id !== gameId || line.platform !== platform),
      })),
      removeBundle: (bundleId) => set((state) => ({ bundleLines: state.bundleLines.filter((line) => line.bundle.id !== bundleId) })),
      clear: () => set({ lines: [], bundleLines: [] }),
      resetUserData: () => set({ lines: [], bundleLines: [], wishlistIds: [], coupon: null, drawerOpen: false }),
      toggleWishlist: (gameId) => set((state) => ({
        wishlistIds: state.wishlistIds.includes(gameId)
          ? state.wishlistIds.filter((id) => id !== gameId)
          : [...state.wishlistIds, gameId],
      })),
      replaceFromCloud: (lines, bundleLines, wishlistIds) => set({ lines, bundleLines, wishlistIds }),
      setCoupon: (coupon) => set({ coupon }),
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
    }),
    { name: "rakexura-store", partialize: (state) => ({ lines: state.lines, bundleLines: state.bundleLines, wishlistIds: state.wishlistIds, coupon: state.coupon }) },
  ),
);
