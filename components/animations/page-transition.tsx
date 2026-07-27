"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { isHighEndDevice } from "@/lib/utils";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(true);
  const mountTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    // Force scroll back to top of the screen on route mount
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });

    const renderTime = Math.round(performance.now() - mountTimeRef.current);
    if (process.env.NODE_ENV === "development") {
      console.log(`[Speed Audit] Page transition & paint completed in ${renderTime}ms`);
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 && !isHighEndDevice());
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <motion.div
        className="page-transition-wrapper will-change-transform"
        initial={{ opacity: 0.85 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="page-transition-wrapper will-change-transform"
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
