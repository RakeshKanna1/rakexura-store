"use client";

import { Clock3, PackageCheck, ShieldCheck, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { updateOrderStatus, saveAccountAccess } from "@/app/admin/actions";

const actions = [
  { status: "Verified", label: "Verify payment", icon: ShieldCheck, tone: "text-sky-300 border-sky-400/25 hover:bg-sky-400/10" },
  { status: "Processing", label: "Start delivery", icon: Clock3, tone: "text-amber-200 border-amber-300/25 hover:bg-amber-300/10" },
  { status: "Delivered", label: "Mark delivered", icon: PackageCheck, tone: "text-emerald-300 border-emerald-400/25 hover:bg-emerald-400/10" },
  { status: "Rejected", label: "Reject payment", icon: XCircle, tone: "text-red-300 border-red-400/25 hover:bg-red-400/10" },
] as const;

function cleanPhone(value?: string | null) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function OrderActions({
  id,
  currentStatus,
  customerPhone = "",
  gameName = "Game",
  orderReference = "",
  initialAccountAccess = "",
}: {
  id: number;
  currentStatus: string;
  customerPhone?: string;
  gameName?: string;
  orderReference?: string;
  initialAccountAccess?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [accountAccess, setAccountAccess] = useState(initialAccountAccess);
  const [savingAccess, setSavingAccess] = useState(false);

  async function handleSaveAccess() {
    setSavingAccess(true);
    try {
      const formData = new FormData();
      formData.set("id", String(id));
      formData.set("account_access", accountAccess);
      await saveAccountAccess(formData);
      toast.success("Account access details saved successfully.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save account details");
    } finally {
      setSavingAccess(false);
    }
  }

  function update(status: string, label: string) {
    if (!window.confirm(`${label} for this order? Customer tracking will immediately show "${status}".`)) return;

    // Open WhatsApp synchronously inside user click context so browser popup blockers do not intercept it!
    if (status === "Delivered") {
      const phone = cleanPhone(customerPhone);
      const order = {
        phone,
        gameName,
        id: orderReference || String(id),
      };
      const trackingLink = `https://rakexura-store.vercel.app/track-order?order=${order.id}&phone=${customerPhone}`;

      let textContent = `🎮 *RAKEXURA GAME DELIVERY*\n\n` +
        `📦 *Game:* ${order.gameName}\n` +
        `🆔 *Order ID:* ${order.id}\n\n`;

      if (accountAccess.trim()) {
        textContent += `🔑 *Account/Activation Access Details:*\n${accountAccess.trim()}\n\n`;
      }

      textContent += `🔗 *Track/View Order:* ${trackingLink}\n\n` +
        `✨ *Your order is officially ready! Thank you for shopping with Rakexura Store!*`;

      const encodedText = encodeURIComponent(textContent);
      window.open(`https://wa.me/${order.phone}?text=${encodedText}`, '_blank');
    }

    const formData = new FormData();
    formData.set("id", String(id));
    formData.set("status", status);
    formData.set("account_access", accountAccess);

    startTransition(async () => {
      try {
        const result = await updateOrderStatus(formData);
        
        let description = "";
        if (result.customerMessageSent) {
          description += "WhatsApp sent. ";
        } else if (result.customerMessageError) {
          description += `WhatsApp failed: ${result.customerMessageError.slice(0, 80)}. `;
        } else {
          description += "WhatsApp skipped. ";
        }

        if (result.customerEmailSent) {
          description += "Email sent.";
        } else if (result.customerEmailError) {
          description += `Email failed: ${result.customerEmailError.slice(0, 80)}.`;
        } else {
          description += "Email skipped.";
        }

        if (result.customerMessageSent || result.customerEmailSent) {
          toast.success(result.message, { description });
        } else {
          toast.warning(result.message, { description });
        }

        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update this order");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {actions.map(({ status, label, icon: Icon, tone }) => (
          <button
            key={status}
            type="button"
            disabled={pending || currentStatus === status}
            onClick={() => update(status, label)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-md border bg-black/20 px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-35 ${tone}`}
          >
            <Icon size={14} />
            {currentStatus === status ? `${status} done` : label}
          </button>
        ))}
      </div>

      <div className="mt-4 p-4 rounded-lg border border-[#8b5cf6]/20 bg-[#8b5cf6]/5 space-y-3">
        <label className="block text-xs font-extrabold uppercase tracking-wider text-[#cbbfff]">
          🔑 Game Activation / Account Details (User ID, Pass, or Keys)
          <textarea
            value={accountAccess}
            onChange={(e) => setAccountAccess(e.target.value)}
            placeholder="e.g. Username: user123&#10;Password: pass123&#10;or Activation Key: XXXX-XXXX-XXXX"
            className="mt-2 min-h-20 w-full rounded-md border border-white/10 bg-black/40 p-2.5 font-mono text-xs text-white outline-none focus:border-[#8b5cf6] resize-none"
          />
        </label>
        <button
          type="button"
          disabled={savingAccess || initialAccountAccess === accountAccess}
          onClick={handleSaveAccess}
          className="inline-flex min-h-8 items-center gap-1.5 rounded border border-white/10 bg-white/[0.05] hover:bg-white/10 px-3 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"
        >
          {savingAccess ? "Saving..." : "Save Access Info"}
        </button>
      </div>
    </div>
  );
}
