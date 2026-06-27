"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695";
  const message = encodeURIComponent("Hi Rakexura, I need help with a game or order.");

  return (
    <a
      href={`https://wa.me/${number}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-[78px] right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-[#25d366] text-black shadow-[0_10px_32px_rgba(0,0,0,.4)] transition hover:-translate-y-1 md:bottom-5 md:right-5"
      aria-label="Chat with Rakexura on WhatsApp"
    >
      <MessageCircle size={21} fill="currentColor" />
    </a>
  );
}
