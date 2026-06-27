"use client";

import { useEffect, useRef } from "react";

export function MouseSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(pointer: fine) and (min-width: 900px)");
    if (!media.matches) return;
    const move = (event: PointerEvent) => {
      if (!ref.current) return;
      ref.current.style.transform = `translate3d(${event.clientX - 210}px,${event.clientY - 210}px,0)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return <div ref={ref} className="pointer-events-none fixed left-0 top-0 z-[1] hidden h-[420px] w-[420px] rounded-full bg-[#b89412]/[.055] blur-[90px] lg:block" aria-hidden />;
}
