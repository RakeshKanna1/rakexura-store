"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Minus, Package, Plus, ShieldCheck, TicketPercent, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { createClient } from "@/lib/supabase/client";
import { assetUrl, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

function linePrice(line: ReturnType<typeof useCartStore.getState>["lines"][number]) {
  const { game, platform } = line;
  if (platform === "Epic") return Number(game.epic_price ?? game.sale_price ?? 0);
  if (platform === "Offline") return Number(game.offline_price ?? 0);
  if (platform === "Online") return Number(game.online_price ?? 0);
  if (platform === "Xbox") return Number(game.xbox_price ?? 0);
  if (platform === "Nvidia GeForce") return Number(game.geforce_price ?? 0);
  return Number(game.steam_price ?? game.sale_price ?? 0);
}

function Quantity({ value, decrease, increase }: { value: number; decrease: () => void; increase: () => void }) {
  return <div className="mt-3 inline-grid grid-cols-[34px_38px_34px] items-center overflow-hidden rounded-md border border-white/10 bg-black/20"><button onClick={decrease} disabled={value <= 1} className="grid h-9 place-items-center disabled:opacity-30" aria-label="Decrease quantity"><Minus size={14} /></button><span className="text-center text-sm font-bold">{value}</span><button onClick={increase} disabled={value >= 5} className="grid h-9 place-items-center disabled:opacity-30" aria-label="Increase quantity"><Plus size={14} /></button></div>;
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

export function CartView() {
  const lines = useCartStore((state) => state.lines);
  const bundles = useCartStore((state) => state.bundleLines);
  const remove = useCartStore((state) => state.remove);
  const removeBundle = useCartStore((state) => state.removeBundle);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const setBundleQuantity = useCartStore((state) => state.setBundleQuantity);
  const coupon = useCartStore((state) => state.coupon);
  const setCoupon = useCartStore((state) => state.setCoupon);
  const [code, setCode] = useState(coupon?.code ?? "");
  const [checking, setChecking] = useState(false);

  const subtotal = lines.reduce((sum, line) => sum + linePrice(line) * line.quantity, 0) + bundles.reduce((sum, line) => sum + Number(line.bundle.bundle_price) * line.quantity, 0);
  const catalogSavings = lines.reduce((sum, line) => sum + Math.max(0, Number(line.game.original_price ?? linePrice(line)) - linePrice(line)) * line.quantity, 0) + bundles.reduce((sum, line) => sum + Math.max(0, Number(line.bundle.original_price) - Number(line.bundle.bundle_price)) * line.quantity, 0);
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0) + bundles.reduce((sum, line) => sum + line.quantity, 0);
  const couponEligible = coupon && subtotal >= coupon.minimum_order && (coupon.code !== "RAKE10" || quantity >= 3);
  const couponSavings = couponEligible ? Math.min(subtotal, coupon.discount_type === "percentage" ? subtotal * coupon.discount_value / 100 : coupon.discount_value) : 0;
  const total = Math.max(0, subtotal - couponSavings);
  const gamesNeeded = Math.max(0, 3 - quantity);

  async function checkCoupon() {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return toast.error("Enter a coupon code");
    
    setChecking(true);
    const supabase = createClient();
    
    // 1. DIAMOND FREEBIE check
    if (normalized === "DIAMONDFREE" || normalized === "DIAMOND-FREEBIE") {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setChecking(false);
        return toast.error("Sign in to redeem Diamond loyalty perks");
      }
      const { data: reward } = await supabase.from("user_rewards").select("points").eq("user_id", user.id).maybeSingle();
      if ((reward?.points ?? 0) < 3000) {
        setChecking(false);
        return toast.error("Diamond loyalty freebies require Diamond rank (3,000+ points).");
      }
      setCoupon({ code: "DIAMONDFREE", discount_type: "percentage", discount_value: 100, minimum_order: 0 });
      setChecking(false);
      return toast.success("Diamond rank freebie applied! Total is Rs. 0.");
    }

    // 2. Milestone Loyalty Coupon check
    const isMilestoneCoupon = normalized.startsWith("MILE") || normalized.startsWith("LOYAL") || normalized.startsWith("STAGE") || normalized.startsWith("PLAT");
    if (isMilestoneCoupon) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setChecking(false);
        return toast.error("Sign in to apply milestone loyalty coupons");
      }
      const { count } = await supabase.from("customer_library").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      if ((count ?? 0) < 3) {
        setChecking(false);
        return toast.error("Unlock milestone coupons by purchasing 3 or more games on your account profile.");
      }
    }

    if (normalized === "RAKE10" && quantity < 3) {
      setChecking(false);
      return toast.error(`Add ${3 - quantity} more ${3 - quantity === 1 ? "game" : "games"} to use RAKE10`);
    }

    if (normalized === "RAKETHREE" && quantity < 3) {
      setChecking(false);
      return toast.error("This code requires a minimum selection of 3 games to unlock your 10% discount.");
    }

    const { data, error } = await supabase.from("coupons").select("id,code,discount_type,discount_value,minimum_order,starts_at,expires_at,active,usage_limit,per_user_limit").eq("code", normalized).eq("active", true).maybeSingle();
    setChecking(false);
    if (error || !data || (data.expires_at && new Date(data.expires_at) <= new Date()) || (data.starts_at && new Date(data.starts_at) > new Date())) { setCoupon(null); return toast.error("This coupon is not active"); }

    if (data.usage_limit !== null) {
      const { count: globalUses } = await supabase
        .from("coupon_usage")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", data.id);
      if ((globalUses ?? 0) >= data.usage_limit) {
        setCoupon(null);
        return toast.error("This coupon code has reached its global usage limit.");
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { count } = await supabase
        .from("coupon_usage")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("coupon_id", data.id);
      const userLimit = data.per_user_limit ?? 1;
      if (count && count >= userLimit) {
        setCoupon(null);
        return toast.error(`You have already redeemed this coupon the maximum allowed ${userLimit} time(s).`);
      }
    }

    if (subtotal < Number(data.minimum_order ?? 0)) return toast.error(`Minimum order is ${formatPrice(Number(data.minimum_order))}`);
    setCoupon({ code: data.code, discount_type: data.discount_type, discount_value: Number(data.discount_value), minimum_order: Number(data.minimum_order ?? 0) });
    toast.success("Coupon applied");
  }

  if (!lines.length && !bundles.length) return <EmptyState icon={Heart} title="Your cart is waiting" description="Add a game or combo bundle. Your cart stays available on this device and syncs when you sign in." href="/games" action="Browse games" />;

  return (
    <>
      <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-7 pb-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-0">
        <div className="grid w-full min-w-0 content-start gap-3">
          {bundles.map((line) => (
            <article
              key={`bundle-${line.bundle.id}`}
              className="relative flex w-full gap-4 rounded-md border border-[#8b5cf6]/20 bg-[#8b5cf6]/[.04] p-4"
            >
              <div className="relative h-24 w-[76px] shrink-0 overflow-hidden rounded-sm sm:h-28 sm:w-[88px]">
                <Image
                  src={assetUrl(line.bundle.cover_image)}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 pr-10">
                <Link href={`/bundles/${line.bundle.id}`} className="line-clamp-2 font-bold hover:underline pr-4">
                  {line.bundle.title}
                </Link>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[#c8baff]">
                  <Package size={14} /> Combo bundle
                </p>
                <strong className="mt-3 block text-[#facc15]">{formatPrice(Number(line.bundle.bundle_price) * line.quantity)}</strong>
                <Quantity
                  value={line.quantity}
                  decrease={() => setBundleQuantity(line.bundle.id, line.quantity - 1)}
                  increase={() => setBundleQuantity(line.bundle.id, line.quantity + 1)}
                />
              </div>
              <button
                onClick={() => removeBundle(line.bundle.id)}
                className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/40 text-[#a0a8c0] transition hover:bg-white/10 hover:text-white cursor-pointer"
                aria-label={`Remove ${line.bundle.title}`}
              >
                <Trash2 size={15} />
              </button>
            </article>
          ))}

          {lines.map((line) => (
            <article
              key={`${line.game.id}-${line.platform}`}
              className="relative flex w-full gap-4 rounded-md border border-white/[.08] bg-[#0b0f19] p-4"
            >
              <div className="relative h-24 w-[76px] shrink-0 overflow-hidden rounded-sm sm:h-28 sm:w-[88px]">
                <Image
                  src={assetUrl(line.game.cover_image)}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 pr-10">
                <Link href={`/games/${line.game.id}`} className="line-clamp-2 font-bold hover:underline pr-4">
                  {line.game.title}
                </Link>
                <p className="mt-2 text-xs text-[#8991a6]">
                  {getPlatformLabel(line.platform, line.game.is_subscription, line.game.duration)} · Digital delivery
                </p>
                <strong className="mt-3 block text-[#facc15]">{formatPrice(linePrice(line) * line.quantity)}</strong>
                <Quantity
                  value={line.quantity}
                  decrease={() => setQuantity(line.game.id, line.platform, line.quantity - 1)}
                  increase={() => setQuantity(line.game.id, line.platform, line.quantity + 1)}
                />
              </div>
              <button
                onClick={() => remove(line.game.id, line.platform)}
                className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/40 text-[#a0a8c0] transition hover:bg-white/10 hover:text-white cursor-pointer"
                aria-label={`Remove ${line.game.title}`}
              >
                <Trash2 size={15} />
              </button>
            </article>
          ))}
        </div>

        <aside className="glass h-fit w-full rounded-md p-4 sm:p-6 lg:sticky lg:top-24">
          <h2 className="mt-0">Order summary</h2>
          <div className="mt-5 rounded-md border border-white/[.08] bg-black/20 p-3">
            <label className="mb-2 flex items-center gap-2 text-xs font-bold text-[#a0a8c0]">
              <TicketPercent size={15} /> Coupon code
            </label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="RAKE10"
                aria-label="Coupon code"
                className="h-11 min-w-0 flex-1 rounded-md border border-white/10 bg-white/[.04] px-3 text-sm uppercase outline-none focus:border-[#8b5cf6]"
              />
              <button
                onClick={checkCoupon}
                disabled={checking}
                className="btn btn-secondary h-11 min-h-11 px-3 text-xs"
              >
                {checking ? "Checking..." : "Apply"}
              </button>
            </div>
            <p className={`mt-3 text-xs leading-5 ${gamesNeeded ? "text-[#a7aec0]" : "text-[#70efbb]"}`}>
              {gamesNeeded
                ? `Add ${gamesNeeded} more ${gamesNeeded === 1 ? "game" : "games"} to unlock the 3-game coupon offer.`
                : "Your cart has 3+ games. Try coupon RAKE10."}
            </p>
            {coupon && (
              <div className="mt-2 flex items-center justify-between text-xs text-[#70efbb]">
                <span>{coupon.code} applied</span>
                <button
                  onClick={() => {
                    setCoupon(null);
                    setCode("");
                  }}
                  className="min-h-10 underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-[#a0a8c0]">
              <span>{quantity} games</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {catalogSavings > 0 && (
              <div className="flex justify-between text-[#70efbb]">
                <span>Catalog savings</span>
                <span>{formatPrice(catalogSavings)}</span>
              </div>
            )}
            {couponSavings > 0 && (
              <div className="flex justify-between text-[#70efbb]">
                <span>Coupon savings</span>
                <span>-{formatPrice(couponSavings)}</span>
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-between border-t border-white/10 pt-5 text-xl font-black">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Link
            href="/checkout"
            className="btn btn-primary mt-6 w-full"
          >
            Checkout <ArrowRight size={17} />
          </Link>
          <p className="mt-5 flex gap-2 text-xs leading-5 text-[#8991a6]">
            <ShieldCheck
              size={16}
              className="shrink-0"
            />{" "}
            Secure payment review. Final prices are verified when the order is created.
          </p>
        </aside>
      </div>
    </>
  );;
}
