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
    }).catch(() => {
      // Ignore background tracking errors silently
    });
  }, [pathname]);

  return null;
}
