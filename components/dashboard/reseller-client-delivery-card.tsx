"use client";

import { useState } from "react";
import { Check, MessageCircle, PackageCheck } from "lucide-react";
import { toast } from "sonner";

interface ResellerOrder {
  id: number;
  order_reference?: string;
  order_status?: string;
  total_price?: number;
  created_at: string;
  cart_items?: unknown;
  account_access?: string;
}

export function ResellerClientDeliveryCard({ order }: { order: ResellerOrder }) {
  const [copied, setCopied] = useState(false);

  const items = Array.isArray(order.cart_items) ? (order.cart_items as Array<Record<string, unknown>>) : [];
  const gameTitles = items.length ? items.map((i) => String(i.title || i.name || "Game")).join(", ") : "Game Activation";
  const access = order.account_access || "";

  // Format client-ready message for WhatsApp
  const clientMessage = `🎮 *YOUR GAME ACTIVATION & DOWNLOAD DETAILS* 🎮\n\n` +
    `📦 *Title:* ${gameTitles}\n` +
    `🔖 *Order Ref:* ${order.order_reference || `#${order.id}`}\n\n` +
    `🔑 *Activation / Access Details:*\n${access}\n\n` +
    `🛡️ *Support & Warranty:* Full activation warranty included. If you have any questions, message us anytime!`;

  const handleCopyClientMessage = () => {
    navigator.clipboard.writeText(clientMessage);
    setCopied(true);
    toast.success("Client WhatsApp message copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <article className="rounded-xl border border-white/10 bg-black/40 p-4 md:p-5 space-y-4 hover:border-white/20 transition">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <PackageCheck size={18} />
          </div>
          <div>
            <strong className="text-sm font-bold text-white block">{gameTitles}</strong>
            <span className="text-[11px] font-mono text-[#8991a6]">
              {order.order_reference || `Order #${order.id}`} · {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyClientMessage}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#20c763]/15 border border-[#20c763]/40 px-3 py-1.5 text-xs font-bold text-[#20c763] hover:bg-[#20c763]/25 transition cursor-pointer select-none"
          title="Copy formatted message ready to send to your buyer"
        >
          {copied ? <Check size={14} /> : <MessageCircle size={14} />}
          <span>{copied ? "Copied for WhatsApp!" : "Copy for Client (WhatsApp)"}</span>
        </button>
      </div>

      {/* Access Preview Box */}
      <div className="rounded-lg border border-white/5 bg-black/60 p-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8991a6] block mb-1">
          Stored Client Credentials &amp; Link
        </span>
        <pre className="font-mono text-xs text-[#d8dce8] whitespace-pre-wrap break-words leading-relaxed max-h-28 overflow-y-auto custom-scrollbar">
          {access}
        </pre>
      </div>
    </article>
  );
}
