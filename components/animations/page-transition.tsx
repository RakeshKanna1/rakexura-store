"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { isHighEndDevice } from "@/lib/utils";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    // Force scroll back to top of the screen on route mount
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });

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
        className="page-transition-wrapper"
        initial={{ opacity: 0.75 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="page-transition-wrapper"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}
