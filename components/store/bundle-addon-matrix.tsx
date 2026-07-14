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

  const mainGamesCount = lines.filter((l) => !selectedAddons.includes(Number(l.game.id))).length;
  const needed = Math.max(0, 3 - mainGamesCount - selectedAddons.length);

  return (
    <div className="mt-8 rounded-lg border border-dashed border-[#8b5cf6]/20 bg-[#0c0a1a]/80 p-5 shadow-[0_12px_36px_rgba(0,0,0,0.3)]">
      <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">
        {needed > 0
          ? `Want to select ${needed} more ${needed === 1 ? "game" : "games"} to unlock your bundle offer?`
          : "Milestone bundle offer unlocked!"}
      </h3>
      <p className="text-xs text-[#8991a6] mb-4">
        {needed > 0
          ? `Select exactly ${needed} more ${needed === 1 ? "game" : "games"} to complete your milestone bundle and get 10% off the entire cart!`
          : "You are now eligible to apply the RAKETHREE coupon code for 10% off the entire cart!"}
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
                    next.push(g.id);
                    add(g, "Steam");
                  } else {
                    next = next.filter((id) => id !== g.id);
                    remove(g.id, "Steam");
                  }
                  setSelectedAddons(next);

                  // Calculate the total games that will be in the cart after this change
                  const cartGames = [
                    ...lines
                      .filter((l) => !selectedAddons.includes(Number(l.game.id)) && Number(l.game.id) !== g.id)
                      .map((l) => l.game),
                    ...next.map((id) => games.find((item) => item.id === id)).filter(Boolean) as Game[],
                  ];
                  const totalGamesInCart = cartGames.length;

                  if (totalGamesInCart >= 3) {
                    toast.dismiss();
                    toast.success("Milestone bundle completed! You can now apply the RAKETHREE coupon code.");
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
