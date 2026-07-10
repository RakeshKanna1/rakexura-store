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
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
    transition: { duration: 0.55, delay, ease: [0.2, 0.7, 0.2, 1] as [number, number, number, number] }
  };

  return (
    <motion.div
      className={cn(className)}
      {...animateProps}
    >
      {children}
    </motion.div>
  );
}

