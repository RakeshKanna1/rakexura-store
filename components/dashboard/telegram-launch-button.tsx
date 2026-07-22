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
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#0088cc]/40 bg-[#0088cc]/15 px-3.5 py-1.5 text-xs font-bold text-[#38bdf8] hover:bg-[#0088cc] hover:text-white hover:border-[#0088cc] transition-all cursor-pointer shrink-0"
    >
      <span>Launch Bot</span>
      <ArrowRight size={13} />
    </a>
  );
}
