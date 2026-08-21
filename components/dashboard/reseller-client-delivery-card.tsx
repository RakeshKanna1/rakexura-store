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

  // Format clean professional client message for WhatsApp (No emojis)
  const clientMessage = `*YOUR GAME ACTIVATION & DOWNLOAD DETAILS*\n\n` +
    `*Game:* ${gameTitles}\n` +
    `*Order Reference:* ${order.order_reference || `#${order.id}`}\n\n` +
    `*Activation & Login Details:*\n${access}\n\n` +
    `*Support & Warranty:* Full activation warranty included. If you need any assistance, message us anytime!`;

  const handleCopyClientMessage = () => {
    navigator.clipboard.writeText(clientMessage);
    setCopied(true);
    toast.success("Client message copied to clipboard");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <article className="rounded-xl border border-white/[0.08] bg-[#070912]/80 p-4 md:p-5 space-y-3.5 hover:border-[#8b5cf6]/30 transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition cursor-pointer select-none"
          title="Copy formatted message ready to send to your buyer"
        >
          {copied ? <Check size={14} /> : <MessageCircle size={14} />}
          <span>{copied ? "Copied for WhatsApp!" : "Copy for Client (WhatsApp)"}</span>
        </button>
      </div>

      {/* Access Preview Box */}
      <div className="rounded-lg border border-white/[0.06] bg-black/40 p-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8991a6] block mb-1.5 font-bold">
          Stored Client Credentials &amp; Link
        </span>
        <pre className="font-mono text-xs text-[#d8dce8] whitespace-pre-wrap break-words leading-relaxed max-h-28 overflow-y-auto custom-scrollbar">
          {access}
        </pre>
      </div>
    </article>
  );
}
