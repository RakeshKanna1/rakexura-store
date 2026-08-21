"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Clipboard, ImageUp, LockKeyhole, MessageCircle, QrCode, ShieldCheck, TicketPercent, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/common/button";
import { OnboardingHint } from "@/components/common/onboarding-hint";
import { createClient } from "@/lib/supabase/client";
import { calculateResellerPrice, formatPrice, gameUrl, isDiamondOrPlatinumCoupon } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { BundleAddonMatrix } from "@/components/store/bundle-addon-matrix";
import type { Game } from "@/types/store";
import { Confetti } from "@/components/common/confetti";
import { DustDisintegration } from "@/components/common/dust-disintegration";
import { WHATSAPP_NUMBER, SITE_CONFIG } from "@/lib/config";
import { EmptyState } from "@/components/common/empty-state";
import dynamic from "next/dynamic";

const GenerativeQr = dynamic(
  () => import("@/components/checkout/generative-qr").then((mod) => mod.GenerativeQr),
  { ssr: false }
);

import { ThermalReceiptPrinter } from "@/components/checkout/thermal-receipt-printer";
import { ResellerIcon } from "@/components/ui/reseller-badge";

const schema = z.object({ name: z.string().min(2), whatsapp: z.string().regex(/^\+?[0-9 ]{10,16}$/, "Enter a valid WhatsApp number"), paymentReference: z.string().optional() });
type Data = z.infer<typeof schema>;
const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "12k21rakeshkannam@oksbi";

function getCheckoutLinePrice(g: Game, platform: string) {
  if (platform === "Epic") return Number(g.epic_price ?? g.sale_price ?? 0);
  if (platform === "Offline") return Number(g.offline_price ?? 0);
  if (platform === "Online") return Number(g.online_price ?? 0);
  if (platform === "Xbox") return Number(g.xbox_price ?? 0);
  if (platform === "Nvidia GeForce") return Number(g.geforce_price ?? 0);
  return Number(g.steam_price ?? g.sale_price ?? 0);
}

function FocusModeWhatsAppPrinter({
  orderReference,
  customerName,
  total,
  items,
  whatsappUrl,
  couponCode,
  couponDiscount,
}: {
  orderReference: string;
  customerName: string;
  total: number;
  items: Array<{ name: string; platform?: string; price: number; quantity?: number }>;
  whatsappUrl: string;
  couponCode?: string;
  couponDiscount?: number;
}) {
  const [secondsLeft, setSecondsLeft] = useState(12);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const doRedirect = useCallback(() => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    toast.success("Opening WhatsApp activation...");
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = whatsappUrl;
      }
    }, 350);
  }, [whatsappUrl, isRedirecting]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          doRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [doRedirect]);

  return (
    <div className="py-2 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 w-full max-w-sm mx-auto font-sans">
      {/* Clean Professional Header Card */}
      <div className="w-full mb-4 p-4 rounded-xl border border-white/10 bg-[#0d111c] text-center relative overflow-hidden font-sans shadow-lg">
        {/* Animated Top Border Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-black/40 overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 12, ease: "linear" }}
            className="h-full bg-gradient-to-r from-[#00bb7f] via-[#facc15] to-[#00d68f]"
          />
        </div>

        <h3 className="text-sm font-bold text-white flex items-center justify-center gap-2 pt-0.5">
          <span className="h-2 w-2 rounded-full bg-[#00d68f] shadow-[0_0_8px_#00d68f]" />
          <span>Connecting to WhatsApp</span>
        </h3>

        <p className="text-xs text-[#8d95aa] mt-1 font-mono">
          {secondsLeft > 0 ? (
            <span>Redirecting automatically in <span className="text-[#00d68f] font-bold">{secondsLeft}s</span></span>
          ) : (
            <span className="text-[#00d68f] font-bold">Opening WhatsApp...</span>
          )}
        </p>

        {/* Skip / Instant Open Button */}
        <button
          suppressHydrationWarning
          type="button"
          onClick={doRedirect}
          className="mt-3.5 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-[#00bb7f] hover:bg-[#00a872] text-[#05070f] font-bold text-xs transition cursor-pointer active:scale-[0.98]"
        >
          <span>Open WhatsApp Now</span>
          <MessageCircle size={14} />
        </button>

        <p className="text-[11px] text-[#8d95aa] mt-3">
          Tap or tear receipt below to open WhatsApp immediately
        </p>
      </div>

      {/* 3D Thermal Receipt Printer - Fully unrolled paper */}
      <ThermalReceiptPrinter
        orderReference={orderReference}
        customerName={customerName}
        total={total}
        items={items}
        couponCode={couponCode}
        couponDiscount={couponDiscount}
        isPaid={false}
        autoPrint={true}
        statusHeading=""
        statusSubtext=""
        hideActions={true}
        onTearComplete={doRedirect}
      />
    </div>
  );
}

export function CheckoutForm() {
  const { register, handleSubmit, trigger, getValues, setValue, reset, formState: { errors, isSubmitting } } = useForm<Data>({ resolver: zodResolver(schema) });
  const router = useRouter();
  const [celebrate, setCelebrate] = useState(false);
  const lines = useCartStore((state) => state.lines);
  const bundleLines = useCartStore((state) => state.bundleLines);
  const remove = useCartStore((state) => state.remove);
  const removeBundle = useCartStore((state) => state.removeBundle);
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
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);
  const [purchasedItemsSnapshot, setPurchasedItemsSnapshot] = useState<Array<{ name: string; platform?: string; price: number; quantity?: number }>>([]);
  const [postPurchasePhone, setPostPurchasePhone] = useState("");
  const [isPrintingReceiptScreen, setIsPrintingReceiptScreen] = useState(false);
  const [isReseller, setIsReseller] = useState(false);
  const [resellerDiscount, setResellerDiscount] = useState(0);
  const [resellerDiscountType, setResellerDiscountType] = useState("percentage");
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
          .select("display_name, whatsapp, is_reseller, reseller_discount, reseller_discount_type")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.is_reseller) {
          setIsReseller(true);
          setResellerDiscount(Number(profile.reseller_discount || 25));
          setResellerDiscountType(String(profile.reseller_discount_type || "percentage"));
        }

        const defaultName = profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
        const defaultWhatsApp = profile?.whatsapp || user.user_metadata?.whatsapp || "";

        reset({
          name: defaultName,
          whatsapp: defaultWhatsApp,
          paymentReference: "",
        });
      }
    }
    void loadData();

    const handleProfileUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        if (detail.whatsapp !== undefined) {
          setValue("whatsapp", detail.whatsapp);
        }
        if (detail.display_name !== undefined) {
          setValue("name", detail.display_name);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("profile-updated", handleProfileUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("profile-updated", handleProfileUpdate);
      }
    };
  }, [reset, setValue]);

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
      const hasSubItems = lines.some(line => line && line.game && line.game.is_subscription);
      const hasNormalItems = lines.some(line => line && line.game && !line.game.is_subscription) || bundleLines.length > 0;
      
      if (coupon.applicable_to === "subscription" && !hasSubItems) {
        setCoupon(null);
        setCouponCode("");
        toast.error("Coupon removed: This coupon is only valid for subscriptions.");
        return;
      }
      
      if (coupon.applicable_to === "normal" && !hasNormalItems) {
        setCoupon(null);
        setCouponCode("");
        toast.error("Coupon removed: This coupon is only valid for standard game purchases.");
        return;
      }

      if (!isDiamondOrPlatinumCoupon(coupon.code) && coupon.code !== "RAKETHREE") {
        const totalItemCount = lines.reduce((sum, l) => sum + (l?.quantity || 1), 0) + bundleLines.reduce((sum, b) => sum + (b?.quantity || 1), 0);
        if (totalItemCount === 1 && subtotal < 99) {
          setCoupon(null);
          setCouponCode("");
          toast.error("Coupons cannot be applied to a single game priced under ₹99.");
        }
      }
    }
  }, [coupon, lines, bundleLines, subtotal, setCoupon]);

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

  const subscriptionSubtotal = lines.reduce((sum, line) => {
    if (!line || !line.game || !line.game.is_subscription) return sum;
    const platform = line.platform || "Steam";
    return sum + getCheckoutLinePrice(line.game, platform) * (line.quantity || 1);
  }, 0);

  const discountableBase = coupon?.applicable_to === "subscription"
    ? subscriptionSubtotal
    : coupon?.applicable_to === "normal"
    ? nonSubscriptionSubtotal
    : subtotal;

  const couponDiscount = couponEligible
    ? Math.min(
        discountableBase,
        coupon.discount_type === "percentage"
          ? (discountableBase * coupon.discount_value) / 100
          : coupon.discount_value
      )
    : 0;

  const isWholesaleActive = Boolean(isReseller && resellerDiscount > 0);
  const resellerSubtotalCalc = calculateResellerPrice(subtotal, resellerDiscount, resellerDiscountType);
  const resellerSavings = isWholesaleActive ? -resellerSubtotalCalc.diff : 0;
  let total = Math.max(0, subtotal - couponDiscount - resellerSavings);
  
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

    const hasSubItems = lines.some(line => line && line.game && line.game.is_subscription);
    const hasNormalItems = lines.some(line => line && line.game && !line.game.is_subscription) || bundleLines.length > 0;

    // Determine the lowest price of any item in the cart
    let lowestPricedItem = 999999;
    lines.forEach(line => {
      if (line && line.game) {
        const platform = line.platform || "Steam";
        const val = getCheckoutLinePrice(line.game, platform);
        if (val < lowestPricedItem) lowestPricedItem = val;
      }
    });
    bundleLines.forEach(line => {
      if (line && line.bundle) {
        const val = Number(line.bundle.bundle_price || 0);
        if (val < lowestPricedItem) lowestPricedItem = val;
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
          cartItemsCount: quantity,
          hasSubscription: hasSubItems,
          hasNormal: hasNormalItems
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
          minimum_order: resData.data.minimum_order,
          applicable_to: resData.data.applicable_to || "both"
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
    setCelebrate(true);
    void notifyOwner(reference, finalTotal, values, [
      ...items.map((item) => ({ title: String(item.title), platform: String(item.platform), quantity: Number(item.quantity), price: Number(item.unit_price) })),
      ...bundles.map((item) => ({ title: String(item.title), platform: "Bundle", quantity: Number(item.quantity), price: Number(item.unit_price) })),
    ], customerEmail, user?.id);
    
    // Save metadata for WhatsApp redirection link & receipt printer before clearing
    const titles = [...lines.map((l) => l.game.title), ...bundleLines.map((b) => b.bundle.title)].join(", ") || "Game";
    setPurchasedTitles(titles);
    setFinalAmount(finalTotal);
    setAppliedCouponCode(couponEligible && coupon ? coupon.code : null);
    setAppliedCouponDiscount(couponDiscount);
    setPurchasedItemsSnapshot([
      ...lines.map((l) => ({
        name: l.game.title,
        platform: l.platform,
        price: getCheckoutLinePrice(l.game, l.platform),
        quantity: l.quantity,
      })),
      ...bundleLines.map((b) => ({
        name: b.bundle.title,
        platform: "Bundle",
        price: Number(b.bundle.bundle_price || 0),
        quantity: b.quantity,
      })),
    ]);
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
          <label className="block text-sm font-semibold">WhatsApp number<input suppressHydrationWarning {...register("whatsapp")} inputMode="tel" autoComplete="tel" placeholder="Enter WhatsApp number (e.g., 919876543210)" className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#facc15]" />{errors.whatsapp && <small className="text-[#ff7373]">{errors.whatsapp.message}</small>}</label>
          <Button type="button" onClick={nextDetails} className="w-full">Continue to payment <ChevronRight size={17} /></Button>
        </motion.section>}
        {step === 2 && <motion.section key="payment" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} className="glass mx-auto max-w-2xl rounded-lg p-6">
          <p className="eyebrow">Step 2 of 3</p>
          
          {/* Bundle Selection Matrix */}
          <BundleAddonMatrix games={games} />

          {/* Cart Items Manager Card */}
          <div className="mt-5 rounded-lg border border-white/10 bg-black/25 p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Selected Games ({lines.length + bundleLines.length})
              </span>
              <span className="text-[11px] text-[#8991a6]">
                Click <Trash2 size={11} className="inline text-red-400" /> to remove any game
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {bundleLines.map((line) => {
                if (!line || !line.bundle) return null;
                return (
                  <DustDisintegration key={`bundle-${line.bundle.id}`} onRemove={() => removeBundle(line.bundle.id)}>
                    {(triggerRemove: () => void) => (
                      <div className="flex items-center justify-between gap-3 rounded-md border border-[#facc15]/20 bg-[#b89412]/[.08] p-2.5 text-xs">
                        <div className="min-w-0 flex-1">
                          <Link href={`/bundles/${line.bundle.id}`} target="_blank" className="font-extrabold text-white block truncate hover:underline hover:text-[#facc15] transition-colors">
                            {line.bundle.title}
                          </Link>
                          <span className="text-[10px] text-[#facc15] font-mono">Combo Bundle x{line.quantity}</span>
                        </div>
                        <span className="font-extrabold text-white shrink-0">{formatPrice(Number(line.bundle.bundle_price || 0) * line.quantity)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            triggerRemove();
                            toast.success("Bundle removed from cart");
                          }}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition shrink-0 cursor-pointer"
                          title="Remove bundle"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </DustDisintegration>
                );
              })}

              {lines.map((line) => {
                if (!line || !line.game) return null;
                const priceVal = getCheckoutLinePrice(line.game, line.platform);
                return (
                  <DustDisintegration key={`${line.game.id}-${line.platform}`} onRemove={() => remove(line.game.id, line.platform)}>
                    {(triggerRemove: () => void) => (
                      <div className="flex items-center justify-between gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] p-2.5 text-xs">
                        <div className="min-w-0 flex-1">
                          <Link href={gameUrl(line.game)} target="_blank" className="font-extrabold text-white block truncate hover:underline hover:text-[#facc15] transition-colors">
                            {line.game.title}
                          </Link>
                          <span className="text-[10px] text-[#b9a4ff] font-mono">{line.platform} · Qty: {line.quantity}</span>
                        </div>
                        <span className="font-extrabold text-[#facc15] shrink-0">{formatPrice(Number(priceVal || 0) * line.quantity)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            triggerRemove();
                            toast.success(`${line.game.title} removed`);
                          }}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition shrink-0 cursor-pointer"
                          title="Remove game"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </DustDisintegration>
                );
              })}
            </div>
          </div>

          {/* Coupon Entry Section */}
          <div className="mt-5 rounded-lg border border-white/5 bg-black/20 p-4">
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
            <QrCode size={16} className="text-[#8b5cf6] shrink-0" />
            <span>Step 2: Scan and Pay your final calculated total below</span>
          </h3>

          {/* Transaction Section */}
          <div className="mt-4 grid gap-6 sm:grid-cols-[220px_1fr] items-start">
            <div className="flex justify-center sm:block w-full">
              <GenerativeQr upiId={UPI_ID} amount={total} payeeName="Rakexura" note="Rakexura Game Order" size={180} />
            </div>
            <div className="min-w-0">
              {total > 0 ? (
                <>
                  <h2 className="text-xl font-bold">Pay exactly {formatPrice(total)}</h2>
                  <div className="mt-4 rounded-md border border-white/10 bg-black/25 p-3.5">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-[#8991a6]">UPI ID</span>
                    <button suppressHydrationWarning type="button" onClick={copyUpi} className="mt-1 flex min-h-10 w-full items-center justify-between gap-3 text-left text-sm font-bold hover:text-[#facc15] transition-colors cursor-pointer" title="Click to copy UPI ID">
                      <span className="truncate">{UPI_ID}</span>
                      <Clipboard size={16} className="shrink-0 text-[#facc15]" />
                    </button>
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <a href={upiUrl} className="btn btn-secondary min-h-10 text-xs flex items-center justify-center gap-1.5 font-bold">Open GPay</a>
                      <a href={upiUrl} className="btn btn-secondary min-h-10 text-xs flex items-center justify-center gap-1.5 font-bold">Open PhonePe</a>
                    </div>
                  </div>
                  <ol className="mt-3 space-y-2 text-sm leading-6 text-[#aeb5c6]">
                    <li><b className="text-white">1.</b> Scan the Generative QR or tap Open GPay / PhonePe.</li>
                    <li><b className="text-white">2.</b> Pay the exact calculated total ({formatPrice(total)}).</li>
                    <li><b className="text-white">3.</b> Upload your payment screenshot below to complete order.</li>
                  </ol>
                  <label className="mt-4 block text-sm font-semibold">UPI reference <span className="muted font-normal">(optional)</span><input suppressHydrationWarning {...register("paymentReference")} className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-4 outline-none focus:border-[#facc15]" /></label>
                </>
              ) : subtotal > 0 ? (
                <div className="p-4 rounded-md border border-[#00d68f]/20 bg-[#00d68f]/[.05] text-[#70efbb] mb-4">
                  <h3 className="font-black text-lg">Exclusive Rank Perk Active</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#c4eade]">Your total is Rs. 0. Bypassing payment scan requirement. Please upload any placeholder screenshot to complete your free loyalty checkout review.</p>
                </div>
              ) : null}
              {/* Screenshot Uploader Component (Permanently Visible) */}
              <label className="mt-4 flex min-h-20 cursor-pointer items-center gap-3 rounded-md border border-dashed border-white/15 bg-white/[.03] p-4 text-sm transition hover:border-[#facc15]/50"><ImageUp className="shrink-0 text-[#facc15]" /><span className="min-w-0"><b className="block truncate">{proof ? proof.name : "Choose payment screenshot"}</b><small className="muted">JPG, PNG, WebP, or AVIF, maximum 5 MB</small></span><input suppressHydrationWarning type="file" accept="image/*,.avif,.webp,.png,.jpg,.jpeg" className="sr-only" onChange={(event) => chooseProof(event.target.files?.[0] ?? null)} /></label>
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
              const rawPriceValue = Number(getCheckoutLinePrice(line.game, platform) || 0);
              const priceValue = isReseller && !resellerSubtotalCalc.isDiscount ? calculateResellerPrice(rawPriceValue, resellerDiscount, resellerDiscountType).price : rawPriceValue;
              return (
                <div key={`${line.game.id || Math.random()}-${platform}`} className="flex justify-between gap-4 rounded-md bg-white/[.035] p-4 text-sm">
                  <span><b>{gameTitle}</b><small className="muted mt-1 block">{platform} x {qty}</small></span>
                  <span>{formatPrice(priceValue * qty)}</span>
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
            {isReseller && resellerSubtotalCalc.diff !== 0 && resellerSubtotalCalc.isDiscount && (
              <div className="flex justify-between items-center text-[#e0ce9a] bg-[#16171d] border border-amber-400/25 px-2.5 py-1.5 rounded-lg text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <ResellerIcon className="w-3.5 h-3.5" />
                  Wholesale Partner Rate ({resellerSubtotalCalc.label})
                </span>
                <span>-{formatPrice(Math.abs(resellerSubtotalCalc.diff))}</span>
              </div>
            )}
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
          {isPrintingReceiptScreen ? (
            /* Focus Mode: Display ONLY the Thermal Receipt Printer Animation & 5s Countdown Header */
            (() => {
              const isRankCouponActive = Boolean(
                appliedCouponCode === "GOLD-FREEBIE" || 
                appliedCouponCode === "GOLD50" || 
                appliedCouponCode === "DIAMONDFREE" || 
                appliedCouponCode === "DIAMOND-FREEBIE" || 
                appliedCouponCode === "PLATINUMFREE" || 
                appliedCouponCode === "PLATINUM-FREEBIE"
              );
              const isFreebie = finalAmount === 0 && isRankCouponActive;
              const gameTitle = purchasedTitles || "Game";
              const trackingLink = `${typeof window !== "undefined" ? window.location.origin : SITE_CONFIG.siteUrl}/track-order?order=${orderReference}&phone=${postPurchasePhone}`;
              const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=` + 
                encodeURIComponent(`NEW ORDER RECEIVED`) + `%0A%0A` +
                encodeURIComponent(`Game: ${gameTitle} `) + `%0A` +
                encodeURIComponent(`Order ID: ${orderReference} `) + `%0A` +
                encodeURIComponent(`Type: ${isFreebie ? '[FREE ORDER via Loyalty Rank Coupon]' : `[PAID ORDER (Amount Paid: Rs. ${finalAmount})]`} `) + `%0A%0A` +
                encodeURIComponent(`Track Order: ${trackingLink}`) + `%0A%0A` +
                encodeURIComponent(`Please send over my activation details!`);

              const receiptItems = purchasedItemsSnapshot.length > 0
                ? purchasedItemsSnapshot
                : lines.length > 0
                ? lines.map((l) => ({
                    name: l.game.title,
                    platform: l.platform,
                    price: getCheckoutLinePrice(l.game, l.platform),
                    quantity: l.quantity,
                  }))
                : bundleLines.map((b) => ({
                    name: b.bundle.title,
                    platform: "Bundle",
                    price: Number(b.bundle.bundle_price || 0),
                    quantity: b.quantity,
                  }));

              return (
                <FocusModeWhatsAppPrinter
                  orderReference={orderReference}
                  customerName={getValues("name") || "Rakexura Customer"}
                  total={finalAmount}
                  items={receiptItems}
                  whatsappUrl={whatsappUrl}
                  couponCode={appliedCouponCode ?? coupon?.code}
                  couponDiscount={appliedCouponDiscount > 0 ? appliedCouponDiscount : discount}
                />
              );
            })()
          ) : (
            /* Standard Post-Checkout Summary Screen */
            <>
              <div className="relative mx-auto h-20 w-20 flex items-center justify-center mb-2">
                {/* Green energy ring shockwaves */}
                <motion.span
                  initial={{ opacity: 1, scale: 0.5 }}
                  animate={{ opacity: 0, scale: 1.9 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-2 border-[#00d68f]/80 pointer-events-none"
                />
                <motion.span
                  initial={{ opacity: 1, scale: 0.3 }}
                  animate={{ opacity: 0, scale: 2.4 }}
                  transition={{ duration: 0.85, delay: 0.12, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-2 border-[#70efbb]/50 pointer-events-none"
                />

                {/* Main Success Circle */}
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: [0, 1.2, 0.95, 1.05, 1], rotate: 0 }}
                  transition={{ duration: 0.65, ease: [0.175, 0.885, 0.32, 1.275] }}
                  className="grid h-20 w-20 place-items-center rounded-full bg-[#00d68f] text-black shadow-[0_0_35px_rgba(0,214,143,0.5)] relative z-10"
                >
                  <svg
                    width="42"
                    height="42"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M20 6L9 17l-5-5"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
                    />
                  </svg>
                </motion.div>
              </div>

              <p className="eyebrow mt-6">Order created</p>
              <h2 className="mt-2 text-3xl font-black">Payment review started</h2>
              <p className="muted mt-3 text-sm leading-6">Save this reference. Use it with your WhatsApp number to track delivery.</p>
              
              <button suppressHydrationWarning type="button" onClick={copyReference} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-md border border-white/10 bg-black/25 text-xl font-black tracking-wide">
                <Clipboard size={18} /> {orderReference}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem("activated_" + orderReference, "true");
                  }
                  setIsPrintingReceiptScreen(true);
                  toast.success("Printing official receipt... Connecting to WhatsApp!");
                }}
                className="mt-5 relative inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] transition-all hover:scale-[1.01] active:scale-[0.99] select-none cursor-pointer"
              >
                <MessageCircle size={18} className="animate-bounce shrink-0" />
                <span>Click to Activate & Receive Your Game via WhatsApp</span>
              </button>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Link
                  href={`/track-order?order=${orderReference}&phone=${postPurchasePhone}`}
                  className="btn btn-primary flex items-center justify-center"
                >
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
            </>
          )}
        </motion.div>
      </motion.div>
    )}</AnimatePresence>
    <Confetti active={celebrate} onComplete={() => setCelebrate(false)} />
  </>;
}
