"use client";

import { useEffect, useState } from "react";

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
    if (window.matchMedia("(max-width: 768px), (pointer: coarse)").matches) return;

    const list: Particle[] = [];
    // Full 18 golden firefly particles
    for (let i = 0; i < 18; i++) {
      list.push({
        id: i,
        type: "firefly",
        size: Math.random() * 2.5 + 2,
        top: Math.random() * 95,
        left: Math.random() * 95,
        delay: Math.random() * 10,
        duration: Math.random() * 16 + 14,
      });
    }
    // Full 15 white diamond sparkle particles
    for (let i = 0; i < 15; i++) {
      list.push({
        id: i + 100,
        type: "sparkle",
        size: Math.random() * 1.8 + 1.2,
        top: Math.random() * 95,
        left: Math.random() * 95,
        delay: Math.random() * 12,
        duration: Math.random() * 7 + 5,
      });
    }
    setParticles(list);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ contain: "strict" }}>
      {particles.map((p) => {
        if (p.type === "firefly") {
          return (
            <div
              key={p.id}
              className="absolute rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.9)_0%,rgba(249,115,22,0.6)_50%,transparent_100%)]"
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                width: `${p.size * 2.5}px`,
                height: `${p.size * 2.5}px`,
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
              className="absolute bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(255,255,255,0.4)_50%,transparent_100%)]"
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                width: `${p.size * 2.5}px`,
                height: `${p.size * 2.5}px`,
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
