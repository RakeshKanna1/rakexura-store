"use client";

import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(max-width: 760px), (prefers-reduced-motion: reduce)").matches) return;
    let frame = 0; let disposed = false; let destroy = () => undefined;
    void import("lenis").then(({ default: Lenis }) => {
      if (disposed) return;
      const lenis = new Lenis({
        duration: 0.75,
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
        syncTouch: false
      });
      const raf = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(raf); };
      frame = requestAnimationFrame(raf); destroy = () => { cancelAnimationFrame(frame); lenis.destroy(); };
    });
    return () => { disposed = true; destroy(); };
  }, []);
  return null;
}
