"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export function WhatsAppFloat() {
  const pathname = usePathname();
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918317416695";
  const message = encodeURIComponent("Hi Rakexura, I need help with a game or order.");

  // Only render floating button on the homepage ("/")
  if (pathname !== "/") return null;

  return (
    <motion.a
      href={`https://wa.me/${number}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: [0, -7, 0],
      }}
      transition={{
        y: {
          duration: 2.8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        },
        scale: { duration: 0.3 },
        opacity: { duration: 0.3 },
      }}
      whileHover={{
        scale: 1.15,
        rotate: [0, -8, 8, -4, 0],
        transition: { rotate: { duration: 0.4 } },
      }}
      whileTap={{ scale: 0.92 }}
      className="group fixed bottom-[92px] right-3.5 z-40 grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-full bg-[#25d366] text-black shadow-[0_10px_32px_rgba(37,211,102,0.45)] hover:shadow-[0_0_32px_rgba(37,211,102,0.7)] sm:bottom-5 sm:right-5 border border-emerald-300/50 backdrop-blur-sm"
      aria-label="Chat with Rakexura on WhatsApp"
    >
      {/* Soft Radar Pulse Ring */}
      <span className="absolute -inset-1 -z-10 rounded-full bg-[#25d366]/40 animate-ping opacity-50 pointer-events-none" />

      {/* WhatsApp Icon */}
      <MessageCircle size={21} fill="currentColor" className="transition-transform duration-200 group-hover:scale-110" />
    </motion.a>
  );
}
