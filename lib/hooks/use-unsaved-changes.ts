"use client";

import { useEffect, useState } from "react";

export function useUnsavedChanges() {
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    // 1. Tab close / refresh browser protection
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      return e.returnValue;
    };

    // 2. Client-side link click interception (Next.js SPA navigation, breadcrumbs, sidebar)
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      if (anchor.target === "_blank") return;

      const currentUrl = window.location.pathname + window.location.search;
      const targetUrl = anchor.pathname + anchor.search;
      if (currentUrl === targetUrl) return;

      const confirmed = window.confirm(
        "You have unsaved changes! Are you sure you want to discard your changes and leave?"
      );
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        setIsDirty(false);
      }
    };

    // 3. Browser Back/Forward navigation interception
    const handlePopState = () => {
      const confirmed = window.confirm(
        "You have unsaved changes! Are you sure you want to discard your changes and leave?"
      );
      if (!confirmed) {
        window.history.pushState(null, "", window.location.href);
      } else {
        setIsDirty(false);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty, isSubmitting]);

  const confirmNavigation = (e?: React.MouseEvent) => {
    if (isDirty && !isSubmitting) {
      const confirmed = window.confirm(
        "You have unsaved changes! Are you sure you want to discard your changes and leave?"
      );
      if (!confirmed && e) {
        e.preventDefault();
        return false;
      }
    }
    return true;
  };

  return {
    isDirty,
    setIsDirty,
    isSubmitting,
    setIsSubmitting,
    confirmNavigation,
    markDirty: () => setIsDirty(true),
    markSubmitted: () => setIsSubmitting(true),
  };
}

