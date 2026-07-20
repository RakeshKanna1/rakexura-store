"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCustomerAccount } from "@/app/admin/actions";

type DeleteCustomerButtonProps = {
  userId: string;
  customerName?: string;
};

export function DeleteCustomerButton({ userId, customerName }: DeleteCustomerButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("userId", userId);
        await deleteCustomerAccount(formData);
        toast.success(`Customer ${customerName ? `"${customerName}"` : ""} deleted successfully.`);
        setConfirmOpen(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to delete customer";
        toast.error(msg);
        console.error("Delete customer error:", err);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 cursor-pointer"
        title="Delete customer profile"
      >
        <Trash2 size={13} /> Delete
      </button>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#0e0b1f] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-red-500/10 border border-red-500/20">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Delete Customer Account</h3>
                <p className="text-xs text-[#8991a6]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[#d0d6e5] leading-relaxed">
              Are you sure you want to delete customer <strong className="text-white">{customerName || userId}</strong>? This will permanently remove their profile, notifications, and associated store data.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-[#8991a6] hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-red-500 transition cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  "Yes, Delete Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
