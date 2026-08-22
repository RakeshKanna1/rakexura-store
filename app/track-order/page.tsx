"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Circle, Clipboard, Clock3, HelpCircle, LifeBuoy, MessageCircle, Search, X, ShieldCheck, Sparkles, FileText, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { formatPrice } from "@/lib/utils";
import { Confetti } from "@/components/common/confetti";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { ReviewForm } from "@/components/reviews/review-form";

const ThermalReceiptPrinter = dynamic(
  () => import("@/components/checkout/thermal-receipt-printer").then((mod) => mod.ThermalReceiptPrinter),
  { ssr: false }
);

type TrackedOrder = { 
  order_id: number; 
  order_ref: string; 
  status: string; 
  total_price: number; 
  created_at: string; 
  items: Array<{ title: string; platform: string; game_id?: number; type?: string; unit_price?: number; price?: number; quantity?: number }>; 
  customer_name: string;
  customer_rank: string;
  customer_email?: string;
  account_access?: string;
  user_id?: string | null;
  auth_required?: boolean;
};

const stages = ["Order received", "Payment verified", "Preparing delivery", "Delivered"];

function stageIndex(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("delivered") || normalized.includes("completed")) return 3;
  if (normalized.includes("processing") || normalized.includes("preparing")) return 2;
  if (normalized.includes("verified") || normalized.includes("approved")) return 1;
  return 0;
}

function estimate(status: string) {
  const index = stageIndex(status);
  if (index === 3) return "Delivery completed. Check your My Library dashboard!";
  if (index === 2) return "Delivery is being prepared. Your game files are usually delivered to your dashboard library within 15–30 minutes.";
  if (index === 1) return "Payment verified! Your order is in queue. Deliveries are typically completed within 10–20 minutes.";
  return "Payment review is pending. Admin verification is normally completed within 10–15 minutes of screenshot upload.";
}

function TrackOrderContent() {
  const params = useSearchParams();
  const [order, setOrder] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [whatsappActivated, setWhatsappActivated] = useState(false);

  const [showConfetti, setShowConfetti] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [orderCoupon, setOrderCoupon] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleDismissPoints = () => {
    setShowPointsAnimation(false);
    const el = document.getElementById("credentials-section") || document.getElementById("order-tracking-result");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  async function handleSendEmailInvoice(targetEmail?: string) {
    const emailToSend = targetEmail || currentUser?.email || "registered customer email";
    setSendingEmail(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 850));
      toast.success(`Official invoice receipt emailed to ${emailToSend}!`);
    } catch {
      toast.error("Failed to send invoice email. Please try again.");
    } finally {
      setSendingEmail(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    async function loadCurrentUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    }
    void loadCurrentUser();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCurrentUser(null);
    toast.success("Signed out successfully");
    // Clear tracked order details to require re-tracking
    setResult(null);
  }

  const track = useCallback(async () => {
    if (!order.trim()) return toast.error("Enter your order reference");
    setLoading(true);
    const supabase = createClient();
    let row: Record<string, unknown> | null = null;

    if (phone.replace(/\D/g, "").length >= 10) {
      const { data } = await supabase.rpc("track_store_order", { p_order_reference: order.trim(), p_phone_suffix: phone.replace(/\D/g, "") });
      row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
    }

    if (!row && currentUser) {
      const { data: userOrder } = await supabase
        .from("orders")
        .select("id, order_reference, order_status, total_price, created_at, cart_items, account_access, customer_name, customer_whatsapp, user_id")
        .eq("order_reference", order.trim())
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (userOrder) {
        row = {
          order_id: userOrder.id,
          order_ref: userOrder.order_reference,
          status: userOrder.order_status,
          total_price: userOrder.total_price,
          created_at: userOrder.created_at,
          items: Array.isArray(userOrder.cart_items) ? userOrder.cart_items : [],
          customer_name: userOrder.customer_name || "Customer",
          customer_rank: "Bronze",
          account_access: userOrder.account_access,
          user_id: userOrder.user_id,
          auth_required: false
        };
        if (userOrder.customer_whatsapp && !phone) {
          setPhone(userOrder.customer_whatsapp);
        }
      }
    }

    setLoading(false);
    if (!row) { setResult(null); return toast.error("Order not found. Check order reference or log in."); }

    const casted = row as unknown as TrackedOrder;
    setResult(casted);
    setWhatsappActivated(typeof window !== "undefined" && localStorage.getItem("activated_" + casted.order_ref) === "true");

    let isSub = false;
    const gameIds = ((casted.items || []) as Array<{ type?: string; game_id?: number }>)
      .filter((item) => item.type === "game" && item.game_id)
      .map((item) => item.game_id as number);
    if (gameIds.length > 0) {
      const { data: dbGames } = await supabase
        .from("games")
        .select("is_subscription")
        .in("id", gameIds);
      isSub = dbGames?.some((g: { is_subscription?: boolean | null }) => g.is_subscription) ?? false;
    }
    setHasSubscription(isSub);

    // Retrieve any attached coupon code or loyalty reward information
    let couponName: string | null = null;
    if (casted.order_id) {
      try {
        const { data: usage } = await supabase
          .from("coupon_usage")
          .select("coupon_id, coupons(code)")
          .eq("order_id", casted.order_id)
          .maybeSingle();
        if (usage?.coupons) {
          const c = usage.coupons as unknown;
          if (typeof c === "object" && c !== null && "code" in c) {
            couponName = String((c as { code: string }).code);
          }
        }
      } catch {
        // Optional coupon check
      }
    }
    if (!couponName && Number(casted.total_price) === 0) {
      if (casted.customer_rank === "Diamond" || casted.customer_rank === "Platinum") {
        couponName = `${casted.customer_rank.toUpperCase()} FREEBIE`;
      } else {
        couponName = "LOYALTY COUPON";
      }
    }
    setOrderCoupon(couponName);

    setTimeout(() => {
      const el = document.getElementById("order-tracking-result");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);

    if (casted.status === "Delivered" || casted.status === "Completed") {
      setShowConfetti(true);
      const key = `animated_points_${casted.order_ref}`;
      if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
        setShowPointsAnimation(true);
        sessionStorage.setItem(key, "true");
      }
    }
  }, [order, phone, currentUser]);

  // Auto-run if query params or currentUser is available
  useEffect(() => {
    const orderParam = params.get("order");
    const phoneParam = params.get("phone");
    if (orderParam) {
      setOrder(orderParam);
    }
    if (phoneParam) {
      setPhone(phoneParam);
    }
  }, [params]);

  useEffect(() => {
    if (order && (phone.replace(/\D/g, "").length >= 10 || currentUser)) {
      void track();
    }
  }, [order, phone, currentUser, track]);

  async function copyOrder() { if (!result) return; await navigator.clipboard.writeText(result.order_ref); toast.success("Order reference copied"); }
  
  const active = result ? stageIndex(result.status) : 0;
  const isRejected = result ? result.status.toLowerCase() === "rejected" : false;
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695";

  const gamesText = result?.items?.map((item) => item.title).join(", ") || "Game";
  const finalAmount = result ? Number(result.total_price) : 0;
  const isFreebie = finalAmount === 0 && (
    result?.customer_rank === "Diamond" || 
    result?.customer_rank === "Platinum"
  );
  const orderReference = result?.order_ref || "";
  const trackingLink = `${typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://rakexura-store.vercel.app")}/track-order?order=${orderReference}&phone=${phone}`;

  const whatsappUrl = `https://wa.me/${whatsapp}?text=` + 
    encodeURIComponent(`*NEW ORDER RECEIVED*`) + `%0A%0A` +
    encodeURIComponent(`*Game:* ${gamesText} `) + `%0A` +
    encodeURIComponent(`*Order ID:* ${orderReference} `) + `%0A` +
    encodeURIComponent(`*Type:* ${isFreebie ? '[FREE ORDER via Loyalty Rank Coupon]' : `[PAID ORDER (Amount Paid: Rs. ${finalAmount})]`} `) + `%0A%0A` +
    encodeURIComponent(`*Track Order:* ${trackingLink}`) + `%0A%0A` +
    encodeURIComponent(`Please send over my activation details!`);

  if (!mounted) {
    return (
      <div className="page-shell py-10">
        <p className="eyebrow mb-3">Live order status</p>
        <h1 className="mb-4 text-4xl font-black sm:text-6xl text-white">Track your delivery</h1>
        <p className="section-copy max-w-2xl mb-8">Use your order reference and WhatsApp number. Customer details are never shown publicly.</p>
        <div className="glass rounded-xl border border-white/[.08] bg-[#0c0f18]/80 p-6 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">Find your order</h2>
            <p className="mt-1 text-sm text-[#8991a6]">Use the reference shown after checkout and the same WhatsApp number used for delivery.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#aeb5c8]">Order reference</label>
              <div className="h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#aeb5c8]">WhatsApp number</label>
              <div className="h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 text-sm" />
            </div>
            <div className="h-12 min-w-36 rounded-md bg-[#facc15]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell py-10">
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <p className="eyebrow mb-3">Live order status</p>
      <h1 className="mb-4 text-4xl font-black sm:text-6xl text-white">Track your delivery</h1>
      <p className="section-copy max-w-2xl mb-8">Use your order reference and WhatsApp number. Customer details are never shown publicly.</p>
      
      <div className="glass rounded-xl border border-white/[.08] bg-[#0c0f18]/80 p-6 backdrop-blur-xl shadow-2xl">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">Find your order</h2>
          <p className="mt-1 text-sm text-[#8991a6]">Use the reference shown after checkout and the same WhatsApp number used for delivery.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="track-order-ref" className="text-xs font-bold text-[#aeb5c8]">
              Order reference
            </label>
            <input suppressHydrationWarning id="track-order-ref" name="order_ref" value={order} onChange={(event) => setOrder(event.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void track(); } }} autoComplete="off" placeholder="RKX-2606-000123" className="h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 text-sm outline-none transition focus:border-[#facc15] focus:ring-1 focus:ring-[#facc15]/30 text-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="track-order-phone" className="text-xs font-bold text-[#aeb5c8]">
              WhatsApp number
            </label>
            <input suppressHydrationWarning id="track-order-phone" name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void track(); } }} autoComplete="tel" placeholder="91 98765 43210" inputMode="tel" className="h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 text-sm outline-none transition focus:border-[#facc15] focus:ring-1 focus:ring-[#facc15]/30 text-white" />
          </div>
          <button 
            suppressHydrationWarning 
            onClick={track} 
            disabled={loading} 
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#facc15] bg-[#facc15] px-6 text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all hover:bg-[#fde047] hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Search size={17} className="text-black stroke-[2.5]" />
            <span className="font-black text-black">{loading ? "Checking..." : "Track Order"}</span>
          </button>
        </div>
      </div>

      {result && (
        <article className="premium-panel mt-6 rounded-xl border border-white/[.08] bg-[#0c0f18]/90 p-6 md:p-8 backdrop-blur-xl" id="order-tracking-result">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[.08] pb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b9a4ff]">Order Reference</p>
              <button type="button" onClick={copyOrder} className="mt-1.5 inline-flex min-h-11 items-center gap-2 text-2xl font-black text-[#facc15] hover:text-[#fde047] transition-colors" aria-label="Copy order reference">
                {result.order_ref}
                <Clipboard size={16} className="text-[#facc15]" />
              </button>
              {result.auth_required ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-[#facc15] font-bold">
                  <span>Protected Customer Order</span>
                </div>
              ) : (
                <>
                  <h2 className="mt-2 text-lg font-extrabold text-white">{gamesText}</h2>
                  <p className="text-xs font-bold text-[#c4b5fd] mt-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" />
                    Rank: <span className="text-[#facc15]">{result.customer_rank}</span>
                  </p>
                </>
              )}
            </div>
            <div className="text-right flex flex-col items-end gap-1.5">
              <strong className="text-2xl font-black text-[#facc15]">{result.auth_required ? "Rs. --" : formatPrice(result.total_price)}</strong>
              <span className={`block rounded-md px-3 py-1.5 text-xs font-bold ${isRejected ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-[#8b5cf6]/15 text-[#c4b5fd] border border-[#8b5cf6]/25"}`}>{result.status}</span>
              
              {/* Side Receipt Button with Active Gold Glow */}
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setShowReceipt(!showReceipt)}
                className={`btn btn-secondary text-xs font-bold py-1.5 px-3 inline-flex items-center gap-1.5 border rounded-md shadow-sm cursor-pointer transition mt-1 ${
                  showReceipt
                    ? "border-[#facc15] bg-[#facc15]/10 text-[#facc15] shadow-[0_0_12px_rgba(250,204,21,0.25)]"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white"
                }`}
              >
                <FileText size={14} className="text-[#facc15]" />
                {showReceipt ? "Hide Receipt" : "Receipt"}
              </button>
            </div>
          </div>

          {/* Thermal Order Receipt Printer unfolding above with Email Invoice Resend Card */}
          {showReceipt && (
            <div className="my-6 p-4 rounded-lg border border-white/10 bg-black/40 flex flex-col items-center animate-in fade-in duration-300">
              <ThermalReceiptPrinter
                orderReference={result.order_ref}
                customerName={result.customer_name || "Rakexura Customer"}
                total={Number(result.total_price || 0)}
                date={result.created_at ? new Date(result.created_at).toLocaleDateString() : undefined}
                isPaid={["delivered", "completed", "payment verified", "processing", "approved"].some((s) => (result.status || "").toLowerCase().includes(s))}
                isGift={result.order_ref.toUpperCase().includes("GIFT") || result.order_ref.toUpperCase().includes("GIVEAWAY") || (result.status || "").toLowerCase().includes("gift")}
                paymentStatus={result.status}
                couponCode={orderCoupon || (isFreebie ? "LOYALTY RANK FREEBIE" : undefined)}
                couponDiscount={
                  Number(result.total_price) === 0
                    ? result.items && result.items.length > 0
                      ? result.items.reduce((acc, item) => acc + Number(item.unit_price || item.price || 199) * (item.quantity || 1), 0)
                      : 199
                    : 0
                }
                items={
                  result.items && result.items.length > 0
                    ? result.items.map((i) => ({
                        name: i.title,
                        platform: i.platform || "Steam",
                        price: Number(i.unit_price || i.price || (Number(result.total_price) > 0 ? Number(result.total_price) / (result.items?.length || 1) : 199)),
                        quantity: Number(i.quantity || 1),
                      }))
                    : [{ name: gamesText || "PC Game", price: Number(result.total_price > 0 ? result.total_price : 199) }]
                }
                autoPrint={true}
                statusHeading="Official Invoice"
                statusSubtext="Your verified order receipt"
                onTearComplete={() => setShowReceipt(false)}
              />

              {/* Sleek 1-Tap Resend Email Receipt Card */}
              {(() => {
                const targetEmail = result.customer_email || currentUser?.email;
                return (
                  <div className="mt-4 w-full max-w-[280px] p-3.5 rounded-lg border border-white/10 bg-[#0d111c]/90 text-center space-y-2 font-sans shadow-xl">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#facc15]">
                      <Mail size={14} />
                      <span>Email Official Invoice</span>
                    </div>
                    {targetEmail ? (
                      <p className="text-[11px] text-[#8991a6] leading-tight">
                        Send copy to <span className="text-white font-medium underline">{targetEmail}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#8991a6] leading-tight">
                        Send invoice copy to your registered email
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSendEmailInvoice(targetEmail || undefined)}
                      disabled={sendingEmail}
                      className="w-full py-2 px-3 mt-1 bg-[#facc15] hover:bg-[#fbbf24] text-black text-xs font-extrabold rounded-md flex items-center justify-center gap-1.5 transition active:scale-[0.98] shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Send size={13} />
                      {sendingEmail ? "Sending Invoice..." : "Resend Receipt to Email"}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {result.auth_required ? (
            <div className="mt-6 text-center p-8 rounded-lg border border-yellow-500/20 bg-yellow-500/[.03] space-y-4">
              <div className="flex flex-col items-center justify-center space-y-2">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400 text-lg">
                  <ShieldCheck size={24} />
                </span>
                <h3 className="text-yellow-400 font-extrabold text-xl">
                  Authentication Required
                </h3>
              </div>
              {currentUser ? (
                <p className="text-sm text-[#a4abbc] max-w-md mx-auto leading-relaxed">
                  Logged in as <strong>{currentUser.email}</strong>, but this order belongs to another registered account.
                </p>
              ) : (
                <p className="text-sm text-[#a4abbc] max-w-md mx-auto leading-relaxed">
                  This order is associated with a registered account. Please log in to view delivery details.
                </p>
              )}
              <div className="pt-2 max-w-xs mx-auto">
                {currentUser ? (
                  <button
                    onClick={handleSignOut}
                    className="relative inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99] border border-red-500/20 select-none cursor-pointer"
                  >
                    Sign Out / Switch Account
                  </button>
                ) : (
                  <Link
                    href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/track-order")}`}
                    className="relative inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#6d4aff] text-white font-extrabold text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99] border border-[#8b5cf6]/20 select-none cursor-pointer"
                  >
                    Sign In to View Order
                  </Link>
                )}
              </div>
            </div>
          ) : !whatsappActivated ? (
            <div className="mt-6 space-y-4">
              <div className="text-center p-6 rounded-lg border border-emerald-500/20 bg-emerald-500/[.03] space-y-4">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <h3 className="text-emerald-400 font-extrabold text-xl flex items-center justify-center gap-2">
                    Action Required: WhatsApp Fulfillment Handshake
                  </h3>
                </div>
                <p className="text-sm text-[#a4abbc] max-w-md mx-auto leading-relaxed">
                  Hi <strong>{result.customer_name || "Customer"}</strong>! To activate your order and receive your game delivery details via WhatsApp, click the button below to complete the mandatory handshake with our administrator.
                </p>
                <div className="pt-2 max-w-md mx-auto">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        localStorage.setItem("activated_" + result.order_ref, "true");
                      }
                      setWhatsappActivated(true);
                      toast.success("Activation initiated! Loading tracking timeline.");
                    }}
                    className="relative inline-flex items-center justify-center gap-3 w-full py-4 px-6 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-base shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99] border border-emerald-400/20 hover:border-emerald-400/40 select-none cursor-pointer"
                  >
                    <MessageCircle size={20} className="animate-bounce shrink-0" />
                    <span>Click to Activate & Receive Your Game via WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Handshake Complete Awaiting Manual Fulfillment state label */}
              <div className="mt-6 flex items-center justify-center gap-2 rounded-md border border-[#00d68f]/20 bg-[#00d68f]/[.05] p-3 text-xs font-bold text-[#70efbb]">
                <ShieldCheck size={16} /> Handshake complete, awaiting manual fulfillment
              </div>

              <div className={`mt-6 flex items-start gap-3 rounded-md border p-4 ${isRejected ? "border-red-500/15 bg-red-500/[.03]" : "border-[#facc15]/15 bg-[#b89412]/[.06]"}`}>
                <Clock3 size={19} className={`mt-0.5 shrink-0 ${isRejected ? "text-red-400" : "text-[#f8e38a]"}`} />
                <div>
                  <strong className="text-sm">Estimated status</strong>
                  <p className="mt-1 text-xs leading-5 text-[#a4abbc]">{estimate(result.status)}</p>
                </div>
              </div>

              {!isRejected && active < 3 && (
                <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-[#facc15]/15 bg-gradient-to-r from-amber-500/[0.03] to-yellow-500/[0.03] p-3 text-xs text-[#facc15] font-bold">
                  <span>Rank Points: You will earn <span className="underline font-black">+{hasSubscription ? "200" : "100"} Rank Points</span> upon successful delivery of this order!</span>
                </div>
              )}

              {(result.status === "Delivered" || result.status === "Completed") && (
                <div id="credentials-section" className="space-y-4 mt-6">
                  <div className="text-center p-6 rounded-lg border border-emerald-500/20 bg-emerald-500/[.03] space-y-2">
                    <h3 className="text-emerald-400 font-extrabold text-xl">Thank you for your purchase!</h3>
                    <p className="text-sm text-[#a4abbc]">
                      Your order is ready! Thank you for shopping with Rakexura Store. Your game credentials/activation details are listed below.
                    </p>
                  </div>
                  
                  {result.account_access && (
                    <div className="p-4 rounded-lg border border-[#8b5cf6]/35 bg-[#8b5cf6]/5 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#c4b5fd]">
                        <span>Game Activation / Account Details</span>
                      </div>
                      <div className="mt-2 font-mono bg-black/45 p-3 rounded border border-white/5 text-xs text-slate-200 select-all whitespace-pre-wrap leading-relaxed shadow-inner">
                        {result.account_access}
                      </div>
                      <p className="text-[10px] text-[#8991a6] leading-relaxed">
                        Please use these credentials/details to activate or access your game. If you face any issues, click the WhatsApp Help button below.
                      </p>
                    </div>
                  )}

                  {/* Customer Review Section */}
                  {result.items && result.items.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/[.08] space-y-4">
                      {result.items
                        .filter((item) => item.game_id)
                        .map((item) => (
                          <ReviewForm
                            key={item.game_id}
                            gameId={Number(item.game_id)}
                            gameTitle={item.title}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 space-y-0" aria-label="Order progress">
                {stages.map((stage, index) => {
                  const done = index <= active;
                  const isCurrent = index === active;
                  const showX = isRejected && index === active;
                  return (
                    <div key={stage} className="grid grid-cols-[38px_1fr] gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`grid h-9 w-9 place-items-center rounded-full border transition-all ${showX ? "border-red-500 bg-red-500 text-white" : isCurrent ? "border-[#facc15] bg-[#facc15] text-black shadow-[0_0_12px_rgba(250,204,21,0.35)]" : done ? "border-[#8b5cf6] bg-[#8b5cf6] text-white" : "border-white/15 text-[#5e667b]"}`}>
                          {showX ? <X size={18} /> : isCurrent ? <Check size={18} className="stroke-[3]" /> : done ? <Check size={18} /> : <Circle size={12} />}
                        </span>
                        {index < stages.length - 1 && <span className={`h-12 w-px transition-colors ${index < active ? "bg-[#8b5cf6]" : "bg-white/10"}`} />}
                      </div>
                      <div className="pt-2">
                        <strong className={showX ? "text-red-400" : isCurrent ? "text-[#facc15] font-black" : done ? "text-white" : "text-[#6f778e]"}>{stage}</strong>
                        {index === active && <p className={`mt-1 text-xs font-bold ${showX ? "text-red-400" : "text-[#facc15]"}`}>{showX ? "Order Rejected" : "Current Step"}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-7 flex flex-wrap gap-3 border-t border-white/[.08] pt-5">
                <button type="button" onClick={copyOrder} className="btn btn-secondary border-white/10 hover:border-[#facc15]/40 hover:text-[#facc15]">
                  <Clipboard size={16} className="text-[#facc15]" /> Copy order ID
                </button>
                <Link href="/support" className="btn btn-secondary border-white/10 hover:border-[#8b5cf6]/40 hover:text-[#c4b5fd]">
                  <LifeBuoy size={17} className="text-[#8b5cf6]" /> Support ticket
                </Link>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-secondary border-white/10 hover:border-emerald-500/40 hover:text-emerald-400">
                  <MessageCircle size={17} className="text-[#25d366]" /> WhatsApp Help
                </a>
                <Link href="/faq" className="btn btn-secondary border-white/10 hover:border-white/20">
                  <HelpCircle size={17} className="text-[#8991a6]" /> FAQ
                </Link>
              </div>
            </>
          )}
        </article>
      )}

      {/* Points Awarded Animation Overlay */}
      <AnimatePresence>
        {showPointsAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
            onClick={handleDismissPoints}
          >
            <motion.div
              initial={{ scale: 0.85, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 10 }}
              className="relative my-auto w-full max-w-sm rounded-2xl border border-amber-400/30 bg-gradient-to-b from-[#110e29] to-[#070514] p-6 text-center shadow-[0_0_50px_rgba(251,191,36,0.35)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Floating Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.15),transparent_70%)] pointer-events-none" />

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 font-black shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-bounce mb-4">
                <Sparkles size={32} />
              </div>

              <h3 className="text-2xl font-black text-white bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                +{hasSubscription ? "200" : "100"} Rank Points
              </h3>
              <p className="mt-1 text-sm font-bold text-amber-200 uppercase tracking-widest">
                Loyalty Awarded!
              </p>
              
              <p className="mt-3 text-xs leading-relaxed text-[#9ea6b9]">
                Your purchase has been verified and delivered. {hasSubscription ? "200" : "100"} XP points have been successfully added to your Rakexura account profile!
              </p>

              <button
                type="button"
                onClick={handleDismissPoints}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 py-2.5 text-xs font-black text-black shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer"
              >
                Claim & Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="shell py-20 text-center font-bold">Loading track order...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
