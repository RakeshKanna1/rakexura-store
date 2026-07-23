"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { TextType } from "@/components/animations/text-type";

export default function Loading() {
  return (
    <motion.div
      id="global-loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-[#05070f] select-none"
      role="status"
      aria-label="Loading Rakexura"
    >
      {/* Ultra-subtle background radial ambient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.06),transparent_60%)] pointer-events-none" />

      {/* Sleek 2px top progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-white/[0.03] overflow-hidden z-[99999]">
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#facc15] to-transparent shadow-[0_0_10px_#facc15]"
        />
      </div>

      <div className="text-center relative z-10 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-16 h-16 mb-4">
          {/* Ultra-sleek spinning gold arc */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#facc15] border-r-[#facc15]/30"
          />

          {/* Clean minimal logo badge */}
          <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-[#0c0e17] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.6)]">
            <Image
              src="/Assets/RakeLogo.png"
              alt="Rakexura"
              width={26}
              height={26}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Minimalist brand title */}
        <span className="text-[12px] font-black uppercase tracking-[0.35em] text-white">
          RAKEXURA
        </span>

        {/* Dynamic cycling typewriter text for PC Games & Store Features */}
        <div className="mt-2.5 flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.25em] text-[#facc15]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#facc15] animate-pulse" />
          <TextType
            text={[
              "PC GAMES STORE",
              "INSTANT DIGITAL KEYS",
              "VERIFIED GAME DEALS",
              "BEST PRICES IN INDIA",
              "24/7 WHATSAPP SUPPORT"
            ]}
            typingSpeed={40}
            pauseDuration={1500}
            deletingSpeed={25}
            loop={true}
            showCursor={true}
            cursorCharacter="|"
            cursorClassName="text-[#facc15] ml-0.5 animate-pulse"
          />
        </div>
      </div>
    </motion.div>
  );
}
