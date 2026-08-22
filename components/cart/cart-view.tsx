"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Package, Plus, ShieldCheck, ShoppingBag, TicketPercent, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { assetUrl, calculateResellerPrice, formatPrice, gameUrl } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { ResellerIcon } from "@/components/ui/reseller-badge";

function linePrice(line: ReturnType<typeof useCartStore.getState>["lines"][number]) {
  const { game, platform } = line;
  if (platform === "1 Month") return Number(game.price_1m ?? game.xbox_price ?? game.steam_price ?? game.sale_price ?? 0);
  if (platform === "2 Months") return Number(game.price_2m ?? 0);
  if (platform === "3 Months") return Number(game.price_3m ?? 0);
  if (platform === "6 Months") return Number(game.price_6m ?? 0);
  if (platform === "12 Months") return Number(game.price_12m ?? 0);
  if (platform === "Epic") return Number(game.epic_price ?? game.sale_price ?? 0);
  if (platform === "Offline") return Number(game.offline_price ?? 0);
  if (platform === "Online") return Number(game.online_price ?? 0);
  if (platform === "Xbox") return Number(game.xbox_price ?? 0);
  if (platform === "Nvidia GeForce") return Number(game.geforce_price ?? 0);
  return Number(game.steam_price ?? game.sale_price ?? 0);
}

function Quantity({ value, decrease, increase }: { value: number; decrease: () => void; increase: () => void }) {
  return <div className="mt-3 inline-grid grid-cols-[34px_38px_34px] items-center overflow-hidden rounded-md border border-white/10 bg-black/20"><button onClick={decrease} disabled={value <= 1} className="grid h-9 place-items-center disabled:opacity-30 cursor-pointer" aria-label="Decrease quantity"><Minus size={14} /></button><span className="text-center text-sm font-bold">{value}</span><button onClick={increase} disabled={value >= 5} className="grid h-9 place-items-center disabled:opacity-30 cursor-pointer" aria-label="Increase quantity"><Plus size={14} /></button></div>;
}

function getPlatformLabel(platform: string, isSubscription?: boolean | null, duration?: string | null) {
  if (isSubscription && duration) {
    return `${platform} (${duration})`;
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
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isReseller, setIsReseller] = useState(false);
  const [resellerDiscount, setResellerDiscount] = useState(0);
  const [resellerDiscountType, setResellerDiscountType] = useState("percentage");

  useEffect(() => {
    setMounted(true);
    if (coupon) setCode(coupon.code);

    async function loadUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role, is_reseller, reseller_discount, reseller_discount_type").eq("id", user.id).maybeSingle();
        const adminCheck = profile?.role === "admin" || profile?.role === "owner" || user.email === "12k21rakeshkannam@gmail.com";
        setIsAdmin(adminCheck);
        if (profile?.is_reseller) {
          setIsReseller(true);
          setResellerDiscount(Number(profile.reseller_discount || 25));
          setResellerDiscountType(String(profile.reseller_discount_type || "percentage"));
        }
      }
    }
    void loadUserData();
  }, [coupon]);

  const subtotal = lines.reduce((sum, line) => sum + linePrice(line) * line.quantity, 0) + bundles.reduce((sum, line) => sum + Number(line.bundle.bundle_price) * line.quantity, 0);
  const catalogSavings = lines.reduce((sum, line) => sum + Math.max(0, Number(line.game.original_price ?? linePrice(line)) - linePrice(line)) * line.quantity, 0) + bundles.reduce((sum, line) => sum + Math.max(0, Number(line.bundle.original_price) - Number(line.bundle.bundle_price)) * line.quantity, 0);
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0) + bundles.reduce((sum, line) => sum + line.quantity, 0);

  const isWholesaleActive = Boolean(isReseller && resellerDiscount > 0);
  const resellerSubtotalCalc = calculateResellerPrice(subtotal, resellerDiscount, resellerDiscountType);
  const resellerSavings = isWholesaleActive ? -resellerSubtotalCalc.diff : 0;

  const hasSubItems = lines.some(line => line && line.game && line.game.is_subscription);
  const hasNormalItems = lines.some(line => line && line.game && !line.game.is_subscription) || bundles.length > 0;

  const nonSubscriptionSubtotal = lines.reduce((sum, line) => {
    if (!line || !line.game || line.game.is_subscription) return sum;
    return sum + linePrice(line) * line.quantity;
  }, 0) + bundles.reduce((sum, line) => sum + Number(line.bundle.bundle_price) * line.quantity, 0);

  const subscriptionSubtotal = lines.reduce((sum, line) => {
    if (!line || !line.game || !line.game.is_subscription) return sum;
    return sum + linePrice(line) * line.quantity;
  }, 0);

  const discountableBase = coupon?.applicable_to === "subscription"
    ? subscriptionSubtotal
    : coupon?.applicable_to === "normal"
    ? nonSubscriptionSubtotal
    : subtotal;

  const couponEligible = coupon && (isAdmin || (
    subtotal >= coupon.minimum_order && (coupon.code !== "RAKE10" || quantity >= 3) && (coupon.code !== "RAKETHREE" || quantity >= 3) && (
      coupon.applicable_to === "subscription" ? hasSubItems : coupon.applicable_to === "normal" ? hasNormalItems : true
    )
  ));
  const couponSavings = couponEligible ? Math.min(discountableBase, coupon.discount_type === "percentage" ? discountableBase * coupon.discount_value / 100 : coupon.discount_value) : 0;
  const total = Math.max(0, subtotal - couponSavings - resellerSavings);
  const gamesNeeded = Math.max(0, 3 - quantity);

  async function checkCoupon() {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return toast.error("Enter a coupon code");
    
    setChecking(true);
    const supabase = createClient();

    // Resellers cannot use retail coupons (bypassed for admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (user && !isAdmin) {
      const { data: profile } = await supabase.from("profiles").select("is_reseller").eq("id", user.id).maybeSingle();
      if (profile?.is_reseller) {
        setChecking(false);
        return toast.error("Retail coupons cannot be combined with your active wholesale reseller pricing.");
      }
    }
    
    // 1. DIAMOND FREEBIE check
    if (normalized === "DIAMONDFREE" || normalized === "DIAMOND-FREEBIE") {
      if (!isAdmin) {
        if (!user) {
          setChecking(false);
          return toast.error("Sign in to redeem Diamond loyalty perks");
        }
        const { data: reward } = await supabase.from("user_rewards").select("points").eq("user_id", user.id).maybeSingle();
        if ((reward?.points ?? 0) < 4000) {
          setChecking(false);
          return toast.error("Diamond loyalty freebies require Diamond rank (4,000+ points).");
        }
      }
      setCoupon({ code: "DIAMONDFREE", discount_type: "percentage", discount_value: 100, minimum_order: 0, applicable_to: "both" });
      setChecking(false);
      return toast.success("Diamond rank freebie applied! Total is Rs. 0.");
    }

    // 2. Milestone Loyalty Coupon check
    const isMilestoneCoupon = normalized.startsWith("MILE") || normalized.startsWith("LOYAL") || normalized.startsWith("STAGE") || normalized.startsWith("PLAT");
    if (!isAdmin && isMilestoneCoupon) {
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

    if (!isAdmin && normalized === "RAKE10" && quantity < 3) {
      setChecking(false);
      return toast.error(`Add ${3 - quantity} more ${3 - quantity === 1 ? "game" : "games"} to use RAKE10`);
    }

    if (!isAdmin && normalized === "RAKETHREE" && quantity < 3) {
      setChecking(false);
      return toast.error("This code requires a minimum selection of 3 games to unlock your 10% discount.");
    }

    let { data, error } = await supabase.from("coupons").select("id,code,discount_type,discount_value,minimum_order,starts_at,expires_at,active,usage_limit,per_user_limit,applicable_to").eq("code", normalized).eq("active", true).maybeSingle();
    
    if (error && (error.message.includes("applicable_to") || error.code === "PGRST204")) {
      const fallbackQuery = await supabase.from("coupons").select("id,code,discount_type,discount_value,minimum_order,starts_at,expires_at,active,usage_limit,per_user_limit").eq("code", normalized).eq("active", true).maybeSingle();
      data = fallbackQuery.data ? { ...fallbackQuery.data, applicable_to: "both" } : null;
      error = fallbackQuery.error;
    }

    setChecking(false);
    if (error || !data || (data.expires_at && new Date(data.expires_at) <= new Date()) || (data.starts_at && new Date(data.starts_at) > new Date())) { setCoupon(null); return toast.error("This coupon is not active"); }

    const couponScope = data.applicable_to || "both";
    if (couponScope === "subscription" && !hasSubItems) {
      setCoupon(null);
      return toast.error("This coupon code is valid only for subscription plans.");
    }
    if (couponScope === "normal" && !hasNormalItems) {
      setCoupon(null);
      return toast.error("This coupon code is valid only for standard game purchases, not subscriptions.");
    }

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
    setCoupon({ 
      code: data.code, 
      discount_type: data.discount_type as "percentage" | "flat", 
      discount_value: Number(data.discount_value), 
      minimum_order: Number(data.minimum_order ?? 0),
      applicable_to: couponScope as "both" | "subscription" | "normal"
    });
    toast.success("Coupon applied");
  }

  if (!mounted) return null;

  if (!lines.length && !bundles.length) {
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center px-4 py-16 text-center">
        <ShoppingBag className="text-[#596176]" size={42} strokeWidth={1.8} />
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">Your cart is empty</h2>
        <p className="mt-1.5 text-sm text-[#8991a6]">Add a game or combo to get started.</p>
        <Link 
          href="/games" 
          className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#facc15] hover:text-white transition-colors"
        >
          <span>Explore top deals</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-7 pb-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-0">
        <div className="grid w-full min-w-0 content-start gap-3">
          {bundles.map((line) => (
            <article
              key={`bundle-${line.bundle.id}`}
              className="relative flex w-full gap-4 rounded-md border border-[#8b5cf6]/20 bg-[#8b5cf6]/[.04] p-4"
            >
              <Link href={`/bundles/${line.bundle.id}`} className="relative h-24 w-[76px] shrink-0 overflow-hidden rounded-sm sm:h-28 sm:w-[88px] block hover:opacity-90 transition-opacity">
                <Image
                  src={assetUrl(line.bundle.cover_image)}
                  alt={line.bundle.title}
                  fill
                  className="object-cover"
                />
              </Link>
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
              <Link href={gameUrl(line.game)} className="relative h-24 w-[76px] shrink-0 overflow-hidden rounded-sm sm:h-28 sm:w-[88px] block hover:opacity-90 transition-opacity">
                <Image
                  src={assetUrl(line.game.cover_image)}
                  alt={line.game.title}
                  fill
                  className="object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1 pr-10">
                <Link href={gameUrl(line.game)} className="line-clamp-2 font-bold hover:underline pr-4">
                  {line.game.title}
                </Link>
                <p className="mt-2 text-xs text-[#8991a6]">
                  {getPlatformLabel(line.platform, line.game.is_subscription, line.game.duration)} · Digital delivery
                </p>
                {isReseller && resellerDiscount > 0 && resellerSubtotalCalc.isDiscount ? (
                  (() => {
                    const rawLineTotal = linePrice(line) * line.quantity;
                    const lineCalc = calculateResellerPrice(rawLineTotal, resellerDiscount, resellerDiscountType);
                    return (
                      <div className="mt-3 flex items-baseline gap-2">
                        <strong className="text-base font-black text-[#e0ce9a]">
                          {formatPrice(lineCalc.price)}
                        </strong>
                        <del className="text-xs text-[#646b7b] font-medium">{formatPrice(rawLineTotal)}</del>
                        <span className="rounded bg-amber-400/10 border border-amber-400/25 px-1.5 py-0.5 text-[9px] font-black text-[#e0ce9a]">
                          {lineCalc.label}
                        </span>
                      </div>
                    );
                  })()
                ) : (
                  <strong className="mt-3 block text-[#facc15]">
                    {formatPrice(calculateResellerPrice(linePrice(line) * line.quantity, resellerDiscount, resellerDiscountType).price)}
                  </strong>
                )}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void checkCoupon();
                  }
                }}
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
              <span>{formatPrice(isWholesaleActive && !resellerSubtotalCalc.isDiscount ? resellerSubtotalCalc.price : subtotal)}</span>
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
            {isReseller && resellerSubtotalCalc.diff !== 0 && resellerSubtotalCalc.isDiscount && (
              <div className="flex justify-between items-center text-[#e0ce9a] bg-[#16171d] border border-amber-400/25 px-2.5 py-1.5 rounded-lg text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <ResellerIcon className="w-3.5 h-3.5" />
                  Wholesale Partner Rate ({resellerSubtotalCalc.label})
                </span>
                <span>-{formatPrice(Math.abs(resellerSubtotalCalc.diff))}</span>
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-between border-t border-white/10 pt-5 text-xl font-black">
            <span>Total</span>
            <span className="text-[#facc15] font-black">{formatPrice(total)}</span>
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
  );
}
