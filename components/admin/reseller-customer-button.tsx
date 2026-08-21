"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { toggleResellerStatus } from "@/app/admin/actions";
import { ResellerIcon } from "@/components/ui/reseller-badge";

type ResellerCustomerButtonProps = {
  userId: string;
  customerName?: string;
  isReseller: boolean;
  currentDiscount?: number;
};

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
            : `Revoked Reseller Badge from ${customerName || "customer"}.`
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
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition cursor-pointer select-none ${
          isReseller
            ? "bg-[#facc15]/15 border border-[#facc15]/40 text-[#facc15] hover:bg-[#facc15]/25"
            : "bg-white/5 border border-white/10 text-[#8991a6] hover:text-white hover:border-white/20"
        }`}
        title={isReseller ? "Manage Reseller Access" : "Grant Reseller Badge"}
      >
        <ResellerIcon className="w-3.5 h-3.5" />
        <span>{isReseller ? "Reseller Active" : "Make Reseller"}</span>
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#0e0b1c] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#facc15]/10 text-[#facc15]">
                <ResellerIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {isReseller ? "Manage Reseller Partner" : "Grant Verified Reseller Access"}
                </h3>
                <p className="text-xs text-[#8991a6]">
                  {customerName ? `Account: ${customerName}` : `User ID: ${userId}`}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#a0a8c0] leading-relaxed">
              Verified Resellers see dedicated **wholesale rates** on the store and checkout, plus access to their Reseller Hub.
            </p>

            <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3.5">
              <label className="text-xs font-bold text-white block">
                Wholesale Discount Rate (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="25"
                  className="h-10 w-24 rounded border border-white/10 bg-black/50 px-3 text-sm font-bold text-white outline-none focus:border-[#facc15]"
                />
                <span className="text-xs text-[#8991a6]">
                  % OFF retail price across games without custom wholesale rates
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={isPending}
                className="rounded-md border border-white/10 bg-transparent px-3 py-2 text-xs font-bold text-[#8991a6] hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>

              {isReseller ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleToggle(false)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 transition cursor-pointer"
                  >
                    {isPending ? <Loader2 size={13} className="animate-spin" /> : <ShieldAlert size={13} />}
                    Revoke Badge
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(true)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#facc15] px-4 py-2 text-xs font-black text-black hover:bg-[#ffe45c] transition cursor-pointer"
                  >
                    {isPending ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                    Update Discount
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggle(true)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#facc15] px-4 py-2 text-xs font-black text-black hover:bg-[#ffe45c] transition cursor-pointer"
                >
                  {isPending ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                  Activate Reseller
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
