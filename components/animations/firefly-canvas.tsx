"use client";

import { useEffect, useState } from "react";
import { isHighEndDevice } from "@/lib/utils";

interface Particle {
  id: number;
  type: "firefly" | "sparkle";
  size: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
}

export function FireflyCanvas() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (window.innerWidth < 768 && !isHighEndDevice()) return;
    const list: Particle[] = [];
    // Generate 18 golden firefly particles
    for (let i = 0; i < 18; i++) {
      list.push({
        id: i,
        type: "firefly",
        size: Math.random() * 2.5 + 2, // 2px to 4.5px
        top: Math.random() * 95,
        left: Math.random() * 95,
        delay: Math.random() * 10,
        duration: Math.random() * 16 + 14, // 14s to 30s
      });
    }
    // Generate 15 white diamond sparkle particles
    for (let i = 0; i < 15; i++) {
      list.push({
        id: i + 100,
        type: "sparkle",
        size: Math.random() * 1.8 + 1.2, // 1.2px to 3px
        top: Math.random() * 95,
        left: Math.random() * 95,
        delay: Math.random() * 12,
        duration: Math.random() * 7 + 5, // 5s to 12s
      });
    }
    setParticles(list);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => {
        if (p.type === "firefly") {
          return (
            <div
              key={p.id}
              className="absolute rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-orange-600 blur-[0.5px]"
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                boxShadow: `0 0 ${p.size * 3}px ${p.size / 2}px rgba(249, 115, 22, 0.35)`,
                opacity: 0,
                animation: `firefly-drift ${p.duration}s infinite linear`,
                animationDelay: `-${p.delay}s`, // Negative delay makes them start at different points in their animation cycle
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
                width: `${p.size}px`,
                height: `${p.size}px`,
                transform: "rotate(45deg)",
                boxShadow: `0 0 ${p.size * 4}px ${p.size}px rgba(255, 255, 255, 0.6)`,
                opacity: 0,
                animation: `diamond-sparkle ${p.duration}s infinite ease-in-out`,
                animationDelay: `-${p.delay}s`,
              }}
            />
          );
        }
      })}
    </div>
  );
}
