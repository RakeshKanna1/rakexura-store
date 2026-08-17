"use client";

import { useEffect, useRef } from "react";

export function ChampagneFizz() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      if (!canvas || !ctx) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initNucleationSites();
    }

    const BUBBLE_RATE = 2.5;
    const RISE_SPEED = 1.4;

    type Bubble = {
      x: number;
      y: number;
      radius: number;
      baseRadius: number;
      wobblePhase: number;
      wobbleFreq: number;
      wobbleAmp: number;
      speedMult: number;
      hueShift: number;
      opacity: number;
      highlightAngle: number;
      age: number;
      pulsePhase: number;
      pulseRate: number;
    };

    type Sparkle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      decay: number;
      size: number;
    };

    let bubbles: Bubble[] = [];
    let sparkles: Sparkle[] = [];
    const MAX_BUBBLES = 800;
    const MAX_SPARKLES = 150;

    let nucleationSites: { x: number; jitter: number }[] = [];
    const NUM_SITES = 12;

    function initNucleationSites() {
      nucleationSites = [];
      for (let i = 0; i < NUM_SITES; i++) {
        nucleationSites.push({
          x: width * 0.1 + (width * 0.8) * (i / (NUM_SITES - 1)) + (Math.random() - 0.5) * 40,
          jitter: Math.random() * 20,
        });
      }
    }

    function spawnBubble() {
      if (bubbles.length >= MAX_BUBBLES) return;

      let x: number;
      if (Math.random() < 0.7 && nucleationSites.length > 0) {
        const site = nucleationSites[Math.floor(Math.random() * nucleationSites.length)];
        x = site.x + (Math.random() - 0.5) * site.jitter;
      } else {
        x = Math.random() * width;
      }

      const sizeRoll = Math.random();
      let radius: number;
      if (sizeRoll < 0.55) {
        radius = 1 + Math.random() * 2;
      } else if (sizeRoll < 0.85) {
        radius = 2.5 + Math.random() * 3;
      } else if (sizeRoll < 0.96) {
        radius = 5 + Math.random() * 4;
      } else {
        radius = 8 + Math.random() * 5;
      }

      const hueShift = (Math.random() - 0.5) * 20;

      bubbles.push({
        x: x,
        y: height + radius,
        radius: radius,
        baseRadius: radius,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleFreq: 1.5 + Math.random() * 1.5,
        wobbleAmp: (0.3 + Math.random() * 0.7) * radius,
        speedMult: 0.7 + Math.random() * 0.6,
        hueShift: hueShift,
        opacity: 0.3 + Math.random() * 0.4,
        highlightAngle: -0.6 + Math.random() * 0.3,
        age: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseRate: 2 + Math.random() * 2,
      });
    }

    function spawnSparkle(x: number, y: number, bubbleRadius: number) {
      let count = Math.floor(3 + bubbleRadius * 0.8);
      if (count > 8) count = 8;

      for (let i = 0; i < count; i++) {
        if (sparkles.length >= MAX_SPARKLES) return;
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 0.5 + Math.random() * 2 + bubbleRadius * 0.15;
        sparkles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          life: 1.0,
          decay: 0.02 + Math.random() * 0.03,
          size: 0.5 + Math.random() * 1.5 + bubbleRadius * 0.1,
        });
      }
    }

    function getSurfaceY() {
      return height * 0.03;
    }

    let mouseX = 0;
    let mouseY = 0;
    let mouseActive = false;

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      mouseActive = true;
    }

    function handleMouseLeave() {
      mouseActive = false;
    }

    function updateBubbles(dt: number) {
      const surfaceY = getSurfaceY();
      let i = bubbles.length;

      while (i--) {
        const b = bubbles[i];
        b.age += dt;

        const sizeSpeedFactor = 0.6 + 0.4 * Math.min(b.baseRadius / 10, 1);
        const riseAmount = RISE_SPEED * b.speedMult * sizeSpeedFactor * dt * 60;
        b.y -= riseAmount;

        b.wobblePhase += b.wobbleFreq * dt;
        b.x += Math.sin(b.wobblePhase) * b.wobbleAmp * dt * 2;

        if (mouseActive) {
          const mdx = b.x - mouseX;
          const mdy = b.y - mouseY;
          const md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md > 1 && md < 180) {
            let push = 1 - md / 180;
            push *= push * 8.0 * dt * 60;
            b.x += (mdx / md) * push;
            b.y += (mdy / md) * push * 0.5;
          }
        }

        b.radius = b.baseRadius * (1 + 0.05 * Math.sin(b.age * b.pulseRate));
        const heightFraction = 1 - b.y / height;
        b.radius *= 1 + heightFraction * 0.15;

        if (b.y - b.radius <= surfaceY) {
          spawnSparkle(b.x, surfaceY, b.baseRadius);
          bubbles.splice(i, 1);
          continue;
        }

        if (b.x < -50 || b.x > width + 50) {
          bubbles.splice(i, 1);
        }
      }
    }

    function updateSparkles(dt: number) {
      let i = sparkles.length;
      while (i--) {
        const s = sparkles[i];
        s.x += s.vx * dt * 60;
        s.y += s.vy * dt * 60;
        s.vy += 0.02 * dt * 60;
        s.life -= s.decay * dt * 60;
        if (s.life <= 0) {
          sparkles.splice(i, 1);
        }
      }
    }

    function drawBubble(b: Bubble) {
      const r = b.radius;
      if (r < 0.5 || !ctx) return;

      const x = b.x;
      const y = b.y;
      const fadeIn = Math.min(b.age * 3, 1);

      // Main bubble body
      const bodyAlpha = b.opacity * 0.25 * fadeIn;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 180, 140, ${bodyAlpha})`;
      ctx.fill();

      // Bubble rim
      const rimAlpha = b.opacity * 0.4 * fadeIn;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(220, 190, 150, ${rimAlpha})`;
      ctx.lineWidth = Math.max(0.5, r * 0.08);
      ctx.stroke();

      // Inner refraction highlight
      if (r > 1.5) {
        const hlR = r * 0.65;
        const hlX = x - r * 0.25;
        const hlY = y - r * 0.25;
        const hlAlpha = b.opacity * 0.6 * fadeIn;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r * 0.92, 0, Math.PI * 2);
        ctx.clip();

        const hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR);
        hlGrad.addColorStop(0, `rgba(255, 245, 220, ${hlAlpha * 0.9})`);
        hlGrad.addColorStop(0.3, `rgba(240, 210, 170, ${hlAlpha * 0.5})`);
        hlGrad.addColorStop(0.7, `rgba(200, 170, 130, ${hlAlpha * 0.1})`);
        hlGrad.addColorStop(1, "rgba(200, 170, 130, 0)");
        ctx.fillStyle = hlGrad;
        ctx.beginPath();
        ctx.arc(hlX, hlY, hlR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (r > 3) {
          const specAlpha = b.opacity * 0.8 * fadeIn;
          const specX = x - r * 0.3;
          const specY = y - r * 0.35;
          const specR = Math.max(0.8, r * 0.12);
          ctx.beginPath();
          ctx.arc(specX, specY, specR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 252, 240, ${specAlpha})`;
          ctx.fill();
        }
      }

      if (r > 4) {
        const btmAlpha = b.opacity * 0.15 * fadeIn;
        const btmX = x + r * 0.15;
        const btmY = y + r * 0.35;
        const btmR = r * 0.3;
        const btmGrad = ctx.createRadialGradient(btmX, btmY, 0, btmX, btmY, btmR);
        btmGrad.addColorStop(0, `rgba(230, 200, 160, ${btmAlpha})`);
        btmGrad.addColorStop(1, "rgba(230, 200, 160, 0)");
        ctx.fillStyle = btmGrad;
        ctx.beginPath();
        ctx.arc(btmX, btmY, btmR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawSparkles() {
      if (!ctx) return;
      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];
        const alpha = s.life * 0.9;
        const size = s.size * s.life;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = alpha;

        const glowR = size * 3;
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
        glow.addColorStop(0, "rgba(255, 240, 200, 0.8)");
        glow.addColorStop(0.3, "rgba(220, 180, 120, 0.3)");
        glow.addColorStop(1, "rgba(200, 149, 108, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 250, 235, 1)";
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.3, size * 0.4), 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    function drawSurface(time: number) {
      if (!ctx) return;
      const surfaceY = getSurfaceY();

      ctx.beginPath();
      ctx.moveTo(0, surfaceY);
      for (let x = 0; x <= width; x += 4) {
        const wave =
          Math.sin(x * 0.01 + time * 1.2) * 1.5 +
          Math.sin(x * 0.025 + time * 0.8) * 0.8 +
          Math.sin(x * 0.005 + time * 0.5) * 2;
        ctx.lineTo(x, surfaceY + wave);
      }
      ctx.strokeStyle = "rgba(200, 170, 130, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const surfGrad = ctx.createLinearGradient(0, surfaceY - 15, 0, surfaceY + 25);
      surfGrad.addColorStop(0, "rgba(200, 170, 130, 0)");
      surfGrad.addColorStop(0.4, "rgba(200, 170, 130, 0.04)");
      surfGrad.addColorStop(0.6, "rgba(200, 170, 130, 0.03)");
      surfGrad.addColorStop(1, "rgba(200, 170, 130, 0)");
      ctx.fillStyle = surfGrad;
      ctx.fillRect(0, surfaceY - 15, width, 40);
    }

    function drawAmbientStreams(time: number) {
      if (!ctx) return;
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const sx = width * (0.15 + 0.7 * (i / 4)) + Math.sin(time * 0.3 + i * 2.1) * 30;
        const streamGrad = ctx.createLinearGradient(sx, height, sx, 0);
        streamGrad.addColorStop(0, "rgba(200, 149, 108, 0.015)");
        streamGrad.addColorStop(0.5, "rgba(200, 149, 108, 0.008)");
        streamGrad.addColorStop(1, "rgba(200, 149, 108, 0)");
        ctx.fillStyle = streamGrad;
        ctx.fillRect(sx - 30, 0, 60, height);
      }
      ctx.restore();
    }

    function drawVignette() {
      if (!ctx) return;
      const cx = width / 2;
      const cy = height / 2;
      const maxDim = Math.max(width, height);
      const vignette = ctx.createRadialGradient(cx, cy, maxDim * 0.25, cx, cy, maxDim * 0.8);
      vignette.addColorStop(0, "rgba(10, 10, 10, 0)");
      vignette.addColorStop(1, "rgba(10, 10, 10, 0.4)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    }

    let lastTime = 0;
    let spawnAccumulator = 0;

    function render(timestamp: number) {
      if (!ctx) return;
      if (!lastTime) lastTime = timestamp;
      const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
      lastTime = timestamp;

      const effectiveDt = prefersReduced ? 0 : dt;

      ctx.clearRect(0, 0, width, height);

      const time = timestamp / 1000;

      if (!prefersReduced) {
        spawnAccumulator += BUBBLE_RATE * effectiveDt * 60;
        while (spawnAccumulator >= 1) {
          spawnBubble();
          spawnAccumulator -= 1;
        }

        updateBubbles(effectiveDt);
        updateSparkles(effectiveDt);
      }

      drawAmbientStreams(time);

      bubbles.sort((a, b) => b.radius - a.radius);
      for (let i = 0; i < bubbles.length; i++) {
        drawBubble(bubbles[i]);
      }

      drawSparkles();
      drawSurface(time);
      drawVignette();

      animId = requestAnimationFrame(render);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-70"
      aria-hidden="true"
    />
  );
}