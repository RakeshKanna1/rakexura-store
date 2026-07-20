"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Clipboard, Loader2, LockKeyhole, MessageCircle, ShieldCheck, TicketPercent } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/common/button";
import { OnboardingHint } from "@/components/common/onboarding-hint";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, isDiamondOrPlatinumCoupon } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { BundleAddonMatrix } from "@/components/store/bundle-addon-matrix";
import type { Game } from "@/types/store";
import { Confetti } from "@/components/common/confetti";
import { EmptyState } from "@/components/common/empty-state";

const schema = z.object({ 
  name: z.string().min(2), 
  whatsapp: z.string().regex(/^\+?[0-9 ]{10,16}$/, "Enter a valid WhatsApp number")
});
type Data = z.infer<typeof schema>;
const UPI_ID = "916369628215@waaxis";

function getCheckoutLinePrice(g: Game, platform: string) {
  if (platform === "Epic") return Number(g.epic_price ?? g.sale_price ?? 0);
  if (platform === "Offline") return Number(g.offline_price ?? 0);
  if (platform === "Online") return Number(g.online_price ?? 0);
  if (platform === "Xbox") return Number(g.xbox_price ?? 0);
  if (platform === "Nvidia GeForce") return Number(g.geforce_price ?? 0);
  return Number(g.steam_price ?? g.sale_price ?? 0);
}

export function CheckoutForm() {
  const { register, trigger, getValues, reset, formState: { errors } } = useForm<Data>({ resolver: zodResolver(schema) });
  const router = useRouter();
  const [celebrate, setCelebrate] = useState(false);
  const lines = useCartStore((state) => state.lines);
  const bundleLines = useCartStore((state) => state.bundleLines);
  const clear = useCartStore((state) => state.clear);
  const coupon = useCartStore((state) => state.coupon);
  const setCoupon = useCartStore((state) => state.setCoupon);
  const [step, setStep] = useState(1);
  const [orderReference, setOrderReference] = useState("");
  const [couponCode, setCouponCode] = useState(coupon?.code ?? "");
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [games, setGames] = useState<Game[]>([]);

  // Checkout automation states
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Dynamic post-purchase Whatsapp link states
  const [purchasedTitles, setPurchasedTitles] = useState("");
  const [finalAmount, setFinalAmount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [postPurchasePhone, setPostPurchasePhone] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      const supabase = createClient();
      const { data } = await supabase
        .from("games")
        .select("id, title, steam_price, sale_price, epic_price, offline_price, online_price, xbox_price, geforce_price, is_subscription")
        .eq("archived", false);
      if (data) setGames(data as Game[]);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, whatsapp")
          .eq("id", user.id)
          .maybeSingle();

        const defaultName = profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
        const defaultWhatsApp = profile?.whatsapp || "";

        reset({
          name: defaultName,
          whatsapp: defaultWhatsApp,
        });
      }
    }
    void loadData();
  }, [reset]);

  const gamesTotal = lines.reduce((sum, line) => {
    if (!line || !line.game) return sum;
    const platform = line.platform || "Steam";
    const g = line.game;
    const value = getCheckoutLinePrice(g, platform);
    return sum + Number(value ?? 0) * (line.quantity || 1);
  }, 0);
  const bundleTotal = bundleLines.reduce((sum, line) => {
    if (!line || !line.bundle) return sum;
    return sum + Number(line.bundle.bundle_price || 0) * (line.quantity || 1);
  }, 0);

  const subtotal = gamesTotal + bundleTotal;
  const quantity = lines.reduce((sum, line) => sum + (line?.quantity || 1), 0) + bundleLines.reduce((sum, line) => sum + (line?.quantity || 1), 0);

  // Dynamic validation check for RAKETHREE quantity loopholes
  useEffect(() => {
    if (coupon?.code === "RAKETHREE" && quantity < 3) {
      setCoupon(null);
      setCouponCode("");
      toast.error("Coupon RAKETHREE removed: This code requires a minimum selection of 3 games.");
    }
  }, [coupon, quantity, setCoupon]);

  // Dynamic validation check for general coupon game price constraints
  useEffect(() => {
    if (coupon) {
      const hasDiscountableItems = lines.some(line => line && line.game && !line.game.is_subscription) || bundleLines.length > 0;
      if (!hasDiscountableItems) {
        setCoupon(null);
        setCouponCode("");
        toast.error("Coupon removed: Coupons cannot be applied to subscriptions.");
        return;
      }
      if (!isDiamondOrPlatinumCoupon(coupon.code) && coupon.code !== "RAKETHREE") {
        const hasLowPricedGame = lines.some((line) => {
          if (!line || !line.game || line.game.is_subscription) return false;
          const platform = line.platform || "Steam";
          const g = line.game;
          const value = getCheckoutLinePrice(g, platform);
          return Number(value ?? 0) * (line.quantity || 1) < 99;
        });
        const hasLowPricedBundle = bundleLines.some((line) => {
          if (!line || !line.bundle) return false;
          return Number(line.bundle.bundle_price || 0) * (line.quantity || 1) < 99;
        });
        if (hasLowPricedGame || hasLowPricedBundle) {
          setCoupon(null);
          setCouponCode("");
          toast.error("Coupon removed: General coupons can only be applied to games priced at Rs. 99 or above.");
        }
      }
    }
  }, [coupon, lines, bundleLines, setCoupon]);

  const isRankFreebie = coupon && (
    coupon.code === "DIAMONDFREE" || 
    coupon.code === "DIAMOND-FREEBIE" || 
    coupon.code === "PLATINUMFREE" || 
    coupon.code === "PLATINUM-FREEBIE"
  );

  const isPlatinumFreebie = coupon && (coupon.code === "PLATINUM-FREEBIE" || coupon.code === "PLATINUMFREE");
  
  const nonSubscriptionSubtotal = lines.reduce((sum, line) => {
    if (!line || !line.game || line.game.is_subscription) return sum;
    const platform = line.platform || "Steam";
    return sum + getCheckoutLinePrice(line.game, platform) * (line.quantity || 1);
  }, 0) + bundleTotal;

  const couponDiscount = couponEligible
    ? Math.min(
        nonSubscriptionSubtotal,
        coupon.discount_type === "percentage"
          ? (nonSubscriptionSubtotal * coupon.discount_value) / 100
          : coupon.discount_value
      )
    : 0;

  let total = Math.max(0, subtotal - couponDiscount);
  
  if (isRankFreebie) {
    if (isPlatinumFreebie) {
      let platinumTotal = 0;
      lines.forEach((line) => {
        if (!line || !line.game) return;
        const platform = line.platform || "Steam";
        const gamePriceValue = getCheckoutLinePrice(line.game, platform);
        const price = Number(gamePriceValue ?? 0);
        const qty = line.quantity || 1;
        if (line.game.is_subscription) {
          platinumTotal += qty * price;
        } else {
          if (qty > 3) {
            platinumTotal += (qty - 3) * price;
          }
        }
      });
      bundleLines.forEach((line) => {
        if (!line || !line.bundle) return;
        const qty = line.quantity || 1;
        if (qty > 3) {
          platinumTotal += (qty - 3) * Number(line.bundle.bundle_price || 0);
        }
      });
      total = platinumTotal;
    } else {
      total = Math.max(0, subtotal - nonSubscriptionSubtotal);
    }
  }
  
  const discount = subtotal - total;
  const couponEligible = coupon && 
    (isRankFreebie || (
      subtotal >= coupon.minimum_order && 
      (coupon.code !== "RAKE10" || quantity >= 3) && 
      (coupon.code !== "RAKETHREE" || quantity >= 3)
    ));

  // Generate UPI deep-link prefilled with merchant ID, dynamic amount, and order reference ID
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("RAKESH KANNA M")}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderReference || "Rakexura Game Order")}`;

  // QR Code generator URL (Lightweight, fast, 100% free API)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`;

  // Polling database status in real-time when on Step 2
  useEffect(() => {
    if (!orderReference || step !== 2 || total === 0) return;

    const interval = setInterval(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("payment_status, order_status")
        .eq("order_reference", orderReference)
        .maybeSingle();

      if (data && (data.payment_status === "Approved" || data.order_status === "Delivered")) {
        clearInterval(interval);
        handlePaymentSuccess();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [orderReference, step, total]);

  function handlePaymentSuccess() {
    setPaymentCompleted(true);
    setCelebrate(true);
    const titles = [...lines.map((l) => l.game.title), ...bundleLines.map((b) => b.bundle.title)].join(", ") || "Game";
    setPurchasedTitles(titles);
    setFinalAmount(total);
    setAppliedCouponCode(couponEligible && coupon ? coupon.code : null);
    setPostPurchasePhone(getValues("whatsapp").replace(/\D/g, ""));
    clear();
    setCoupon(null);
  }

  // Simulator handler for developer checkout testing
  async function simulatePaymentSuccess() {
    if (!orderReference) return;
    try {
      setSimulating(true);
      const res = await fetch("/api/checkout/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderReference })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Simulation successful! Order marked Paid.");
        handlePaymentSuccess();
      } else {
        toast.error(`Simulation failed: ${data.error}`);
      }
    } catch {
      toast.error("Failed to connect to simulator API");
    } finally {
      setSimulating(false);
    }
  }

  // Complete free rank loyalty checkouts instantly without payment
  async function completeFreeOrder() {
    if (!orderReference) return;
    try {
      setCreatingOrder(true);
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: "Approved",
          order_status: "Delivered",
          updated_at: new Date().toISOString()
        })
        .eq("order_reference", orderReference);

      if (error) return toast.error(error.message);

      // Add free items directly to customer library
      const { data: order } = await supabase.from("orders").select("id, user_id, cart_items").eq("order_reference", orderReference).single();
      if (order?.user_id && order.cart_items) {
        const itemsList = Array.isArray(order.cart_items) ? order.cart_items : [];
        const rows = itemsList
          .filter((item: any) => item.type !== "bundle" && item.game_id)
          .map((item: any) => ({
            user_id: order.user_id,
            game_id: item.game_id,
            order_id: order.id,
            platform: item.platform ?? order.variant_type ?? "Steam",
            delivery_notes: "Loyalty reward free order processed automatically",
          }));

        if (rows.length > 0) {
          await supabase.from("customer_library").upsert(rows, { onConflict: "user_id,game_id,platform" });
        }
      }

      toast.success("Free reward checkout successfully processed!");
      handlePaymentSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingOrder(false);
    }
  }

  if (!mounted) {
    return <div className="glass mx-auto max-w-2xl h-80 rounded-lg animate-pulse bg-white/[.02]" />;
  }

  if (!lines.length && !bundleLines.length && !paymentCompleted) {
    return (
      <EmptyState
        icon={LockKeyhole}
        title="Your cart is empty"
        description="Add some games or bundles to your cart before proceeding to checkout."
        href="/games"
        action="Browse games"
      />
    );
  }

  async function nextDetails() {
    if (await trigger(["name", "whatsapp"])) {
      try {
        setCreatingOrder(true);
        const values = getValues();
        const supabase = createClient();
        const items = lines.map((line) => ({ game_id: line.game.id, title: line.game.title, platform: line.platform, quantity: line.quantity, unit_price: getCheckoutLinePrice(line.game, line.platform) }));
        const bundles = bundleLines.map((line) => ({ bundle_id: line.bundle.id, title: line.bundle.title, quantity: line.quantity, unit_price: line.bundle.bundle_price }));
        
        // Register the order as Pending first, returning reference ID
        const { data, error } = await supabase.rpc("create_store_order", {
          p_customer_name: values.name,
          p_customer_whatsapp: values.whatsapp.replace(/\D/g, ""),
          p_items: items,
          p_bundles: bundles,
          p_payment_reference: "AUTO_UPI_PENDING",
          p_coupon_code: couponEligible ? coupon.code : null,
          p_payment_proof_path: "AUTO_UPI_PENDING"
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        setOrderReference(String(data));
        setStep(2);
        if (typeof window !== "undefined") window.scrollTo(0, 0);
      } catch (err: any) {
        toast.error("Failed to initialize payment reference: " + err.message);
      } finally {
        setCreatingOrder(false);
      }
    }
  }

  async function applyCheckoutCoupon() {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) return toast.error("Enter a coupon code");
    setCheckingCoupon(true);

    const hasDiscountableItems = lines.some(line => line && line.game && !line.game.is_subscription) || bundleLines.length > 0;
    if (!hasDiscountableItems) {
      setCoupon(null);
      setCheckingCoupon(false);
      return toast.error("Coupons cannot be applied to subscriptions.");
    }

    let lowestPricedItem = 999999;
    let discountableCount = 0;
    lines.forEach(line => {
      if (line && line.game && !line.game.is_subscription) {
        const platform = line.platform || "Steam";
        const val = getCheckoutLinePrice(line.game, platform);
        if (val < lowestPricedItem) lowestPricedItem = val;
        discountableCount += (line.quantity || 1);
      }
    });
    bundleLines.forEach(line => {
      if (line && line.bundle) {
        const val = Number(line.bundle.bundle_price || 0);
        if (val < lowestPricedItem) lowestPricedItem = val;
        discountableCount += (line.quantity || 1);
      }
    });

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: normalized,
          gamePrice: lowestPricedItem === 999999 ? undefined : lowestPricedItem,
          subtotal: subtotal,
          quantity: quantity,
          cartItemsCount: discountableCount
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setCoupon(null);
        toast.dismiss();
        toast.error(resData.error?.message || "This coupon is invalid or not active");
      } else {
        const tempDiscount = Math.min(subtotal, resData.data.discount_type === "percentage" ? subtotal * Number(resData.data.discount_value) / 100 : Number(resData.data.discount_value));
        if (subtotal - tempDiscount <= 0) {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          const points = user ? (await supabase.from("user_rewards").select("points").eq("user_id", user.id).maybeSingle()).data?.points ?? 0 : 0;
          if (points < 4000) {
            setCoupon(null);
            toast.dismiss();
            return toast.error("Free game checkout codes are restricted to Diamond and Platinum loyalty ranks.");
          }
        }

        setCoupon({
          code: resData.data.code,
          discount_type: resData.data.discount_type,
          discount_value: resData.data.discount_value,
          minimum_order: resData.data.minimum_order
        });
        setCelebrate(true);
        toast.dismiss();
        toast.success("Coupon applied");
      }
    } catch {
      toast.dismiss();
      toast.error("Network error during coupon validation.");
    } finally {
      setCheckingCoupon(false);
    }
  }

  async function copyReference() { 
    await navigator.clipboard.writeText(orderReference); 
    toast.success("Order reference copied"); 
  }

  async function copyUpi() { 
    await navigator.clipboard.writeText(UPI_ID); 
    toast.success("UPI ID copied"); 
  }

  const labels = ["Details", "Payment & Automation"];
  return <>
    <OnboardingHint id="first-checkout" title="Checkout takes two fast steps">Enter delivery details, pay using the dynamic QR code, and watch the system automatically approve and process your order in real-time!</OnboardingHint>
    
    <div className="mx-auto mb-6 mt-4 grid max-w-2xl grid-cols-2 gap-2" aria-label={`Checkout step ${step} of 2`}>
      {labels.map((label, index) => {
        const number = index + 1;
        const complete = step > number;
        return (
          <div key={label} className={`rounded-md border px-2 py-3 text-center text-xs font-bold ${step >= number ? "border-[#facc15]/35 bg-[#b89412]/10 text-white" : "border-white/[.07] text-[#687086]"}`}>
            <span className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full bg-white/[.07]">{complete ? <Check size={12} /> : number}</span>
            {label}
          </div>
        );
      })}
    </div>

    <form onSubmit={(e) => e.preventDefault()}>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.section key="details" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="glass mx-auto max-w-2xl space-y-5 rounded-lg p-6">
            <div>
              <p className="eyebrow">Step 1 of 2</p>
              <h2 className="mt-2 text-xl font-bold">Where should we send your game?</h2>
              <p className="muted mt-2 text-sm">These details are private and used only for payment verification, delivery, and support.</p>
            </div>
            <label className="block text-sm font-semibold">Name
              <input suppressHydrationWarning {...register("name")} autoComplete="name" className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#facc15]" />
              {errors.name && <small className="text-[#ff7373]">Enter your name</small>}
            </label>
            <label className="block text-sm font-semibold">WhatsApp number
              <input suppressHydrationWarning {...register("whatsapp")} inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#facc15]" />
              {errors.whatsapp && <small className="text-[#ff7373]">{errors.whatsapp.message}</small>}
            </label>
            <Button type="button" onClick={nextDetails} disabled={creatingOrder} className="w-full flex items-center justify-center gap-2">
              {creatingOrder ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating Order ID...
                </>
              ) : (
                <>
                  Continue to payment <ChevronRight size={17} />
                </>
              )}
            </Button>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section key="payment" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="glass mx-auto max-w-2xl rounded-lg p-6">
            <p className="eyebrow">Step 2 of 2</p>
            
            {/* Bundle Selection Matrix */}
            <BundleAddonMatrix games={games} />

            {/* Coupon Entry Section */}
            <div className="mt-6 rounded-lg border border-white/5 bg-black/20 p-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-white mb-2 flex items-center gap-1.5">
                <TicketPercent className="text-[#facc15] h-4 w-4" /> Have a coupon code?
              </h4>
              <div className="flex items-center gap-2">
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="PROMO OR RANK CODE"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="h-11 flex-1 min-w-0 rounded-md border border-white/10 bg-black/25 px-3.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#facc15] text-white"
                />
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={applyCheckoutCoupon}
                  disabled={checkingCoupon}
                  className="btn btn-secondary min-h-0 h-11 px-4 shrink-0 text-xs font-extrabold uppercase tracking-wide flex items-center justify-center"
                >
                  {checkingCoupon ? "Applying..." : "Apply"}
                </button>
              </div>
              {coupon && (
                <p className="mt-2 text-xs text-[#70efbb] font-semibold flex items-center gap-1">
                  <Check size={14} /> 
                  {isRankFreebie ? (
                    <span>Used coupon: Free of charge</span>
                  ) : (
                    <span>Active perk: Coupon <span className="underline">{coupon.code}</span> applied ({coupon.discount_type === "percentage" ? `${coupon.discount_value}% off` : `${formatPrice(coupon.discount_value)} off`})</span>
                  )}
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => {
                      setCoupon(null);
                      setCouponCode("");
                    }}
                    className="text-xs text-red-400 hover:underline ml-2 cursor-pointer"
                  >
                    [Remove Code]
                  </button>
                </p>
              )}
            </div>

            <hr className="border-zinc-800/80 my-6" />

            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              ⚡ Checkout: Scan to Pay using Google Pay, PhonePe, or Paytm
            </h3>

            {/* Transaction Section */}
            <div className="mt-4 grid gap-6 sm:grid-cols-[220px_1fr]">
              {total > 0 && (
                <div className="relative aspect-square overflow-hidden rounded-lg bg-white border border-white/10 p-2 flex flex-col items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeUrl} alt="Dynamic UPI Scan QR Code" className="w-full h-full object-contain" />
                </div>
              )}
              
              <div>
                {total > 0 ? (
                  <>
                    <h2 className="text-xl font-bold">Pay exactly {formatPrice(total)}</h2>
                    <p className="text-xs text-[#8991a6] mt-1">This QR Code is customized for Order Reference: <span className="font-extrabold text-white">{orderReference}</span></p>
                    
                    <div className="mt-4 rounded-md border border-white/10 bg-black/25 p-3">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-[#8991a6]">UPI VPA (Copy/Transfer)</span>
                      <button suppressHydrationWarning type="button" onClick={copyUpi} className="mt-1 flex min-h-10 w-full items-center justify-between gap-3 text-left text-sm font-bold">
                        <span className="truncate">{UPI_ID}</span>
                        <Clipboard size={16} />
                      </button>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <a href={upiUrl} className="btn btn-secondary min-h-10 text-xs flex items-center justify-center">Intent: GPay</a>
                        <a href={upiUrl} className="btn btn-secondary min-h-10 text-xs flex items-center justify-center">Intent: PhonePe</a>
                      </div>
                    </div>

                    <div className="mt-4 p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/[.03] space-y-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin text-[#facc15] h-4 w-4" />
                        <span className="text-xs font-bold text-white">Awaiting automatic verification...</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#aeb5c6]">
                        Scan the code and complete the transfer. Once the bank confirms, this screen will automatically refresh. **No screenshot upload required!**
                      </p>
                      
                      {/* Interactive Simulator Mode Button */}
                      <button
                        suppressHydrationWarning
                        type="button"
                        onClick={simulatePaymentSuccess}
                        disabled={simulating}
                        className="w-full py-2.5 px-3 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700/80 text-[11px] font-black text-zinc-200 transition-all flex items-center justify-center gap-1.5"
                      >
                        {simulating ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            Simulating Hook...
                          </>
                        ) : (
                          <>
                            ✔️ Click to Simulate Successful Payment (Test Mode)
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : subtotal > 0 ? (
                  <div className="p-4 rounded-md border border-[#00d68f]/20 bg-[#00d68f]/[.05] text-[#70efbb] mb-4">
                    <h3 className="font-black text-lg">Exclusive Rank Perk Active</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#c4eade]">Your total is Rs. 0. Bypassing payment scan requirement. Click below to claim your free reward instantly!</p>
                    
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={completeFreeOrder}
                      disabled={creatingOrder}
                      className="mt-4 w-full btn btn-primary flex items-center justify-center gap-2"
                    >
                      {creatingOrder ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Processing reward...
                        </>
                      ) : (
                        <>
                          Claim Free Reward <Check size={16} />
                        </>
                      )}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <button suppressHydrationWarning type="button" onClick={() => { setStep(1); if (typeof window !== "undefined") window.scrollTo(0, 0); }} className="btn btn-secondary w-full max-w-[140px]"><ChevronLeft size={17} /> Back</button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </form>

    {/* Post-Purchase Success Modal */}
    <AnimatePresence>
      {paymentCompleted && orderReference && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-[#05070f]/94 p-5 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div initial={{ y: 20, scale: .96 }} animate={{ y: 0, scale: 1 }} className="premium-panel w-full max-w-lg rounded-lg p-7 text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#00d68f] text-black">
              <Check size={38} />
            </span>
            <p className="eyebrow mt-6">Payment verified</p>
            <h2 className="mt-2 text-3xl font-black">Order successfully verified!</h2>
            <p className="muted mt-3 text-sm leading-6">Your payment was automated and confirmed. Use this order reference with your WhatsApp number to track delivery details.</p>
            
            <button suppressHydrationWarning type="button" onClick={copyReference} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-md border border-white/10 bg-black/25 text-xl font-black tracking-wide">
              <Clipboard size={18} /> {orderReference}
            </button>

            <div className="mt-5 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/[.03] text-center space-y-2">
              <h4 className="text-emerald-400 font-bold text-sm font-sans uppercase tracking-wider">Instant Game Activation</h4>
              {(() => {
                const isRankCouponActive = appliedCouponCode && (
                  appliedCouponCode === "DIAMONDFREE" || 
                  appliedCouponCode === "DIAMOND-FREEBIE" || 
                  appliedCouponCode === "PLATINUMFREE" || 
                  appliedCouponCode === "PLATINUM-FREEBIE"
                );
                const isFreebie = finalAmount === 0 && isRankCouponActive;
                const gameTitle = purchasedTitles || "Game";
                const trackingLink = `${typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://rakexura-store.vercel.app")}/track-order?order=${orderReference}&phone=${postPurchasePhone}`;
                const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695"}?text=` + 
                  encodeURIComponent(`🛒 *NEW AUTOMATED ORDER CONFIRMED*`) + `%0A%0A` +
                  encodeURIComponent(`📦 *Game:* ${gameTitle} `) + `%0A` +
                  encodeURIComponent(`🆔 *Order ID:* ${orderReference} `) + `%0A` +
                  encodeURIComponent(`🏷️ *Type:* ${isFreebie ? '[FREE ORDER via Loyalty Rank Coupon]' : `[PAID ORDER (Amount Confirmed: Rs. ${finalAmount})]`} `) + `%0A%0A` +
                  encodeURIComponent(`🔗 *Track Order:* ${trackingLink}`) + `%0A%0A` +
                  encodeURIComponent(`Payment was verified automatically by the system. Please send my activation details!`);

                return (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        localStorage.setItem("activated_" + orderReference, "true");
                      }
                      toast.success("Activation handshake initiated!");
                    }}
                    className="relative inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] transition-all hover:scale-[1.01] active:scale-[0.99] select-none cursor-pointer"
                  >
                    <MessageCircle size={18} className="animate-bounce shrink-0" />
                    <span>Receive Activation & Launch Game on WhatsApp</span>
                  </a>
                );
              })()}
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Link href="/dashboard/orders" className="btn btn-primary flex items-center justify-center">
                Track order
              </Link>
              <Link href="/support" className="btn btn-secondary">
                <MessageCircle size={17} /> Support
              </Link>
            </div>
            <p className="mt-5 flex items-center justify-center gap-2 text-xs text-[#82dcb8]">
              <ShieldCheck size={15} /> Payment verified. Rakexura admin notified.
            </p>
            <span
              onClick={() => {
                clear();
                router.push("/");
              }}
              className="text-sm text-zinc-400 hover:text-[#00d68f] transition-colors mt-4 cursor-pointer block text-center font-medium"
            >
              &lt; Continue Shopping
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    
    <Confetti active={celebrate} onComplete={() => setCelebrate(false)} />
  </>;
}
