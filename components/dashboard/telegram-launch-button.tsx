"use client";

import { ArrowRight } from "lucide-react";

interface TelegramLaunchButtonProps {
  botUrl: string;
  tgProtocolUrl: string;
}

export function TelegramLaunchButton({ botUrl, tgProtocolUrl }: TelegramLaunchButtonProps) {
  return (
    <a
      href={botUrl}
      onClick={() => {
        try {
          window.location.href = tgProtocolUrl;
        } catch {}
      }}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0088cc] to-[#0284c7] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_4px_16px_rgba(0,136,204,0.4)] hover:shadow-[0_6px_22px_rgba(0,136,204,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
    >
      <span>Launch Bot</span>
      <ArrowRight size={13} />
    </a>
  );
}
