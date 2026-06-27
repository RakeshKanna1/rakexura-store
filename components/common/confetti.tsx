"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#7c3aed", "#facc15", "#00d68f", "#ef4444", "#3b82f6", "#ec4899"];

interface ConfettiProps {
  active: boolean;
  onComplete: () => void;
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; color: string; angle: number; distance: number; scale: number; delay: number; rotate: number }>>([]);

  useEffect(() => {
    if (active) {
      const newParticles = Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        color: COLORS[i % COLORS.length],
        angle: Math.random() * Math.PI * 2,
        distance: 25 + Math.random() * 55, // target distance in vw/vh
        scale: 0.4 + Math.random() * 0.8,
        delay: Math.random() * 0.2,
        rotate: (Math.random() - 0.5) * 360 * 3,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden">
          {particles.map((p) => {
            const xTarget = Math.cos(p.angle) * p.distance;
            const yTarget = Math.sin(p.angle) * p.distance;
            
            return (
              <motion.div
                key={p.id}
                className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-sm"
                style={{
                  backgroundColor: p.color,
                  x: "-50%",
                  y: "-50%",
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: [`0vw`, `${xTarget * 0.6}vw`, `${xTarget}vw`],
                  y: [
                    `0vh`, 
                    `${yTarget * 0.6 - 15}vh`, // Upward arc
                    `${yTarget + 20}vh` // Gravity fall
                  ],
                  scale: [0, p.scale, p.scale * 0.7, 0],
                  opacity: [1, 1, 0.9, 0],
                  rotate: p.rotate,
                }}
                transition={{
                  duration: 1.6 + Math.random() * 0.8,
                  ease: [0.1, 0.8, 0.3, 1],
                  delay: p.delay,
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
