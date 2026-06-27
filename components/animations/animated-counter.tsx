"use client";

import { animate, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

export function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => `${Math.round(latest).toLocaleString("en-IN")}${suffix}`);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [inView, motionValue, value]);
  return <motion.span ref={ref}>{rounded}</motion.span>;
}

import { motion } from "framer-motion";
