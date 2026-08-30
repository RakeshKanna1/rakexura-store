"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function getOrSetVisitorId(): string {
  if (typeof window === "undefined") return "";
  let vId = localStorage.getItem("rx_visitor_id");
  if (!vId) {
    vId = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
    localStorage.setItem("rx_visitor_id", vId);
  }
  return vId;
}

export function VisitorTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;

    // Don't track admin pages or static assets
    if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      return;
    }

    const track = () => {
      try {
        const visitorId = getOrSetVisitorId();
        const referrer = typeof document !== "undefined" ? document.referrer : "";

        fetch("/api/track-visitor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: pathname,
            visitorId,
            referrer,
          }),
          keepalive: true,
        }).catch(() => {
          // Ignore background tracking errors silently
        });
      } catch {
        // Ignore background tracking errors silently
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(track, { timeout: 2000 });
      return () => {
        if ("cancelIdleCallback" in window) {
          (window as unknown as { cancelIdleCallback: (h: number) => void }).cancelIdleCallback(handle);
        }
      };
    } else {
      const timeout = setTimeout(track, 500);
      return () => clearTimeout(timeout);
    }
  }, [pathname]);

  return null;
}
