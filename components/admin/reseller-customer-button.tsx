"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ShieldAlert, ShieldX, X, Percent } from "lucide-react";
import { toast } from "sonner";
import { toggleResellerStatus } from "@/app/admin/actions";
import { ResellerIcon } from "@/components/ui/reseller-badge";

type ResellerCustomerButtonProps = {
  userId: string;
  customerName?: string;
  isReseller: boolean;
  currentDiscount?: number;
};

const PRESET_DISCOUNTS = [15, 20, 25, 30, 35];

export function ResellerCustomerButton({
  userId,
  customerName,
  isReseller,
  currentDiscount = 25,
}: ResellerCustomerButtonProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeReseller, setActiveReseller] = useState(isReseller);
  const [discount, setDiscount] = useState(currentDiscount || 25);

  useEffect(() => {
    setMounted(true);
    setActiveReseller(isReseller);
    setDiscount(currentDiscount || 25);
  }, [isReseller, currentDiscount]);

  const handleToggle = (targetStatus: boolean) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("isReseller", String(targetStatus));
        formData.append("discount", String(discount));

        await toggleResellerStatus(formData);
        setActiveReseller(targetStatus);
        toast.success(
          targetStatus
            ? `Granted Reseller Badge to ${customerName || "customer"} with ${discount}% discount.`
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
        <div className="rounded-lg border border-white/10 bg-[#18181e] p-3.5 text-xs text-[#b8bfd0] leading-relaxed break-words whitespace-normal">
          {activeReseller ? (
            <span>
              This user is currently an active <strong className="text-[#facc15]">Verified Wholesale Reseller</strong> with a <strong className="text-white">{discount}%</strong> discount rate. You can revoke their access or change their discount below.
            </span>
          ) : (
            <span>
              Granting reseller status unlocks <strong className="text-[#facc15]">wholesale rates</strong> across the store and gives this user access to the Reseller Client Delivery Hub. Retail promo coupons cannot be stacked by resellers.
            </span>
          )}
        </div>

        {/* Wholesale Rate Settings */}
        <div className="space-y-3 rounded-lg border border-white/10 bg-[#18181e] p-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8991a6] flex items-center gap-1.5">
              <Percent size={13} className="text-[#facc15]" />
              <span>Wholesale Discount Rate</span>
            </label>
            <span className="text-xs font-black text-[#facc15]">
              {discount}% OFF Retail
            </span>
          </div>

          {/* 5-Column Clean Preset Chips Grid */}
          <div className="grid grid-cols-5 gap-2">
            {PRESET_DISCOUNTS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setDiscount(rate)}
                className={`rounded-md py-2 text-xs font-bold transition text-center cursor-pointer ${
                  discount === rate
                    ? "border border-[#facc15] bg-[#facc15] text-black font-black shadow-sm"
                    : "border border-white/10 bg-[#121216] text-[#8991a6] hover:text-white hover:border-white/30"
                }`}
              >
                {rate}%
              </button>
            ))}
          </div>

          {/* Custom Percentage Input Field */}
          <div className="pt-2 border-t border-white/5 flex items-center gap-3">
            <div className="relative w-28 shrink-0">
              <input
                type="number"
                min="0"
                max="90"
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
                    setDiscount(Math.max(0, Math.min(90, num)));
                  }
                }}
                className="h-10 w-full rounded-md border border-white/15 bg-[#121216] px-3 pr-7 text-sm font-bold text-white outline-none focus:border-[#facc15] transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8991a6]">
                %
              </span>
            </div>
            <p className="text-[11px] text-[#8991a6] leading-tight">
              Type any custom rate (e.g. 5%, 8%, 12%) or select a preset above.
            </p>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
          {activeReseller ? (
            <button
              type="button"
              onClick={() => handleToggle(false)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition cursor-pointer"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldX size={14} />}
              <span>De-seller (Revoke)</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={isPending}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-[#8991a6] hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>

            {activeReseller ? (
              <button
                type="button"
                onClick={() => handleToggle(true)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#facc15] px-5 py-2.5 text-xs font-black text-black hover:bg-[#ffe45c] active:scale-[0.98] transition cursor-pointer"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Update Rate
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggle(true)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#facc15] px-5 py-2.5 text-xs font-black text-black hover:bg-[#ffe45c] active:scale-[0.98] transition cursor-pointer"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Activate Reseller
              </button>
            )}
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
        title={activeReseller ? "Click to De-seller or update rate" : "Grant Reseller Badge"}
      >
        {activeReseller ? (
          <ShieldX className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <ResellerIcon className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{activeReseller ? "De-seller" : "Make Reseller"}</span>
      </button>

      {modalContent && typeof document !== "undefined" ? createPortal(modalContent, document.body) : null}
    </>
  );
}
