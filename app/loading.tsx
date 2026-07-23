"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShinyText } from "@/components/animations/shiny-text";

export default function Loading() {
  return (
    <motion.div
      id="global-loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-[#05070f] select-none"
      role="status"
      aria-label="Loading Rakexura"
    >
      {/* Dynamic ambient gold & purple background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.07),rgba(139,92,246,0.03),transparent_65%)] pointer-events-none" />

      {/* Hyper-fast neon progress line tracking across the very top boundary */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-white/[0.02] overflow-hidden z-[99999]">
        <motion.div
          animate={{ x: ["-100%", "250%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-2/5 bg-gradient-to-r from-transparent via-[#facc15] to-transparent shadow-[0_0_15px_#facc15]"
        />
      </div>

      <div className="text-center relative z-10 flex flex-col items-center justify-center">
        {/* Pulsing Backing Aura */}
        <motion.div
          animate={{ scale: [0.95, 1.15, 0.95], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-10 rounded-full bg-gradient-to-r from-[#facc15]/15 via-[#8b5cf6]/10 to-[#facc15]/15 blur-3xl pointer-events-none"
        />

        <div className="relative h-28 w-28 flex items-center justify-center">
          {/* Rotating Conic Energy Ring (Circle) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-1.5 rounded-full bg-[conic-gradient(from_0deg,#facc15,transparent_30%,#8b5cf6,transparent_70%,#facc15)] p-[1.5px] opacity-75 blur-[0.5px]"
          >
            <div className="h-full w-full rounded-full bg-[#05070f]" />
          </motion.div>

          {/* Metallic gold circular frame wrapping the logo */}
          <div className="relative h-28 w-28 overflow-hidden rounded-full border border-[#facc15]/35 bg-gradient-to-b from-[#1f1b18] to-[#0a0a0c] p-4.5 shadow-[0_0_45px_rgba(250,204,21,0.22)] flex items-center justify-center">
            {/* Golden Shimmer Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_25%,rgba(250,204,21,0.15)_45%,rgba(255,255,255,0.08)_50%,rgba(250,204,21,0.15)_55%,transparent_75%)] -translate-x-full animate-shimmer" />

            {/* Breathing & Floating Logo */}
            <motion.div
              animate={{
                scale: [0.96, 1.06, 0.96],
                y: [0, -2.5, 0],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative flex items-center justify-center w-full h-full"
            >
              <Image
                src="/Assets/RakeLogo.png"
                alt="Rakexura Logo"
                width={64}
                height={64}
                className="object-contain filter drop-shadow-[0_0_12px_rgba(250,204,21,0.45)]"
                priority
              />
            </motion.div>
          </div>
        </div>

        <strong className="mt-8 block text-lg font-black tracking-[0.25em]">
          <ShinyText text="RAKEXURA" type="gold" speed={2.5} />
        </strong>
        <p className="mt-2 text-xs tracking-[0.15em] font-semibold uppercase opacity-80">
          <ShinyText text="ENTERING PREMIUM MARKETPLACE" type="gray" speed={3.0} />
        </p>
      </div>
    </motion.div>
  );
}
