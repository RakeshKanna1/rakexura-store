"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn, isHighEndDevice } from "@/lib/utils";


export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 && !isHighEndDevice());
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const animateProps = isMobile ? {} : {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.05 },
    transition: { duration: 0.4, delay, ease: "easeOut" as const }
  };

  return (
    <motion.div
      className={cn(className, "will-change-transform")}
      style={{ transform: "translate3d(0,0,0)" }}
      {...animateProps}
    >
      {children}
    </motion.div>
  );
}

