"use client";

import { motion } from "framer-motion";

const PARTICLE_COLORS = [
  "#facc15", // Gold
  "#00d68f", // Neon Green
  "#8b5cf6", // Purple
  "#ff4d4d", // Red
  "#3b82f6", // Blue
  "#ffffff", // White
];

export function ButtonPopRocks({ active }: { active: boolean }) {
  if (!active) return null;

  // Generate 14 radial burst particles around the button
  const particles = Array.from({ length: 14 }).map((_, i) => {
    const angle = (i / 14) * 360;
    const distance = 40 + Math.random() * 45;
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * distance;
    const y = Math.sin(rad) * distance;
    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
    const size = Math.floor(Math.random() * 5) + 4; // 4px - 8px

    return { id: i, x, y, color, size };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex items-center justify-center">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: [0, 1.4, 0.4],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute rounded-full shadow-sm"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}
