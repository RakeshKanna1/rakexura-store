"use client";

import { useEffect, useRef } from "react";

interface MathCurveLoaderProps {
  size?: number;
  className?: string;
  petalCount?: number;
  baseRadius?: number;
  detailAmplitude?: number;
  curveScale?: number;
  strokeWidth?: number;
  particleCount?: number;
  trailSpan?: number;
  durationMs?: number;
  rotationDurationMs?: number;
  pulseDurationMs?: number;
  color?: string;
  glowColor?: string;
}

export function MathCurveLoader({
  size = 140,
  className = "",
  petalCount = 7,
  baseRadius = 7,
  detailAmplitude = 3,
  curveScale = 3.9,
  strokeWidth = 4.5,
  particleCount = 56,
  trailSpan = 0.38,
  durationMs = 4600,
  rotationDurationMs = 28000,
  pulseDurationMs = 4200,
  color = "#facc15",
  glowColor = "#8b5cf6",
}: MathCurveLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const groupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let rafId = 0;
    const pathEl = pathRef.current;
    const groupEl = groupRef.current;

    function point(progress: number, detailScale: number) {
      const t = progress * Math.PI * 2;
      const petals = Math.round(petalCount);
      const x = baseRadius * Math.cos(t) - detailAmplitude * detailScale * Math.cos(petals * t);
      const y = baseRadius * Math.sin(t) - detailAmplitude * detailScale * Math.sin(petals * t);
      return {
        x: 50 + x * curveScale,
        y: 50 + y * curveScale,
      };
    }

    function render(now: number) {
      if (!pathEl || !groupEl) return;

      const progress = (now % durationMs) / durationMs;
      const pulseProgress = (now % pulseDurationMs) / pulseDurationMs;
      const detailScale = 0.5 + 0.5 * Math.sin(pulseProgress * Math.PI * 2);

      const dParts: string[] = [];
      for (let i = 0; i < particleCount; i++) {
        const offset = (i / (particleCount - 1)) * trailSpan;
        const p = (progress - offset + 1) % 1;
        const pt = point(p, detailScale);
        dParts.push(i === 0 ? `M ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}` : `L ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`);
      }

      pathEl.setAttribute("d", dParts.join(" "));

      const rotationProgress = (now % rotationDurationMs) / rotationDurationMs;
      groupEl.setAttribute("transform", `rotate(${(rotationProgress * 360).toFixed(2)} 50 50)`);

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    petalCount,
    baseRadius,
    detailAmplitude,
    curveScale,
    particleCount,
    trailSpan,
    durationMs,
    rotationDurationMs,
    pulseDurationMs,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="math-curve-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="60%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0.1" />
          </linearGradient>
          <filter id="math-curve-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <g ref={groupRef}>
          <path
            ref={pathRef}
            fill="none"
            stroke="url(#math-curve-grad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#math-curve-glow)"
          />
        </g>
      </svg>
    </div>
  );
}
