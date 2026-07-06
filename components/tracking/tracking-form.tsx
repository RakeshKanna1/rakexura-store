"use client";

import Link from "next/link";
import { Check, Circle, Clipboard, Clock3, HelpCircle, LifeBuoy, MessageCircle, Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Confetti } from "@/components/common/confetti";

type TrackedOrder = { order_id: number; order_ref: string; status: string; total_price: number; created_at: string; items: Array<{ title: string; platform: string }>; customer_name: string; auth_required?: boolean; account_access?: string };
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
  if (index === 3) return "Delivery completed";
  if (index === 2) return "Delivery is being prepared";
  if (index === 1) return "Usually delivered shortly after verification";
  return "Payment review is normally completed as soon as staff confirms the screenshot";
}

export function TrackingForm() {
  const params = useSearchParams();
  const [order, setOrder] = useState(params.get("order") ?? "");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [whatsappActivated, setWhatsappActivated] = useState(false);

  const [showConfetti, setShowConfetti] = useState(false);

  async function track() {
    if (!order.trim() || phone.replace(/\D/g, "").length < 10) return toast.error("Enter your order reference and full WhatsApp number");
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("track_store_order", { p_order_reference: order.trim(), p_phone_suffix: phone.replace(/\D/g, "") });
    setLoading(false);
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) { setResult(null); return toast.error("Order not found. Check both details."); }
    
    const casted = row as TrackedOrder;
    setResult(casted);
    setWhatsappActivated(typeof window !== "undefined" && localStorage.getItem("activated_" + casted.order_ref) === "true");

    if (casted.status === "Delivered" || casted.status === "Completed") {
      setShowConfetti(true);
      setTimeout(() => {
        const el = document.getElementById("credentials-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 800);
    }
  }

  async function copyOrder() { if (!result) return; await navigator.clipboard.writeText(result.order_ref); toast.success("Order reference copied"); }
  const active = result ? stageIndex(result.status) : 0;
  const isRejected = result ? result.status.toLowerCase() === "rejected" : false;
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695";

  return (
    <div>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div className="glass rounded-lg p-5">
        <div className="mb-4">
          <h2 className="font-black">Find your order</h2>
          <p className="mt-1 text-sm text-[#8991a6]">Use the reference shown after checkout and the same WhatsApp number used for delivery.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label htmlFor="tracking-form-order-ref" className="text-xs font-bold text-[#aeb5c8]">
            Order reference
            <input id="tracking-form-order-ref" name="order_ref" value={order} onChange={(event) => setOrder(event.target.value)} autoComplete="off" placeholder="RKX-2606-000123" className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 text-sm outline-none focus:border-[#facc15]" />
          </label>
          <label htmlFor="tracking-form-phone" className="text-xs font-bold text-[#aeb5c8]">
            WhatsApp number
            <input id="tracking-form-phone" name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="91 98765 43210" inputMode="tel" className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/25 px-4 text-sm outline-none focus:border-[#facc15]" />
          </label>
          <button onClick={track} disabled={loading} className="btn btn-primary mt-auto min-h-12 disabled:opacity-50">
            <Search size={17} />
            {loading ? "Checking..." : "Track order"}
          </button>
        </div>
      </div>

      {result && (
        <article className="premium-panel mt-6 rounded-lg p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[.08] pb-6">
            <div>
              <p className="eyebrow">Order reference</p>
              <button type="button" onClick={copyOrder} className="mt-2 inline-flex min-h-11 items-center gap-2 text-2xl font-black hover:text-[#f8e38a]" aria-label="Copy order reference">
                {result.order_ref}
                <Clipboard size={16} />
              </button>
              {result.auth_required ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-[#facc15] font-bold">
                  <span>🔒 Protected Customer Order</span>
                </div>
              ) : (
                <h2 className="mt-3 text-lg font-bold">{result.items?.map((item) => item.title).join(", ") || "Game order"}</h2>
              )}
            </div>
            <div className="text-right">
              <strong className="text-xl">{result.auth_required ? "Rs. --" : formatPrice(result.total_price)}</strong>
              <span className={`mt-2 block rounded-md px-3 py-2 text-xs font-bold ${isRejected ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-white/[.06]"}`}>{result.status}</span>
            </div>
          </div>

          {result.auth_required ? (
            <div className="mt-6 text-center p-8 rounded-lg border border-yellow-500/20 bg-yellow-500/[.03] space-y-4">
              <div className="flex flex-col items-center justify-center space-y-2">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400 text-lg">
                  🔒
                </span>
                <h3 className="text-yellow-400 font-extrabold text-xl">
                  Authentication Required
                </h3>
              </div>
              <p className="text-sm text-[#a4abbc] max-w-md mx-auto leading-relaxed">
                This order is associated with a registered Rakexura account. Please log in with the buyer&apos;s account to view the tracking details, status updates, and game activation info.
              </p>
              <div className="pt-2 max-w-xs mx-auto">
                <Link
                  href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/track-order")}`}
                  className="relative inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#6d4aff] text-white font-extrabold text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99] border border-[#8b5cf6]/20 select-none cursor-pointer"
                >
                  Sign In to View Order
                </Link>
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
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! I just purchased ${result.items?.map((item) => item.title).join(", ") || "Game"} (Order: ${result.order_ref}). Please send over my activation details!`)}`}
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
              <div className={`mt-6 flex items-start gap-3 rounded-md border p-4 ${isRejected ? "border-red-500/15 bg-red-500/[.03]" : "border-[#facc15]/15 bg-[#b89412]/[.06]"}`}>
                <Clock3 size={19} className={`mt-0.5 shrink-0 ${isRejected ? "text-red-400" : "text-[#f8e38a]"}`} />
                <div>
                  <strong className="text-sm">Estimated status</strong>
                  <p className="mt-1 text-xs leading-5 text-[#a4abbc]">{estimate(result.status)}</p>
                </div>
              </div>

              {(result.status === "Delivered" || result.status === "Completed") && (
                <div id="credentials-section" className="space-y-4 mt-6">
                  <div className="text-center p-6 rounded-lg border border-emerald-500/20 bg-emerald-500/[.03] space-y-2">
                    <h3 className="text-emerald-400 font-extrabold text-xl">🎉 Thank you for your purchase!</h3>
                    <p className="text-sm text-[#a4abbc]">
                      Your order is ready! Thank you for shopping with Rakexura Store. Your game credentials/activation details are listed below.
                    </p>
                  </div>
                  
                  {result.account_access && (
                    <div className="p-4 rounded-lg border border-[#8b5cf6]/35 bg-[#8b5cf6]/5 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#c4b5fd]">
                        <span>🔑 Game Activation / Account Details</span>
                      </div>
                      <div className="mt-2 font-mono bg-black/45 p-3 rounded border border-white/5 text-xs text-slate-200 select-all whitespace-pre-wrap leading-relaxed shadow-inner">
                        {result.account_access}
                      </div>
                      <p className="text-[10px] text-[#8991a6] leading-relaxed">
                        Please use these credentials/details to activate or access your game. If you face any issues, click the WhatsApp Help button below.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-8 space-y-0" aria-label="Order progress">
                {stages.map((stage, index) => {
                  const done = index <= active;
                  const showX = isRejected && index === active;
                  return (
                    <div key={stage} className="grid grid-cols-[38px_1fr] gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`grid h-9 w-9 place-items-center rounded-full border ${showX ? "border-red-500 bg-red-500 text-white" : done ? "border-[#00d88a] bg-[#00d88a] text-black" : "border-white/15 text-[#5e667b]"}`}>
                          {showX ? <X size={18} /> : done ? <Check size={18} /> : <Circle size={12} />}
                        </span>
                        {index < stages.length - 1 && <span className={`h-12 w-px ${index < active ? "bg-[#00d88a]" : "bg-white/10"}`} />}
                      </div>
                      <div className="pt-2">
                        <strong className={showX ? "text-red-400" : done ? "text-white" : "text-[#6f778e]"}>{stage}</strong>
                        {index === active && <p className={`mt-1 text-xs ${showX ? "text-red-400 font-bold" : "text-[#8991a6]"}`}>{showX ? "Order Rejected" : "Current step"}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-7 flex flex-wrap gap-3 border-t border-white/[.08] pt-5">
                <button type="button" onClick={copyOrder} className="btn btn-secondary">
                  <Clipboard size={16} /> Copy order ID
                </button>
                <Link href="/support" className="btn btn-secondary">
                  <LifeBuoy size={17} /> Support ticket
                </Link>
                <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi Rakexura, I need help with order ${result.order_ref}.`)}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
                  <MessageCircle size={17} /> WhatsApp
                </a>
                <Link href="/faq" className="btn btn-secondary">
                  <HelpCircle size={17} /> FAQ
                </Link>
              </div>
            </>
          )}
        </article>
      )}
    </div>
  );
}
