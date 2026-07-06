"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import type { Game } from "@/types/store";

export function BundleAddonMatrix({ games, excludeId }: { games: Game[]; excludeId?: number }) {
  const add = useCartStore((state) => state.add);
  const remove = useCartStore((state) => state.remove);
  const lines = useCartStore((state) => state.lines);
  const coupon = useCartStore((state) => state.coupon);
  const setCoupon = useCartStore((state) => state.setCoupon);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);

  // Synchronize selectedAddons state with the store lines on mount or when lines change
  useEffect(() => {
    if (games.length > 0) {
      const mainGameId = lines[0]?.game?.id;
      const inCartAddons = lines
        .filter((l) => l.game.id != mainGameId && l.platform === "Steam")
        .map((l) => Number(l.game.id));

      if (selectedAddons.length === 0 && inCartAddons.length > 0) {
        setSelectedAddons(inCartAddons);
      }
    }
  }, [games, lines, selectedAddons.length]);

  const filteredGames = games
    .filter((g) => g.id !== excludeId && (!lines.some((l) => l.game.id == g.id) || selectedAddons.includes(g.id)))
    .slice(0, 6);

  if (filteredGames.length < 3) return null;

  return (
    <div className="mt-8 rounded-lg border border-dashed border-[#8b5cf6]/20 bg-[#0c0a1a]/80 p-5 shadow-[0_12px_36px_rgba(0,0,0,0.3)]">
      <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">
        Want to select 3 more games to unlock your bundle offer?
      </h3>
      <p className="text-xs text-[#8991a6] mb-4">
        Select exactly 3 games to complete your milestone bundle and get 10% off the entire cart!
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {filteredGames.map((g) => {
          const isChecked = selectedAddons.includes(g.id);
          const priceValue = g.steam_price || g.sale_price || 0;
          return (
            <label
              key={g.id}
              htmlFor={`addon-checkbox-${g.id}`}
              className={`flex items-center gap-3 rounded-md border p-3.5 cursor-pointer transition duration-300 ${
                isChecked
                  ? "border-[#facc15] bg-[#b89412]/10 shadow-[0_0_15px_rgba(250,204,21,0.15)]"
                  : "border-white/5 bg-black/30 hover:border-white/10"
              }`}
            >
              <input
                id={`addon-checkbox-${g.id}`}
                name={`addon_checkbox_${g.id}`}
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  let next = [...selectedAddons];
                  if (e.target.checked) {
                    if (next.length < 3) {
                      next.push(g.id);
                      add(g, "Steam");
                    } else {
                      toast.error("You can select up to 3 add-on games");
                    }
                  } else {
                    next = next.filter((id) => id !== g.id);
                    remove(g.id, "Steam");
                  }
                  setSelectedAddons(next);

                  if (next.length === 3) {
                    const hasLowPricedGame = next.some((id) => {
                      const addonGame = games.find((item) => item.id === id);
                      if (!addonGame) return false;
                      const priceValue = Number(addonGame.steam_price || addonGame.sale_price || 0);
                      return priceValue <= 99;
                    });
                    if (hasLowPricedGame) {
                      toast.error("General coupons like RAKETHREE cannot be applied if any selected game is Rs. 99 or less.");
                    } else {
                      setCoupon({
                        code: "RAKETHREE",
                        discount_type: "percentage",
                        discount_value: 10,
                        minimum_order: 0,
                      });
                      toast.success("Milestone bundle completed! RAKETHREE coupon injected.");
                    }
                  } else {
                    if (coupon?.code === "RAKETHREE") {
                      setCoupon(null);
                    }
                  }
                }}
                className="rounded text-[#facc15] focus:ring-0"
              />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-black text-white">{g.title}</span>
                <span className="block text-[11px] text-[#facc15] font-semibold mt-0.5">
                  {formatPrice(Number(priceValue))}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
