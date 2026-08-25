"use client";

import { forwardRef, useImperativeHandle, useCallback } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "framer-motion";

export const ArrowDownloadIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 20, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
      animate(
        ".download-arrow",
        { y: [0, 4, 0] },
        { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
      );
      animate(
        ".download-tray",
        { y: [0, 1, 0] },
        { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
      );
    }, [animate]);

    const stop = useCallback(async () => {
      animate(
        ".download-arrow, .download-tray",
        { y: 0 },
        { duration: 0.2, ease: "easeOut" }
      );
    }, [animate]);

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    return (
      <motion.svg
        ref={scope}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
        onHoverStart={start}
        onHoverEnd={stop}
      >
        {/* Tray / Square */}
        <motion.path
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5"
          className="download-tray"
        />
        
        {/* Down Arrow */}
        <motion.g className="download-arrow">
          <line x1="12" y1="3" x2="12" y2="15" />
          <polyline points="7.5 10.5 12 15 16.5 10.5" />
        </motion.g>
      </motion.svg>
    );
  },
);

ArrowDownloadIcon.displayName = "ArrowDownloadIcon";
