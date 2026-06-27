"use client";

import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(max-width: 760px), (prefers-reduced-motion: reduce)").matches) return;
    let frame = 0; let disposed = false; let destroy = () => undefined;
    void import("lenis").then(({ default: Lenis }) => {
      if (disposed) return;
      const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
      const raf = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(raf); };
      frame = requestAnimationFrame(raf); destroy = () => { cancelAnimationFrame(frame); lenis.destroy(); };
    });
    return () => { disposed = true; destroy(); };
  }, []);
  return null;
}
