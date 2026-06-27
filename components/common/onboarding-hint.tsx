"use client";

import { CircleHelp, X } from "lucide-react";
import { useEffect, useState } from "react";

export function OnboardingHint({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(localStorage.getItem(`rakexura-guide:${id}`) !== "dismissed"); }, [id]);
  if (!visible) return null;
  return <aside className="flex items-start gap-3 rounded-md border border-[#facc15]/20 bg-[#b89412]/[.07] p-4" aria-label={`${title} guidance`}><CircleHelp size={19} className="mt-0.5 shrink-0 text-[#f8e38a]" /><div className="min-w-0 flex-1"><strong className="text-sm">{title}</strong><div className="mt-1 text-xs leading-5 text-[#a7aec0]">{children}</div></div><button type="button" onClick={() => { localStorage.setItem(`rakexura-guide:${id}`, "dismissed"); setVisible(false); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-md hover:bg-white/[.06]" aria-label={`Dismiss ${title} guidance`}><X size={16} /></button></aside>;
}
