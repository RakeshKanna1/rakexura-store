"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteCustomerAccount } from "@/app/admin/actions";

type DeleteCustomerButtonProps = {
  userId: string;
  customerName?: string;
};

export function DeleteCustomerButton({ userId, customerName }: DeleteCustomerButtonProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("userId", userId);
        await deleteCustomerAccount(formData);
        toast.success(`Customer ${customerName ? `"${customerName}"` : ""} deleted successfully.`);
        setConfirmOpen(false);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to delete customer";
        toast.error(msg);
        console.error("Delete customer error:", err);
      }
    });
  };

  const modalContent = confirmOpen && mounted ? (
    <div
      className="fixed inset-0 z-[99999] flex min-h-screen items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) setConfirmOpen(false);
      }}
    >
      <div className="relative my-auto w-full max-w-md rounded-xl border border-white/15 bg-[#121216] p-6 shadow-2xl space-y-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 text-red-400">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red-500/10 border border-red-500/20">
              <Trash2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Customer Account</h3>
              <p className="text-xs text-[#8991a6]">This action cannot be undone.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="grid h-7 w-7 place-items-center rounded-md border border-white/10 text-[#8991a6] hover:text-white hover:border-white/20 transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-xs text-[#b8bfd0] leading-relaxed break-words">
          Are you sure you want to delete customer <strong className="text-white">{customerName || userId}</strong>? This will permanently remove their profile, notifications, and associated store data.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            disabled={isPending}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-[#8991a6] hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Deleting...
              </>
            ) : (
              "Yes, Delete Account"
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
        title="Delete customer profile"
      >
        <Trash2 size={13} /> Delete
      </button>

      {modalContent && typeof document !== "undefined" ? createPortal(modalContent, document.body) : null}
    </>
  );
}
