"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cart-store";
import type { Bundle, BundleCartLine, CartLine, Game, Platform } from "@/types/store";

type CloudCartRow = { variant_type: Platform; quantity: number; games: Game | Game[] | null };
type CloudBundleRow = { quantity: number; bundles: Bundle | Bundle[] | null };
const one = <T,>(value: T | T[] | null) => Array.isArray(value) ? value[0] : value;

export function StoreCloudSync() {
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;
    let warned = false;
    const supabase = createClient();

    async function persist() {
      const state = useCartStore.getState();
      
      const items = (state.lines || [])
        .filter((line) => line?.game && (line.game.id || line.game.id === 0))
        .map((line) => ({ 
          game_id: Number(line.game.id), 
          platform: line.platform || "Steam", 
          quantity: line.quantity || 1 
        }));
        
      const bundles = (state.bundleLines || [])
        .filter((line) => line?.bundle && (line.bundle.id || line.bundle.id === 0))
        .map((line) => ({ 
          bundle_id: Number(line.bundle.id), 
          quantity: line.quantity || 1 
        }));
        
      const wishlist = (state.wishlistIds || []).filter((id) => id !== null && id !== undefined).map(Number);

      const { error } = await supabase.rpc("sync_customer_store_state", {
        p_items: items,
        p_bundles: bundles,
        p_wishlist: wishlist,
      });
      if (error && !warned) { 
        warned = true; 
        console.warn("Account sync paused:", error.message);
      }
      if (!error) warned = false;
    }

    async function start() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      const [{ data: cartRows, error: cartError }, { data: bundleRows, error: bundleError }, { data: wishlistRows, error: wishlistError }] = await Promise.all([
        supabase.from("cart_items").select("variant_type,quantity,games(*)").eq("user_id", user.id),
        supabase.from("cart_bundles").select("quantity,bundles(*,bundle_games(games(id,title)))").eq("user_id", user.id),
        supabase.from("wishlist").select("game_id").eq("user_id", user.id),
      ]);
      if (!active) return;
      if (cartError || bundleError || wishlistError) { 
        console.warn("Could not load your synced cart and wishlist."); 
        return; 
      }
      const local = useCartStore.getState();
      const cloudLines = ((cartRows ?? []) as unknown as CloudCartRow[]).flatMap((row) => { 
        const game = one(row.games); 
        if (!game || (!game.id && game.id !== 0)) return [];
        const normalizedGame: Game = {
          ...game,
          id: Number(game.id),
          title: game.title || "Unknown Game",
          steam_price: game.steam_price ?? game.sale_price ?? 0,
          epic_price: game.epic_price ?? game.sale_price ?? 0,
          offline_price: game.offline_price ?? 0,
          online_price: game.online_price ?? 0,
          xbox_price: game.xbox_price ?? 0,
          geforce_price: game.geforce_price ?? 0,
          duration: game.duration ?? null,
          sale_price: game.sale_price ?? 0
        };
        return [{ game: normalizedGame, platform: row.variant_type || "Steam", quantity: row.quantity || 1 } satisfies CartLine]; 
      });
      const cloudBundles = ((bundleRows ?? []) as unknown as CloudBundleRow[]).flatMap((row) => { 
        const bundle = one(row.bundles); 
        if (!bundle || (!bundle.id && bundle.id !== 0)) return [];
        return [{ bundle, quantity: row.quantity || 1 } satisfies BundleCartLine]; 
      });
      const lineMap = new Map(local.lines.map((line) => [`${line.game.id}:${line.platform}`, line]));
      cloudLines.forEach((line) => lineMap.set(`${line.game.id}:${line.platform}`, line));
      const bundleMap = new Map(local.bundleLines.map((line) => [line.bundle.id, line]));
      cloudBundles.forEach((line) => bundleMap.set(line.bundle.id, line));
      const wishlistIds = [...new Set([...local.wishlistIds, ...(wishlistRows ?? []).map((row) => Number(row.game_id))])];
      local.replaceFromCloud([...lineMap.values()], [...bundleMap.values()], wishlistIds);
      await persist();
      unsubscribe = useCartStore.subscribe(() => { if (timer) clearTimeout(timer); timer = setTimeout(() => void persist(), 700); });
    }

    void start();
    return () => { active = false; if (timer) clearTimeout(timer); unsubscribe?.(); };
  }, []);
  return null;
}
