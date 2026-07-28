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
    if (window.innerWidth < 1024 || !isHighEndDevice()) return;
    const list: Particle[] = [];
    // Lightweight 8 golden firefly particles
    for (let i = 0; i < 8; i++) {
      list.push({
        id: i,
        type: "firefly",
        size: Math.random() * 2 + 1.5,
        top: Math.random() * 90,
        left: Math.random() * 90,
        delay: Math.random() * 8,
        duration: Math.random() * 12 + 12,
      });
    }
    // Lightweight 6 white diamond sparkle particles
    for (let i = 0; i < 6; i++) {
      list.push({
        id: i + 100,
        type: "sparkle",
        size: Math.random() * 1.5 + 1.2,
        top: Math.random() * 90,
        left: Math.random() * 90,
        delay: Math.random() * 10,
        duration: Math.random() * 6 + 5,
      });
    }
    setParticles(list);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ contain: "strict" }}>
      {particles.map((p) => {
        if (p.type === "firefly") {
          return (
            <div
              key={p.id}
              className="absolute rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.85)_0%,rgba(249,115,22,0.5)_50%,transparent_100%)]"
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                width: `${p.size * 2}px`,
                height: `${p.size * 2}px`,
                opacity: 0,
                willChange: "transform, opacity",
                transform: "translate3d(0,0,0)",
                animation: `firefly-drift ${p.duration}s infinite linear`,
                animationDelay: `-${p.delay}s`,
              }}
            />
          );
        } else {
          return (
            <div
              key={p.id}
              className="absolute bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.3)_50%,transparent_100%)]"
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                width: `${p.size * 2}px`,
                height: `${p.size * 2}px`,
                willChange: "transform, opacity",
                transform: "rotate(45deg) translate3d(0,0,0)",
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
