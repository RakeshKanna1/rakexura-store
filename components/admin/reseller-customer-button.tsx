"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ShieldAlert, ShieldX, X } from "lucide-react";
import { toast } from "sonner";
import { toggleResellerStatus } from "@/app/admin/actions";
import { ResellerIcon } from "@/components/ui/reseller-badge";
import { calculateResellerPrice, type ResellerAdjustmentType } from "@/lib/utils";

type ResellerCustomerButtonProps = {
  userId: string;
  customerName?: string;
  isReseller: boolean;
  currentDiscount?: number;
  currentDiscountType?: string;
};

const PRESETS: Record<ResellerAdjustmentType, number[]> = {
  percentage: [15, 20, 25, 30, 35],
  flat: [25, 50, 75, 100, 150],
  markup_flat: [10, 20, 30, 50, 100],
  markup_percentage: [5, 10, 15, 20, 25],
};

export function ResellerCustomerButton({
  userId,
  customerName,
  isReseller,
  currentDiscount = 25,
  currentDiscountType = "percentage",
}: ResellerCustomerButtonProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeReseller, setActiveReseller] = useState(isReseller);
  const [discount, setDiscount] = useState(currentDiscount || 25);
  const [discountType, setDiscountType] = useState<ResellerAdjustmentType>(
    (currentDiscountType as ResellerAdjustmentType) || "percentage"
  );

  useEffect(() => {
    setMounted(true);
    setActiveReseller(isReseller);
    setDiscount(currentDiscount || 25);
    setDiscountType((currentDiscountType as ResellerAdjustmentType) || "percentage");
  }, [isReseller, currentDiscount, currentDiscountType]);

  const preview = calculateResellerPrice(500, discount, discountType);

  const handleToggle = (targetStatus: boolean) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("isReseller", String(targetStatus));
        formData.append("discount", String(discount));
        formData.append("discountType", discountType);

        await toggleResellerStatus(formData);
        setActiveReseller(targetStatus);
        toast.success(
          targetStatus
            ? `Granted Reseller Badge to ${customerName || "customer"} with ${preview.label} wholesale rate.`
            : `Revoked Reseller Access for ${customerName || "customer"}.`
        );
        setModalOpen(false);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update reseller status";
        toast.error(msg);
      }
    });
  };

  const modalContent = modalOpen && mounted ? (
    <div
      className="fixed inset-0 z-[99999] flex min-h-screen items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) setModalOpen(false);
      }}
    >
      <div className="relative my-auto w-full max-w-lg overflow-hidden rounded-xl border border-white/15 bg-[#121216] p-6 shadow-2xl space-y-5 text-left">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-white/10 bg-[#1a1a20] text-[#facc15]">
              {activeReseller ? <ShieldAlert className="w-6 h-6 text-amber-400" /> : <ResellerIcon className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {activeReseller ? "Manage Reseller Access" : "Grant Reseller Access"}
              </h3>
              <p className="text-xs text-[#8991a6] mt-0.5">
                Account: <span className="text-white font-semibold">{customerName || "Customer"}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/5 text-[#8991a6] hover:text-white hover:border-white/20 transition cursor-pointer"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Description Info Banner */}
        <div className="rounded-xl border border-white/10 bg-[#16161c] p-3.5 text-xs text-[#b8bfd0] leading-relaxed break-words whitespace-normal">
          {activeReseller ? (
            <span>
              This user is currently an active <strong className="text-[#facc15]">Verified Wholesale Reseller</strong> with <strong className="text-white font-mono">{preview.label}</strong> rate. You can adjust the deduction/markup mode or revoke access below.
            </span>
          ) : (
            <span>
              Granting reseller status unlocks <strong className="text-[#facc15]">custom wholesale pricing</strong> across the catalog and gives this user access to the Reseller Client Delivery Hub.
            </span>
          )}
        </div>

        {/* Deduction / Adjustment Type Selector */}
        <div className="space-y-4 rounded-xl border border-white/10 bg-[#16161c] p-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8991a6] block">
              Price Adjustment Mode
            </label>
            <p className="text-[11px] text-[#6b7280] mt-0.5">
              Choose how rates should be adjusted for this reseller partner.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              {
                type: "percentage" as const,
                title: "% Discount",
                tag: "Rate Cut",
                sample: "-25% OFF",
                defaultVal: 25,
              },
              {
                type: "flat" as const,
                title: "₹ Flat Discount",
                tag: "Cash Cut",
                sample: "-₹50 OFF",
                defaultVal: 50,
              },
              {
                type: "markup_flat" as const,
                title: "₹ Flat Markup",
                tag: "Cash Add",
                sample: "+₹30 ADD",
                defaultVal: 30,
              },
              {
                type: "markup_percentage" as const,
                title: "% Markup",
                tag: "Rate Add",
                sample: "+10% ADD",
                defaultVal: 10,
              },
            ].map((opt) => {
              const isSelected = discountType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => {
                    setDiscountType(opt.type);
                    setDiscount(opt.defaultVal);
                  }}
                  className={`relative flex flex-col justify-between rounded-xl p-3 text-left transition duration-150 cursor-pointer border ${
                    isSelected
                      ? "border-[#facc15] bg-[#facc15]/10 shadow-[0_0_12px_rgba(250,204,21,0.12)] ring-1 ring-[#facc15]/40"
                      : "border-white/10 bg-[#0f0f14] hover:border-white/20 hover:bg-[#14141a]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isSelected ? "text-[#facc15]" : "text-[#6b7280]"}`}>
                      {opt.tag}
                    </span>
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#facc15] shadow-[0_0_5px_#facc15]" />
                    )}
                  </div>
                  <div className="mt-2.5">
                    <strong className={`block text-xs font-bold leading-tight ${isSelected ? "text-white" : "text-[#b0b7c8]"}`}>
                      {opt.title}
                    </strong>
                    <span className={`mt-1 inline-block text-[11px] font-extrabold font-mono ${isSelected ? "text-[#facc15]" : "text-[#6b7280]"}`}>
                      {opt.sample}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Preset Buttons Grid */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#8991a6] uppercase tracking-wide">
                Quick Presets
              </span>
              <span className="text-xs font-black text-[#facc15]">
                Current Value: {preview.label}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {PRESETS[discountType].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDiscount(val)}
                  className={`rounded-lg py-2 text-xs font-bold transition text-center cursor-pointer ${
                    discount === val
                      ? "border border-[#facc15] bg-[#facc15]/20 text-[#facc15] font-black shadow-sm"
                      : "border border-white/10 bg-[#0f0f14] text-[#8991a6] hover:text-white hover:border-white/25"
                  }`}
                >
                  {discountType.includes("percentage") ? `${val}%` : `₹${val}`}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input Field */}
          <div className="pt-2 border-t border-white/5 flex items-center gap-3">
            <div className="relative w-32 shrink-0">
              <input
                type="number"
                min="0"
                max={discountType.includes("percentage") ? 90 : 5000}
                value={discount === 0 ? "" : discount}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setDiscount(0);
                    return;
                  }
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    setDiscount(Math.max(0, num));
                  }
                }}
                className="h-10 w-full rounded-lg border border-white/15 bg-[#0f0f14] px-3 pr-8 text-sm font-bold text-white outline-none focus:border-[#facc15] transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8991a6]">
                {discountType.includes("percentage") ? "%" : "₹"}
              </span>
            </div>
            <p className="text-[11px] text-[#8991a6] leading-tight">
              Type any custom numerical value or choose from quick presets above.
            </p>
          </div>

          {/* Live Pricing Preview Simulation */}
          <div className="rounded-xl border border-amber-400/25 bg-[#1f1a0e] p-3.5 text-xs flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <span className="text-[#a0a8c0] font-medium">
              Simulation on <strong className="text-white font-bold">₹500 Game</strong>:
            </span>
            <div className="flex items-center gap-2">
              {preview.isDiscount ? (
                <>
                  <del className="text-[#646b7b] font-medium">₹500</del>
                  <strong className="text-base font-black bg-gradient-to-r from-[#fff5d6] via-[#e8d59e] to-[#d6bd78] bg-clip-text text-transparent">
                    ₹{preview.price}
                  </strong>
                  <span className="rounded-md bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-[10px] font-black text-[#facc15]">
                    {preview.label}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs text-[#8991a6]">₹500 {preview.label} =</span>
                  <strong className="text-base font-black bg-gradient-to-r from-[#fff5d6] via-[#e8d59e] to-[#d6bd78] bg-clip-text text-transparent">
                    ₹{preview.price}
                  </strong>
                  <span className="rounded-md bg-sky-400/15 border border-sky-400/30 px-2 py-0.5 text-[10px] font-black text-sky-300">
                    {preview.label}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-white/10">
          {activeReseller ? (
            <button
              type="button"
              onClick={() => handleToggle(false)}
              disabled={isPending}
              className="h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 text-xs font-bold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <ShieldX size={15} />}
              <span>Revoke Access</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={isPending}
              className="h-11 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-[#8991a6] hover:text-white hover:bg-white/10 transition cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleToggle(true)}
              disabled={isPending}
              className="h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ffe45c] via-[#facc15] to-[#f59e0b] px-5 text-xs font-black text-black shadow-[0_0_15px_rgba(250,204,21,0.25)] hover:brightness-110 active:scale-[0.98] transition cursor-pointer whitespace-nowrap shrink-0"
            >
              {isPending ? <Loader2 size={15} className="animate-spin text-black" /> : <ShieldCheck size={15} className="text-black" />}
              <span>{activeReseller ? "Update Rate" : "Activate Reseller"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition whitespace-nowrap shrink-0 cursor-pointer select-none ${
          activeReseller
            ? "border border-amber-400/30 bg-[#16171d] text-[#e0ce9a] hover:border-amber-400/60 hover:bg-amber-500/10 shadow-sm"
            : "border border-white/10 bg-white/[0.03] text-[#8f96a8] hover:border-white/25 hover:text-white hover:bg-white/[0.06]"
        }`}
        title={activeReseller ? "Click to edit rate or revoke status" : "Grant Reseller Badge"}
      >
        {activeReseller ? (
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <ResellerIcon className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{activeReseller ? "Edit Rate" : "Make Reseller"}</span>
      </button>

      {modalContent && typeof document !== "undefined" ? createPortal(modalContent, document.body) : null}
    </>
  );
}
