"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MathCurveLoader } from "@/components/ui/math-curve-loader";

export function triggerPageTransition() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rakexura-navigate-start"));
  }
}

function PageTransitionLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimerRef = useRef<NodeJS.Timeout | null>(null);

  // When pathname or searchParams change, navigation has landed!
  useEffect(() => {
    setIsNavigating(false);
    setShowOverlay(false);
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleStart = () => {
      setIsNavigating(true);
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = setTimeout(() => {
        setShowOverlay(true);
      }, 160);

      // Safety timeout: auto-hide after 5s if navigation is aborted
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      maxTimerRef.current = setTimeout(() => {
        setIsNavigating(false);
        setShowOverlay(false);
      }, 5000);
    };

    const handleGlobalClick = (event: MouseEvent) => {
      // Don't intercept modified clicks (Ctrl, Cmd, Shift, Alt) or right/middle clicks
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore anchor fragments (#...), mailto, tel, javascript, external links, downloads, new tabs
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      // Check if it's an internal route
      const currentUrl = new URL(window.location.href);
      let targetUrl: URL;
      try {
        targetUrl = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      // Only handle same origin
      if (targetUrl.origin !== currentUrl.origin) return;

      // If destination is exact same path + query, skip
      if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
        return;
      }

      handleStart();
    };

    document.addEventListener("click", handleGlobalClick, { capture: true, passive: true });
    window.addEventListener("rakexura-navigate-start", handleStart);

    return () => {
      document.removeEventListener("click", handleGlobalClick, true);
      window.removeEventListener("rakexura-navigate-start", handleStart);
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    };
  }, []);

  return (
    <>
      {/* 1. Instant Top 2.5px Glowing Neon Progress Bar (0ms tactile feedback) */}
      <AnimatePresence>
        {isNavigating && (
          <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-white/[0.03] overflow-hidden z-[999999] pointer-events-none">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="h-full w-2/5 bg-gradient-to-r from-transparent via-[#facc15] to-transparent shadow-[0_0_12px_#facc15]"
            />
          </div>
        )}
      </AnimatePresence>

      {/* 2. Full-Screen Branded Rakexura Loader (smoothly appears if load > 160ms) */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[999998] flex items-center justify-center overflow-hidden bg-[#05070f]/85 backdrop-blur-md select-none pointer-events-none"
            role="status"
            aria-label="Loading page"
          >
            {/* Ambient gold aura */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.08),transparent_60%)] pointer-events-none" />

            <div className="text-center relative z-10 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center w-24 h-24 mb-3">
                {/* Mathematical Parametric Curve Trail Loader */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <MathCurveLoader
                    size={96}
                    petalCount={7}
                    baseRadius={7}
                    detailAmplitude={3}
                    curveScale={3.9}
                    strokeWidth={3.8}
                    particleCount={64}
                    trailSpan={0.4}
                    color="#facc15"
                    glowColor="#8b5cf6"
                  />
                </div>

                {/* Clean minimal logo badge */}
                <div className="relative z-10 flex items-center justify-center w-11 h-11 rounded-full bg-[#0c0e17] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                  <Image
                    src="/Assets/RakeLogo.png"
                    alt="Rakexura"
                    width={26}
                    height={26}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Minimalist brand title */}
              <span className="text-[11px] font-black uppercase tracking-[0.35em] text-white">
                RAKEXURA
              </span>

              {/* Status micro-pill */}
              <div className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-[#facc15]/25 bg-[#facc15]/10 px-3 py-0.5 text-[9.5px] font-bold tracking-[0.2em] text-[#facc15]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#facc15] animate-pulse" />
                <span>LOADING EXPERIENCE...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function PageTransitionLoader() {
  return (
    <Suspense fallback={null}>
      <PageTransitionLoaderInner />
    </Suspense>
  );
}
