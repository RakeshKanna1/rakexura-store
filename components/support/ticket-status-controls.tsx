"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { updateSupportTicketStatus } from "@/app/admin/actions";

type TicketStatusControlsProps = {
  ticketId: number;
  currentStatus: string;
  isStaff: boolean;
};

export function TicketStatusControls({ ticketId, currentStatus, isStaff }: TicketStatusControlsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("ticket_id", String(ticketId));
        formData.append("status", newStatus);
        await updateSupportTicketStatus(formData);
        setStatus(newStatus);
        if (newStatus === "resolved") {
          toast.success("Ticket marked as Resolved! Intimation notification sent to customer.");
        } else if (newStatus === "closed") {
          toast.success("Ticket closed.");
        } else {
          toast.success(`Ticket status updated to ${newStatus}.`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update ticket status";
        toast.error(msg);
      }
    });
  };

  const getBadgeClass = (s: string) => {
    switch (s.toLowerCase()) {
      case "resolved":
      case "approved":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
      case "closed":
        return "border-gray-500/30 bg-gray-500/10 text-gray-400";
      case "in_progress":
        return "border-amber-500/30 bg-amber-500/10 text-amber-400";
      default:
        return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black capitalize tracking-wide ${getBadgeClass(status)}`}>
        {status === "resolved" ? <CheckCircle2 size={13} /> : status === "in_progress" ? <Clock size={13} /> : status === "closed" ? <XCircle size={13} /> : <AlertCircle size={13} />}
        {status.replace("_", " ")}
      </span>

      {/* Action Buttons for Staff and Customer */}
      <div className="flex flex-wrap items-center gap-2">
        {status !== "resolved" && (
          <button
            type="button"
            onClick={() => handleStatusChange("resolved")}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50 cursor-pointer select-none"
          >
            {isPending ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Mark as Resolved
          </button>
        )}

        {status !== "closed" && (
          <button
            type="button"
            onClick={() => handleStatusChange("closed")}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-bold text-[#8991a6] transition hover:bg-white/10 hover:text-white disabled:opacity-50 cursor-pointer select-none"
          >
            Close Ticket
          </button>
        )}

        {(status === "resolved" || status === "closed") && (
          <button
            type="button"
            onClick={() => handleStatusChange("open")}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 px-3 py-1.5 text-xs font-bold text-[#b9a4ff] transition hover:bg-[#8b5cf6]/20 disabled:opacity-50 cursor-pointer select-none"
          >
            Reopen Ticket
          </button>
        )}
      </div>
    </div>
  );
}
