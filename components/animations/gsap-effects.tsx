"use client";

import { useEffect, useRef } from "react";

export function GsapEffects() {
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(max-width: 760px), (prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    let cleanup = () => undefined;
    void import("gsap").then(({ default: gsap }) => {
      if (disposed) return;
      gsap.from("[data-site-header]", { y: -18, opacity: 0, duration: .65, ease: "power2.out" });
      const setProgress = progressRef.current ? gsap.quickSetter(progressRef.current, "scaleX") : null;
      const scroll = () => { const max = document.documentElement.scrollHeight - window.innerHeight; setProgress?.(max > 0 ? window.scrollY / max : 0); };
      window.addEventListener("scroll", scroll, { passive: true }); scroll();
      const magnetic = Array.from(document.querySelectorAll<HTMLElement>(".magnetic-button"));
      const cleanups = magnetic.map((element) => {
        const move = (event: PointerEvent) => { const rect = element.getBoundingClientRect(); gsap.to(element, { x: (event.clientX - rect.left - rect.width / 2) * .12, y: (event.clientY - rect.top - rect.height / 2) * .12, duration: .25, overwrite: true }); };
        const leave = () => gsap.to(element, { x: 0, y: 0, duration: .35, ease: "power2.out" });
        element.addEventListener("pointermove", move); element.addEventListener("pointerleave", leave);
        return () => { element.removeEventListener("pointermove", move); element.removeEventListener("pointerleave", leave); };
      });
      cleanup = () => { window.removeEventListener("scroll", scroll); cleanups.forEach((remove) => remove()); };
    });
    return () => { disposed = true; cleanup(); };
  }, []);
  return <div ref={progressRef} className="fixed inset-x-0 top-0 z-[100] h-0.5 origin-left scale-x-0 bg-[#facc15] shadow-[0_0_12px_rgba(127,137,255,.65)]" aria-hidden />;
}
