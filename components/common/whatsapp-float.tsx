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
      initial={{ y: 20, opacity: 0 }}
      animate={{
        y: [0, -5, 0],
        opacity: 1,
      }}
      transition={{
        y: {
          duration: 3.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        },
        opacity: { duration: 0.4 },
      }}
      whileHover={{
        scale: 1.05,
        y: -3,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.96 }}
      className="group fixed bottom-[78px] right-4 z-40 flex items-center gap-3 rounded-full border border-white/12 bg-[#0c0a1d]/90 p-2.5 pl-3.5 pr-4 text-white shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-300 hover:border-[#00d68f]/40 hover:shadow-[0_12px_36px_rgba(0,214,143,0.2)] md:bottom-6 md:right-6"
      aria-label="Chat with Rakexura Support"
    >
      {/* Ambient Pulsing Glow Background */}
      <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#00d68f]/10 to-[#8b5cf6]/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* WhatsApp Icon Circle with Online Badge */}
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#00d68f]/15 text-[#00d68f] border border-[#00d68f]/30 transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#00d68f] group-hover:text-black">
        <MessageCircle size={18} fill="currentColor" />
        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
      </div>

      {/* Professional Text & Status Label */}
      <div className="flex flex-col text-left select-none">
        <span className="text-[11px] font-bold text-white leading-none tracking-wide group-hover:text-[#00d68f] transition-colors">
          Rakexura Support
        </span>
        <span className="mt-0.5 text-[9.5px] font-medium text-[#8991a6] leading-none flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-emerald-400" /> Instant Chat
        </span>
      </div>
    </motion.a>
  );
}
