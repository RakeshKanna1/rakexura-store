"use client";

import { useEffect, useState } from "react";
import { isHighEndDevice } from "@/lib/utils";

interface Particle {
  id: number;
  size: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
  rotation?: number;
}

export type PremiumThemeType = "jungle" | "cyberpunk" | "crimson" | "royal";

export function PremiumAmbientEffect({ theme }: { theme: PremiumThemeType }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768 && !isHighEndDevice()) return;

    const list: Particle[] = [];
    const count = theme === "royal" ? 25 : 20;

    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        size: Math.random() * (theme === "jungle" ? 12 : 5) + (theme === "jungle" ? 6 : 2), 
        top: Math.random() * 95,
        left: Math.random() * 95,
        delay: Math.random() * 15,
        duration: Math.random() * 18 + 12, // 12s to 30s
        rotation: Math.random() * 360,
      });
    }

    setParticles(list);
  }, [theme]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => {
        if (theme === "jungle") {
          // Jungle theme: Falling/drifting leaves in gold/green
          return (
            <svg
              key={p.id}
              viewBox="0 0 24 24"
              className="absolute fill-current text-emerald-400/20"
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                transform: `rotate(${p.rotation}deg)`,
                filter: "drop-shadow(0 0 3px rgba(16, 185, 129, 0.2))",
                animation: `leaf-drift ${p.duration}s infinite linear`,
                animationDelay: `-${p.delay}s`,
              }}
            >
              <path d="M17,8C8,10 5.9,16.1 5.6,16.7C5.3,17.3 5.4,18 6,18.4C6.6,18.8 7.3,18.7 7.7,18.2C8.3,17.4 14,14 16.2,10.2C18.6,6 18.1,4.2 18,4C17.8,3.9 16,3.4 11.8,5.8C8,8 4.6,13.7 3.8,14.3C3.3,14.7 3.2,15.4 3.6,16C4,16.6 4.7,16.7 5.3,16.4C5.9,16.1 12,14 16.2,11.8C20.4,9.6 20,8 20,8H17Z" />
            </svg>
          );
        } else if (theme === "cyberpunk") {
          // Cyberpunk theme: Neon cyan/gold diamond grid sparks
          const isCyan = p.id % 2 === 0;
          return (
            <div
              key={p.id}
              className={`absolute blur-[0.4px] ${
                isCyan 
                  ? "bg-cyan-400/35 shadow-[0_0_8px_rgba(34,211,238,0.4)]" 
                  : "bg-amber-400/35 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
              }`}
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                transform: "rotate(45deg)",
                animation: `cyber-spark ${p.duration}s infinite linear`,
                animationDelay: `-${p.delay}s`,
              }}
            />
          );
        } else if (theme === "crimson") {
          // Crimson/Eldritch theme: Glowing ash embers rising
          return (
            <div
              key={p.id}
              className="absolute rounded-full bg-gradient-to-t from-red-600 via-orange-500 to-amber-300 blur-[0.5px]"
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                boxShadow: `0 0 ${p.size * 3.5}px ${p.size / 1.5}px rgba(239, 68, 68, 0.4)`,
                opacity: 0,
                animation: `ember-float ${p.duration}s infinite linear`,
                animationDelay: `-${p.delay}s`,
              }}
            />
          );
        } else {
          // Royal Gold theme: Classic fireflies & diamond sparkles
          const isFirefly = p.id % 2 === 0;
          if (isFirefly) {
            return (
              <div
                key={p.id}
                className="absolute rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 blur-[0.5px]"
                style={{
                  top: `${p.top}%`,
                  left: `${p.left}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  boxShadow: `0 0 ${p.size * 3}px ${p.size / 2}px rgba(245, 158, 11, 0.35)`,
                  opacity: 0,
                  animation: `firefly-drift ${p.duration}s infinite linear`,
                  animationDelay: `-${p.delay}s`,
                }}
              />
            );
          } else {
            return (
              <div
                key={p.id}
                className="absolute bg-white blur-[0.3px]"
                style={{
                  top: `${p.top}%`,
                  left: `${p.left}%`,
                  width: `${p.size / 1.5}px`,
                  height: `${p.size / 1.5}px`,
                  transform: "rotate(45deg)",
                  boxShadow: `0 0 ${p.size * 3.5}px ${p.size / 2}px rgba(255, 255, 255, 0.65)`,
                  opacity: 0,
                  animation: `diamond-sparkle ${p.duration * 0.4}s infinite ease-in-out`,
                  animationDelay: `-${p.delay}s`,
                }}
              />
            );
          }
        }
      })}
    </div>
  );
}
