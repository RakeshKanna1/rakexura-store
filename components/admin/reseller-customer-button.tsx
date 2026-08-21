"use client";

import { useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [discount, setDiscount] = useState(currentDiscount || 25);

  const handleToggle = (targetStatus: boolean) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("isReseller", String(targetStatus));
        formData.append("discount", String(discount));

        await toggleResellerStatus(formData);
        toast.success(
          targetStatus
            ? `Granted Reseller Badge to ${customerName || "customer"} with ${discount}% discount.`
            : `Revoked Reseller Access (De-seller) for ${customerName || "customer"}.`
        );
        setModalOpen(false);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update reseller status";
        toast.error(msg);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer select-none ${
          isReseller
            ? "border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
            : "border border-white/15 bg-white/[0.04] text-[#d4d9e8] hover:border-[#facc15]/40 hover:bg-[#facc15]/10 hover:text-[#facc15]"
        }`}
        title={isReseller ? "Click to De-seller or update rate" : "Grant Reseller Badge"}
      >
        {isReseller ? (
          <ShieldX className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <ResellerIcon className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{isReseller ? "De-seller" : "Make Reseller"}</span>
      </button>

      {/* RAKEXURA SIGNATURE THEMED MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#8b5cf6]/30 bg-[#0c0919] p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_35px_rgba(139,92,246,0.12)] backdrop-blur-2xl space-y-6">
            
            {/* Ambient Glow Accents */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8b5cf6]/15 filter blur-3xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-[#facc15]/10 filter blur-3xl" />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${
                    isReseller
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                      : "border-[#facc15]/40 bg-[#facc15]/10 text-[#facc15]"
                  } shadow-[0_0_15px_rgba(250,204,21,0.2)]`}
                >
                  {isReseller ? <ShieldAlert className="w-7 h-7" /> : <ResellerIcon className="w-7 h-7" />}
                </div>
                <div>
                  <p className="eyebrow text-xs font-black uppercase tracking-wider text-[#b9a4ff]">
                    Reseller Management
                  </p>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {isReseller ? "Revoke or Update Reseller Access" : "Grant Verified Reseller Access"}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#8991a6]">
                    Account: <strong className="text-white">{customerName || "Customer"}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-[#8991a6] hover:text-white hover:border-white/20 transition cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Info Box */}
            <div className="relative z-10 rounded-xl border border-white/[0.08] bg-[#070512]/80 p-4 text-xs text-[#a0a8c0] leading-relaxed">
              {isReseller ? (
                <span>
                  This account currently has <strong className="text-[#facc15] font-bold">Reseller Wholesale Access</strong> with a <strong className="text-white font-bold">{currentDiscount}%</strong> discount rate. You can revoke their access below or update their discount rate.
                </span>
              ) : (
                <span>
                  Verified Resellers receive dedicated <strong className="text-[#facc15] font-bold">wholesale pricing</strong> across the catalog and unlock access to the <strong className="text-white font-bold">Client Delivery Hub</strong>.
                </span>
              )}
            </div>

            {/* Discount Rate Controls */}
            <div className="relative z-10 space-y-3 rounded-xl border border-[#8b5cf6]/20 bg-[#0e0a22]/70 p-4.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Percent size={13} className="text-[#facc15]" />
                  <span>Wholesale Discount Rate</span>
                </label>
                <span className="text-[11px] font-bold text-[#facc15]">
                  {discount}% OFF Retail
                </span>
              </div>

              {/* Preset Rate Chips */}
              <div className="flex flex-wrap gap-2">
                {PRESET_DISCOUNTS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setDiscount(rate)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-black transition cursor-pointer ${
                      discount === rate
                        ? "border border-[#facc15] bg-[#facc15]/20 text-[#facc15] shadow-[0_0_10px_rgba(250,204,21,0.25)]"
                        : "border border-white/10 bg-black/40 text-[#8991a6] hover:text-white hover:border-white/25"
                    }`}
                  >
                    {rate}% OFF
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="mt-2 flex items-center gap-3">
                <div className="relative w-32">
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Math.min(90, Number(e.target.value))))}
                    className="h-11 w-full rounded-lg border border-[#8b5cf6]/30 bg-[#070512] px-3.5 pr-8 text-sm font-black text-white outline-none focus:border-[#b9a4ff] focus:ring-1 focus:ring-[#8b5cf6]/40 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8991a6]">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-[#8991a6] leading-snug">
                  Applied to items without custom fixed wholesale rates.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="relative z-10 flex items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
              {isReseller ? (
                <button
                  type="button"
                  onClick={() => handleToggle(false)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/25 transition cursor-pointer"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldX size={14} />}
                  <span>De-seller (Revoke Access)</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isPending}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-[#8991a6] hover:text-white hover:border-white/20 transition cursor-pointer"
                >
                  Cancel
                </button>

                {isReseller ? (
                  <button
                    type="button"
                    onClick={() => handleToggle(true)}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ffe45c] via-[#facc15] to-[#f59e0b] px-5 py-2.5 text-xs font-black text-black shadow-[0_0_18px_rgba(250,204,21,0.25)] hover:shadow-[0_0_24px_rgba(250,204,21,0.4)] hover:brightness-110 active:scale-[0.98] transition cursor-pointer"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    Update Rate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggle(true)}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ffe45c] via-[#facc15] to-[#f59e0b] px-5 py-2.5 text-xs font-black text-black shadow-[0_0_18px_rgba(250,204,21,0.25)] hover:shadow-[0_0_24px_rgba(250,204,21,0.4)] hover:brightness-110 active:scale-[0.98] transition cursor-pointer"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    Activate Reseller
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
