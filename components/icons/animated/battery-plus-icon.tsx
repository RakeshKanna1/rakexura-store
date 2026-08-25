"use client";

import { forwardRef, useImperativeHandle, useCallback } from "react";
import type { AnimatedIconHandle, AnimatedIconProps } from "./types";
import { motion, useAnimate } from "framer-motion";

export const BatteryPlusIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 20, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
      animate(
        ".battery-plus-sign",
        { scale: [1, 1.3, 1], rotate: [0, 90, 0] },
        { duration: 0.5, ease: "easeInOut" }
      );
      animate(
        ".battery-body",
        { opacity: [0.8, 1, 0.8] },
        { duration: 0.5, ease: "easeInOut" }
      );
    }, [animate]);

    const stop = useCallback(async () => {
      animate(
        ".battery-plus-sign",
        { scale: 1, rotate: 0 },
        { duration: 0.2, ease: "easeInOut" }
      );
      animate(
        ".battery-body",
        { opacity: 1 },
        { duration: 0.2, ease: "easeInOut" }
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
        {/* Battery Outline */}
        <motion.rect
          x="2"
          y="7"
          width="16"
          height="10"
          rx="2"
          ry="2"
          className="battery-body"
        />
        <motion.line x1="22" y1="11" x2="22" y2="13" />
        
        {/* Plus Symbol */}
        <motion.g className="battery-plus-sign" style={{ transformOrigin: "10px 12px" }}>
          <line x1="10" y1="9" x2="10" y2="15" />
          <line x1="7" y1="12" x2="13" y2="12" />
        </motion.g>
      </motion.svg>
    );
  },
);

BatteryPlusIcon.displayName = "BatteryPlusIcon";
