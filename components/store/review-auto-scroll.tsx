"use client";

import { useEffect } from "react";

export function ReviewAutoScroll() {
  useEffect(() => {
    function scrollToReviews() {
      if (typeof window !== "undefined" && window.location.hash === "#reviews") {
        const el = document.getElementById("reviews");
        if (el) {
          // Allow layout and lazy elements to calculate heights
          setTimeout(() => {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 120);
        }
      }
    }

    scrollToReviews();
    window.addEventListener("hashchange", scrollToReviews);
    return () => window.removeEventListener("hashchange", scrollToReviews);
  }, []);

  return null;
}
