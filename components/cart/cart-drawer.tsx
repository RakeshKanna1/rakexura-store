"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Minus, Package, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { assetUrl, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { DustDisintegration } from "@/components/common/dust-disintegration";

function price(line: ReturnType<typeof useCartStore.getState>["lines"][number]) {
  const p = line.platform;
  const g = line.game;
  if (p === "Epic") return Number(g.epic_price ?? g.sale_price ?? 0);
  if (p === "Offline") return Number(g.offline_price ?? 0);
  if (p === "Online") return Number(g.online_price ?? 0);
  if (p === "Xbox") return Number(g.xbox_price ?? 0);
  if (p === "Nvidia GeForce") return Number(g.geforce_price ?? 0);
  return Number(g.steam_price ?? g.sale_price ?? 0);
}

function Stepper({ value, down, up }: { value: number; down: () => void; up: () => void }) { 
  return (
    <div className="mt-2 inline-grid grid-cols-[28px_30px_28px] overflow-hidden rounded border border-white/10">
      <button onClick={down} disabled={value <= 1} className="grid h-8 place-items-center disabled:opacity-30 cursor-pointer" aria-label="Decrease quantity">
        <Minus size={12} />
      </button>
      <span className="grid place-items-center text-xs font-bold">{value}</span>
      <button onClick={up} disabled={value >= 5} className="grid h-8 place-items-center disabled:opacity-30 cursor-pointer" aria-label="Increase quantity">
        <Plus size={12} />
      </button>
    </div>
  ); 
}

function getPlatformLabel(platform: string, isSubscription?: boolean | null, duration?: string | null) {
  if (isSubscription) {
    if (duration) return `${platform} (${duration})`;
    if (platform === "Steam") return "1 Month";
    if (platform === "Epic") return "3 Months";
    if (platform === "Offline") return "12 Months";
  }
  return platform;
}

export function CartDrawer() {
  const open = useCartStore((state) => state.drawerOpen);
  const close = useCartStore((state) => state.setDrawerOpen);
  const lines = useCartStore((state) => state.lines);
  const bundles = useCartStore((state) => state.bundleLines);
  const remove = useCartStore((state) => state.remove);
  const removeBundle = useCartStore((state) => state.removeBundle);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const setBundleQuantity = useCartStore((state) => state.setBundleQuantity);
  const total = lines.reduce((sum, line) => sum + price(line) * line.quantity, 0) + bundles.reduce((sum, line) => sum + Number(line.bundle.bundle_price) * line.quantity, 0);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0) + bundles.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button 
            aria-label="Close cart" 
            onClick={() => close(false)} 
            className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
          />
          <motion.aside 
            role="dialog" 
            aria-modal="true" 
            aria-label="Shopping cart" 
            initial={{ x: "100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "100%" }} 
            transition={{ type: "spring", stiffness: 260, damping: 28 }} 
            className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col border-l border-white/10 bg-[#080b13] shadow-2xl"
          >
            <header className="flex h-18 items-center justify-between border-b border-white/[.08] px-5">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} />
                <strong>Your cart ({count})</strong>
              </div>
              <button onClick={() => close(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/[.05] cursor-pointer" aria-label="Close cart">
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {bundles.map((line) => (
                <DustDisintegration key={`bundle-${line.bundle.id}`} onRemove={() => removeBundle(line.bundle.id)}>
                  {(triggerRemove: () => void) => (
                    <article className="grid grid-cols-[66px_1fr_auto] gap-3 rounded-md border border-[#8b5cf6]/20 bg-[#8b5cf6]/[.04] p-3">
                      <div className="relative h-20 w-[62px] overflow-hidden rounded-sm">
                        <Image src={assetUrl(line.bundle.cover_image)} alt="" fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong className="line-clamp-1 text-sm">{line.bundle.title}</strong>
                        <span className="mt-1 flex items-center gap-1 text-xs text-[#c8baff]">
                          <Package size={12} /> Bundle
                        </span>
                        <b className="mt-2 block text-sm">{formatPrice(Number(line.bundle.bundle_price) * line.quantity)}</b>
                        <Stepper value={line.quantity} down={() => setBundleQuantity(line.bundle.id, line.quantity - 1)} up={() => setBundleQuantity(line.bundle.id, line.quantity + 1)} />
                      </div>
                      <button onClick={triggerRemove} className="grid h-9 w-9 place-items-center rounded-md text-[#8991a6] hover:bg-white/[.06] hover:text-[#ff7373] cursor-pointer" aria-label={`Remove ${line.bundle.title}`}>
                        <Trash2 size={16} />
                      </button>
                    </article>
                  )}
                </DustDisintegration>
              ))}

              {lines.map((line) => (
                <DustDisintegration key={`${line.game.id}-${line.platform}`} onRemove={() => remove(line.game.id, line.platform)}>
                  {(triggerRemove: () => void) => (
                    <article className="grid grid-cols-[66px_1fr_auto] gap-3 rounded-md border border-white/[.07] bg-white/[0.03] p-3">
                      <Image src={assetUrl(line.game.cover_image)} alt="" width={66} height={84} className="h-20 w-[62px] rounded-sm object-cover" />
                      <div className="min-w-0">
                        <strong className="line-clamp-1 text-sm">{line.game.title}</strong>
                        <span className="mt-1 block text-xs text-[#8991a6]">
                          {getPlatformLabel(line.platform, line.game.is_subscription, line.game.duration)}
                        </span>
                        <b className="mt-2 block text-sm">{formatPrice(price(line) * line.quantity)}</b>
                        <Stepper value={line.quantity} down={() => setQuantity(line.game.id, line.platform, line.quantity - 1)} up={() => setQuantity(line.game.id, line.platform, line.quantity + 1)} />
                      </div>
                      <button onClick={triggerRemove} className="grid h-9 w-9 place-items-center rounded-md text-[#8991a6] hover:bg-white/[.06] hover:text-[#ff7373] cursor-pointer" aria-label={`Remove ${line.game.title}`}>
                        <Trash2 size={16} />
                      </button>
                    </article>
                  )}
                </DustDisintegration>
              ))}

              {!count && (
                <div className="grid min-h-64 place-items-center text-center">
                  <div>
                    <ShoppingBag className="mx-auto text-[#596176]" />
                    <p className="mt-3 font-bold">Your cart is empty</p>
                    <span className="mt-1 block text-sm text-[#8991a6]">Add a game or combo to get started.</span>
                  </div>
                </div>
              )}
            </div>

            <footer className="border-t border-white/[.08] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-[#8991a6]">Subtotal</span>
                <strong className="text-xl">{formatPrice(total)}</strong>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/cart" onClick={() => close(false)} className="btn btn-secondary">View cart</Link>
                <Link href="/checkout" onClick={() => close(false)} className={`btn btn-primary ${!count ? "pointer-events-none opacity-50" : ""}`}>Checkout</Link>
              </div>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
