"use client";

import { useEffect, useRef } from "react";

export function MouseSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine) and (min-width: 900px)");
    if (!media.matches) return;

    let rafId: number | null = null;
    let latestX = 0;
    let latestY = 0;

    const updatePosition = () => {
      if (ref.current) {
        ref.current.style.transform = `translate3d(${latestX - 210}px,${latestY - 210}px,0)`;
      }
      rafId = null;
    };

    const move = (event: PointerEvent) => {
      latestX = event.clientX;
      latestY = event.clientY;
      if (rafId === null) {
        rafId = requestAnimationFrame(updatePosition);
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-[1] hidden h-[420px] w-[420px] rounded-full bg-[#b89412]/[.055] blur-[90px] will-change-transform lg:block"
      style={{ transform: "translate3d(-500px, -500px, 0)" }}
      aria-hidden
    />
  );
}

