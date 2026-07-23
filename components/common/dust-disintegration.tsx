"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DustDisintegrationProps {
  children: React.ReactNode | ((triggerRemove: () => void) => React.ReactNode);
  onRemove: () => void;
  className?: string;
}

export function DustDisintegration({
  children,
  onRemove,
  className = "",
}: DustDisintegrationProps) {
  const [isDisintegrating, setIsDisintegrating] = useState(false);

  const triggerDisintegration = () => {
    if (isDisintegrating) return;
    setIsDisintegrating(true);
    setTimeout(() => {
      onRemove();
    }, 450);
  };

  // Generate 25 dust particles
  const particles = Array.from({ length: 25 }).map((_, i) => {
    const x = (Math.random() - 0.5) * 140;
    const y = -25 - Math.random() * 50;
    const size = Math.random() * 5 + 3;
    const colors = ["#8991a6", "#646b7b", "#333b4d", "#facc15", "#ef4444"];
    const color = colors[i % colors.length];
    const duration = 0.35 + Math.random() * 0.2;

    return { id: i, x, y, size, color, duration };
  });

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence>
        {isDisintegrating && (
          <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
            {particles.map((p) => (
              <motion.span
                key={p.id}
                initial={{ x: (Math.random() - 0.5) * 60, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  opacity: [1, 0.8, 0],
                  scale: [1, 1.3, 0],
                }}
                transition={{ duration: p.duration, ease: "easeOut" }}
                className="absolute rounded-full"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 6px ${p.color}`,
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        animate={
          isDisintegrating
            ? {
                opacity: [1, 0.6, 0],
                filter: ["blur(0px)", "blur(6px)", "blur(12px)"],
                scale: [1, 0.98, 0.9],
                x: [0, -3, 3, -2, 0],
              }
            : { opacity: 1, filter: "blur(0px)", scale: 1, x: 0 }
        }
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
        {typeof children === "function"
          ? (children as (trigger: () => void) => React.ReactNode)(triggerDisintegration)
          : children}
      </motion.div>
    </div>
  );
}
