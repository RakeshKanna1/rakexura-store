"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Clipboard, ImageUp, LockKeyhole, MessageCircle, ShieldCheck, TicketPercent } from "lucide-react";
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

const schema = z.object({ name: z.string().min(2), whatsapp: z.string().regex(/^\+?[0-9 ]{10,16}$/, "Enter a valid WhatsApp number"), paymentReference: z.string().optional() });
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
  const { register, handleSubmit, trigger, getValues, reset, formState: { errors, isSubmitting } } = useForm<Data>({ resolver: zodResolver(schema) });
  const router = useRouter();
  const [celebrate, setCelebrate] = useState(false);
  const lines = useCartStore((state) => state.lines);
  const bundleLines = useCartStore((state) => state.bundleLines);
  const clear = useCartStore((state) => state.clear);
  const coupon = useCartStore((state) => state.coupon);
  const setCoupon = useCartStore((state) => state.setCoupon);
  const [step, setStep] = useState(1);
  const [proof, setProof] = useState<File | null>(null);
  const [orderReference, setOrderReference] = useState("");
  const [couponCode, setCouponCode] = useState(coupon?.code ?? "");
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [games, setGames] = useState<Game[]>([]);

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
          paymentReference: "",
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

  const couponEligible = coupon && 
    (isRankFreebie || (
      subtotal >= coupon.minimum_order && 
      (coupon.code !== "RAKE10" || quantity >= 3) && 
      (coupon.code !== "RAKETHREE" || quantity >= 3)
    ));

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
          // Subscriptions are fully charged and do not qualify for the first 3 free count
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
      // For DIAMONDFREE / general rank freebies, only non-subscription games are free.
      // So the user pays only for the subscription items!
      total = Math.max(0, subtotal - nonSubscriptionSubtotal);
    }
  }
  
  const discount = subtotal - total;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("RAKESH KANNA M")}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Rakexura game order")}`;

  if (!mounted) {
    return <div className="glass mx-auto max-w-2xl h-80 rounded-lg animate-pulse bg-white/[.02]" />;
  }

  if (!lines.length && !bundleLines.length && !orderReference) {
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
      setStep(2);
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    }
  }
  function nextPayment() {
    if (!proof && total > 0) return toast.error("Upload your successful payment screenshot");
    setStep(3);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }
  function chooseProof(file: File | null) {
    if (file && file.size > 5 * 1024 * 1024) return toast.error("Screenshot must be smaller than 5 MB");
    setProof(file);
  }
  async function copyReference() { await navigator.clipboard.writeText(orderReference); toast.success("Order reference copied"); }
  async function copyUpi() { await navigator.clipboard.writeText(UPI_ID); toast.success("UPI ID copied"); }
  async function notifyOwner(
    reference: string, 
    orderTotal: number, 
    values: Data, 
    items: Array<{ title: string; platform: string; quantity: number }>,
    customerEmail?: string,
    userId?: string
  ) {
    try {
      const response = await fetch("/api/notifications/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          customerName: values.name,
          customerWhatsApp: values.whatsapp,
          customerEmail,
          total: orderTotal,
          items,
          userId,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!result?.ok) console.warn("Rakexura owner notification was not sent", result);
    } catch {
      // Checkout should stay successful even if the optional owner message fails.
    }
  }

  async function applyCheckoutCoupon() {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) return toast.error("Enter a coupon code");
    setCheckingCoupon(true);

    // Verify that the cart contains non-subscription items to discount
    const hasDiscountableItems = lines.some(line => line && line.game && !line.game.is_subscription) || bundleLines.length > 0;
    if (!hasDiscountableItems) {
      setCoupon(null);
      setCheckingCoupon(false);
      return toast.error("Coupons cannot be applied to subscriptions.");
    }

    // Determine the lowest price of any discountable item in the cart
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
        // Verify if the coupon would result in free game (total = 0) for ranks below Diamond
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

  async function submit(values: Data) {
    if ((!lines.length && !bundleLines.length) || (total > 0 && !proof)) return toast.error(lines.length || bundleLines.length ? "Upload your payment screenshot" : "Your cart is empty");
    
    // Strict RAKETHREE quantity check before checkout submission
    if (coupon?.code === "RAKETHREE" && quantity < 3) {
      setCoupon(null);
      setCouponCode("");
      toast.error("This code requires a minimum selection of 3 games.");
      return;
    }

    const finalTotal = total;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const customerEmail = user?.email || undefined;
    let proofPath = "FREEBIE-LOYALTY-REWARD";

    if (proof) {
      const safeName = proof.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      proofPath = `${crypto.randomUUID()}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(proofPath, proof, { contentType: proof.type, upsert: false });
      if (uploadError) return toast.error(`Could not upload screenshot: ${uploadError.message}`);
    }

    const items = lines.map((line) => ({ game_id: line.game.id, title: line.game.title, platform: line.platform, quantity: line.quantity, unit_price: getCheckoutLinePrice(line.game, line.platform) }));
    const bundles = bundleLines.map((line) => ({ bundle_id: line.bundle.id, title: line.bundle.title, quantity: line.quantity, unit_price: line.bundle.bundle_price }));
    const { data, error } = await supabase.rpc("create_store_order", { p_customer_name: values.name, p_customer_whatsapp: values.whatsapp.replace(/\D/g, ""), p_items: items, p_bundles: bundles, p_payment_reference: values.paymentReference || null, p_coupon_code: couponEligible ? coupon.code : null, p_payment_proof_path: proofPath });
    
    if (error) {
      if (proof) await supabase.storage.from("payment-proofs").remove([proofPath]);
      return toast.error(error.message);
    }
    
    const reference = String(data);
    setOrderReference(reference);
    void notifyOwner(reference, finalTotal, values, [
      ...items.map((item) => ({ title: String(item.title), platform: String(item.platform), quantity: Number(item.quantity) })),
      ...bundles.map((item) => ({ title: String(item.title), platform: "Bundle", quantity: Number(item.quantity) })),
    ], customerEmail, user?.id);
    
    // Save metadata for WhatsApp redirection link before clearing
    const titles = [...lines.map((l) => l.game.title), ...bundleLines.map((b) => b.bundle.title)].join(", ") || "Game";
    setPurchasedTitles(titles);
    setFinalAmount(finalTotal);
    setAppliedCouponCode(couponEligible && coupon ? coupon.code : null);
    setPostPurchasePhone(values.whatsapp.replace(/\D/g, ""));

    clear();
    setCoupon(null);
  }

  const labels = ["Details", "Payment", "Review"];
  return <>
    <OnboardingHint id="first-checkout" title="Checkout takes three short steps">Enter delivery details, pay using the QR, then upload the successful payment screenshot. Staff verify payment before delivery.</OnboardingHint>
    <div className="mx-auto mb-6 mt-4 grid max-w-2xl grid-cols-3 gap-2" aria-label={`Checkout step ${step} of 3`}>
      {labels.map((label, index) => {
        const number = index + 1;
        const complete = step > number;
        return <div key={label} className={`rounded-md border px-2 py-3 text-center text-xs font-bold ${step >= number ? "border-[#facc15]/35 bg-[#b89412]/10 text-white" : "border-white/[.07] text-[#687086]"}`}><span className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full bg-white/[.07]">{complete ? <Check size={12} /> : number}</span>{label}</div>;
      })}
    </div>
    <form onSubmit={handleSubmit(submit)}>
      <AnimatePresence mode="wait">
        {step === 1 && <motion.section key="details" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="glass mx-auto max-w-2xl space-y-5 rounded-lg p-6">
          <div><p className="eyebrow">Step 1 of 3</p><h2 className="mt-2 text-xl font-bold">Where should we send your game?</h2><p className="muted mt-2 text-sm">These details are private and used only for payment review, delivery, and support.</p></div>
          <label className="block text-sm font-semibold">Name<input suppressHydrationWarning {...register("name")} autoComplete="name" className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#facc15]" />{errors.name && <small className="text-[#ff7373]">Enter your name</small>}</label>
          <label className="block text-sm font-semibold">WhatsApp number<input suppressHydrationWarning {...register("whatsapp")} inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#facc15]" />{errors.whatsapp && <small className="text-[#ff7373]">{errors.whatsapp.message}</small>}</label>
          <Button type="button" onClick={nextDetails} className="w-full">Continue to payment <ChevronRight size={17} /></Button>
        </motion.section>}
        {step === 2 && <motion.section key="payment" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="glass mx-auto max-w-2xl rounded-lg p-6">
          <p className="eyebrow">Step 2 of 3</p>
          
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void applyCheckoutCoupon();
                  }
                }}
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
            👉 Step 2: Scan and Pay your final calculated total below
          </h3>

          {/* Transaction Section */}
          <div className="mt-4 grid gap-6 sm:grid-cols-[220px_1fr]">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-white"><Image src="/Assets/Payments/gpay-qr.png" alt="Rakexura UPI payment QR" fill className="object-contain" /></div>
            <div>
              {total > 0 ? (
                <>
                  <h2 className="text-xl font-bold">Pay exactly {formatPrice(total)}</h2>
                  <div className="mt-4 rounded-md border border-white/10 bg-black/25 p-3"><span className="block text-[11px] font-bold uppercase tracking-wider text-[#8991a6]">UPI ID</span><button suppressHydrationWarning type="button" onClick={copyUpi} className="mt-1 flex min-h-10 w-full items-center justify-between gap-3 text-left text-sm font-bold"><span className="truncate">{UPI_ID}</span><Clipboard size={16} /></button><div className="mt-2 grid grid-cols-2 gap-2"><a href={upiUrl} className="btn btn-secondary min-h-10 text-xs">Open GPay</a><a href={upiUrl} className="btn btn-secondary min-h-10 text-xs">Open PhonePe</a></div></div>
                  <ol className="mt-3 space-y-2 text-sm leading-6 text-[#aeb5c6]"><li><b className="text-white">1.</b> Scan the QR or open your UPI app.</li><li><b className="text-white">2.</b> Pay the exact total.</li><li><b className="text-white">3.</b> Upload the successful payment screenshot.</li></ol>
                  <label className="mt-5 block text-sm font-semibold">UPI reference <span className="muted font-normal">(optional)</span><input suppressHydrationWarning {...register("paymentReference")} className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#facc15]" /></label>
                </>
              ) : subtotal > 0 ? (
                <div className="p-4 rounded-md border border-[#00d68f]/20 bg-[#00d68f]/[.05] text-[#70efbb] mb-4">
                  <h3 className="font-black text-lg">Exclusive Rank Perk Active</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#c4eade]">Your total is Rs. 0. Bypassing payment scan requirement. Please upload any placeholder screenshot to complete your free loyalty checkout review.</p>
                </div>
              ) : null}
              {/* Screenshot Uploader Component (Permanently Visible) */}
              <label className="mt-4 flex min-h-20 cursor-pointer items-center gap-3 rounded-md border border-dashed border-white/15 bg-white/[.03] p-4 text-sm transition hover:border-[#facc15]/50"><ImageUp className="shrink-0 text-[#facc15]" /><span className="min-w-0"><b className="block truncate">{proof ? proof.name : "Choose payment screenshot"}</b><small className="muted">JPG, PNG, or WebP, maximum 5 MB</small></span><input suppressHydrationWarning type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseProof(event.target.files?.[0] ?? null)} /></label>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-2"><button suppressHydrationWarning type="button" onClick={() => { setStep(1); if (typeof window !== "undefined") window.scrollTo(0, 0); }} className="btn btn-secondary"><ChevronLeft size={17} /> Back</button><Button type="button" onClick={nextPayment}>Review order <ChevronRight size={17} /></Button></div>
        </motion.section>}
        {step === 3 && <motion.section key="review" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="glass mx-auto max-w-2xl rounded-lg p-6">
          <p className="eyebrow">Step 3 of 3</p><h2 className="mt-2 text-xl font-bold">Confirm your order</h2>
          <div className="mt-5 space-y-3">
            {bundleLines.map((line) => {
              if (!line || !line.bundle) return null;
              const bundleTitle = line.bundle.title || "Game Bundle";
              const bundlePrice = Number(line.bundle.bundle_price || 0);
              const qty = line.quantity || 1;
              return (
                <div key={`bundle-${line.bundle.id}`} className="flex justify-between gap-4 rounded-md border border-[#facc15]/15 bg-[#b89412]/[.05] p-4 text-sm">
                  <span><b>{bundleTitle}</b><small className="muted mt-1 block">Combo bundle x {qty}</small></span>
                  <span>{formatPrice(bundlePrice * qty)}</span>
                </div>
              );
            })}
            {lines.map((line) => {
              if (!line || !line.game) return null;
              const gameTitle = line.game.title || "Unknown Game";
              const platform = line.platform || "Steam";
              const qty = line.quantity || 1;
              const priceValue = getCheckoutLinePrice(line.game, platform);
              return (
                <div key={`${line.game.id || Math.random()}-${platform}`} className="flex justify-between gap-4 rounded-md bg-white/[.035] p-4 text-sm">
                  <span><b>{gameTitle}</b><small className="muted mt-1 block">{platform} x {qty}</small></span>
                  <span>{formatPrice(Number(priceValue || 0) * qty)}</span>
                </div>
              );
            })}
          </div>
          

          <div className="mt-5 space-y-2 border-t border-white/10 pt-5 text-sm">
            <div className="flex justify-between text-[#a0a8c0]">
              <span>Customer</span>
              <span>{getValues("name")}</span>
            </div>
            <AnimatePresence initial={false}>
              {discount > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-between text-[#70efbb] overflow-hidden"
                >
                  <span>Coupon {coupon?.code}</span>
                  <span>-{formatPrice(discount)}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex justify-between text-xl font-black">
              <span>Total</span>
              <span className="text-[#facc15]">{formatPrice(total)}</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2"><button suppressHydrationWarning type="button" onClick={() => { setStep(2); if (typeof window !== "undefined") window.scrollTo(0, 0); }} className="btn btn-secondary"><ChevronLeft size={17} /> Back</button><Button disabled={isSubmitting || (!lines.length && !bundleLines.length)}>{isSubmitting ? "Creating order..." : "Confirm order"}</Button></div>
          <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#8991a6]"><LockKeyhole size={15} className="mt-0.5 shrink-0" /> Your proof is private and readable only by authorized Rakexura staff.</p>
        </motion.section>}
      </AnimatePresence>
    </form>
    <AnimatePresence>{orderReference && (
      <motion.div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-[#05070f]/94 p-5 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div initial={{ y: 20, scale: .96 }} animate={{ y: 0, scale: 1 }} className="premium-panel w-full max-w-lg rounded-lg p-7 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#00d68f] text-black">
            <Check size={38} />
          </span>
          <p className="eyebrow mt-6">Order created</p>
          <h2 className="mt-2 text-3xl font-black">Payment review started</h2>
          <p className="muted mt-3 text-sm leading-6">Save this reference. Use it with your WhatsApp number to track delivery.</p>
          
          <button suppressHydrationWarning type="button" onClick={copyReference} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-md border border-white/10 bg-black/25 text-xl font-black tracking-wide">
            <Clipboard size={18} /> {orderReference}
          </button>

          <div className="mt-5 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/[.03] text-center space-y-2">
            <h4 className="text-emerald-400 font-bold text-sm">Action Required to Receive Game</h4>
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
                encodeURIComponent(`🛒 *NEW ORDER RECEIVED*`) + `%0A%0A` +
                encodeURIComponent(`📦 *Game:* ${gameTitle} `) + `%0A` +
                encodeURIComponent(`🆔 *Order ID:* ${orderReference} `) + `%0A` +
                encodeURIComponent(`🏷️ *Type:* ${isFreebie ? '[FREE ORDER via Loyalty Rank Coupon]' : `[PAID ORDER (Amount Paid: Rs. ${finalAmount})]`} `) + `%0A%0A` +
                encodeURIComponent(`🔗 *Track Order:* ${trackingLink}`) + `%0A%0A` +
                encodeURIComponent(`Please send over my activation details!`);

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
                  className="relative inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] transition-all hover:scale-[1.01] active:scale-[0.99] select-none cursor-pointer animate-pulse"
                >
                  <MessageCircle size={18} className="animate-bounce shrink-0" />
                  <span>Click to Activate & Receive Your Game via WhatsApp</span>
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
            <ShieldCheck size={15} /> Payment proof received. Rakexura can see it in admin.
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
    )}</AnimatePresence>
    <Confetti active={celebrate} onComplete={() => setCelebrate(false)} />
  </>;
}
