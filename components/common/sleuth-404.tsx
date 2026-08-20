"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Home, Search } from "lucide-react";
import "./sleuth-404.css";

const VB_MID = 118;
const VB_FLOOR = 250;
const GROUND_Y = 248;

const HIP = [{ x: 110, y: 208 }, { x: 128, y: 208 }];
const THIGH = 25;
const SHIN = 25;
const STRIDE = 60;
const DUTY = 0.60;
const LIFT = 12;
const BOB = 6;
const THRUST = 9;
const MAX_SPEED = 1.3;
const LENS_OFF = -0.78;
const SHOULDER = { x: 150, y: 158 };
const MOUTH = { x: 146, y: 40 };

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function footAt(u: number) {
  const sweep = DUTY * STRIDE;
  if (u < DUTY) {
    const s = u / DUTY;
    return { x: (0.5 - s) * sweep, y: 0 };
  }
  const s = (u - DUTY) / (1 - DUTY);
  const e = s * s * (3 - 2 * s);
  return { x: (-0.5 + e) * sweep, y: -LIFT * Math.sin(Math.PI * s) };
}

function solveLeg(hip: { x: number; y: number }, foot: { x: number; y: number }) {
  let dx = foot.x - hip.x;
  let dy = foot.y - hip.y;
  let d = Math.hypot(dx, dy) || 0.001;
  const far = THIGH + SHIN - 0.8;
  const near = Math.abs(THIGH - SHIN) + 8;
  if (d > far) { dx *= far / d; dy *= far / d; d = far; }
  if (d < near) { dx *= near / d; dy *= near / d; d = near; }
  const cosA = clamp((THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d), -1, 1);
  const ang = Math.atan2(dy, dx) + Math.acos(cosA);
  return {
    knee: { x: hip.x + THIGH * Math.cos(ang), y: hip.y + THIGH * Math.sin(ang) },
    foot: { x: hip.x + dx, y: hip.y + dy },
  };
}

const LINES = [
  "Looking for games?",
  "Swept the catalog.",
  "Nothing at this URL.",
  "Definitely moved.",
  "Try the home page?",
];

export function Sleuth404() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = stageRef.current;
    if (!root) return;

    const scene = root.querySelector<HTMLElement>("[data-scene]");
    const bird = root.querySelector<HTMLElement>("[data-bird]");
    const limbBack = root.querySelector<SVGPathElement>('[data-limb="back"]');
    const limbFront = root.querySelector<SVGPathElement>('[data-limb="front"]');
    const toesBack = root.querySelector<SVGPathElement>('[data-toes="back"]');
    const toesFront = root.querySelector<SVGPathElement>('[data-toes="front"]');
    const head = root.querySelector<HTMLElement>("[data-head]");
    const body = root.querySelector<HTMLElement>("[data-body]");
    const wing = root.querySelector<HTMLElement>("[data-wing]");
    const pupil = root.querySelector<HTMLElement>("[data-pupil]");
    const armSvg = root.querySelector<SVGElement>("[data-arm]");
    const armLimb = root.querySelector<SVGPathElement>("[data-arm-limb]");
    const armHand = root.querySelector<SVGCircleElement>("[data-arm-hand]");
    const lens = root.querySelector<HTMLElement>("[data-lens]");
    const trail = root.querySelector<HTMLElement>("[data-trail]");
    const bubble = root.querySelector<HTMLElement>("[data-bubble]");
    const bubbleText = root.querySelector<HTMLElement>("[data-bubble-text]");

    if (
      !scene || !bird || !limbBack || !limbFront || !toesBack || !toesFront ||
      !head || !body || !wing || !pupil || !armSvg || !armLimb || !armHand ||
      !lens || !trail || !bubble || !bubbleText
    ) {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const M = { w: 0, h: 0, groundY: 0, scale: 1, birdW: 0, birdH: 0, lensR: 74, offX: 0, offY: 0 };
    const S = {
      bx: 0,
      vx: 0,
      face: 1,
      faceT: 1,
      side: 1,
      walking: false,
      phase: 0,
      step: 0,
      lx: 0,
      ly: 0,
      tlx: 0,
      tly: 0,
      gait: 0,
      frontFootX: 0,
      still: 0,
      t: 0,
      live: false,
      said: -1,
    };

    function measure() {
      if (!scene || !bird) return;
      const r = scene.getBoundingClientRect();
      const ground = parseFloat(getComputedStyle(scene).getPropertyValue("--ground")) || 90;
      M.w = r.width;
      M.h = r.height;
      M.groundY = r.height - ground;
      M.birdW = bird.offsetWidth || 180;
      M.birdH = bird.offsetHeight || 195;
      M.scale = (bird.offsetHeight || 195) / 260 || 1;
      M.lensR = parseFloat(getComputedStyle(root!).getPropertyValue("--lens-r")) || 76;
      M.offX = M.offY = M.lensR * LENS_OFF;
    }

    function birdPoint(vx: number, vy: number) {
      return {
        x: S.bx + S.faceT * (vx - VB_MID) * M.scale,
        y: M.groundY - (VB_FLOOR - vy) * M.scale,
      };
    }

    const prints: HTMLElement[] = [];

    function dropPrint() {
      if (!trail) return;
      const el = document.createElement("span");
      el.className = "sleuth-print";
      el.style.setProperty("--fx", (S.bx + S.faceT * (S.frontFootX - VB_MID) * M.scale).toFixed(1));
      el.style.setProperty("--fy", (M.groundY + 4).toFixed(1));
      el.style.setProperty("--fd", String(S.face));
      el.style.setProperty("--fr", `${(Math.random() * 10 - 5).toFixed(1)}deg`);
      trail.appendChild(el);
      requestAnimationFrame(() => el.classList.add("is-in"));
      prints.push(el);

      setTimeout(() => {
        el.classList.remove("is-in");
        setTimeout(() => el.remove(), 600);
      }, 2600);

      while (prints.length > 14) prints.shift()?.remove();
    }

    let saying = false;

    function place() {
      if (!bubble) return;
      const m = birdPoint(MOUTH.x, MOUTH.y);
      const bw = bubble.offsetWidth || 120;
      const sx = clamp(S.face > 0 ? m.x - bw - 4 : m.x + 4, 8, M.w - bw - 8);
      bubble.style.setProperty("--sx", sx.toFixed(1));
      bubble.style.setProperty("--sy", (m.y - 10).toFixed(1));
    }

    function speak(moving: boolean) {
      if (!bubble || !bubbleText) return;
      if (moving) {
        if (saying) { saying = false; bubble.style.setProperty("--say", "0"); }
        return;
      }
      if (saying) { place(); return; }
      if (S.still < 0.9) return;

      saying = true;
      S.said = (S.said + 1) % LINES.length;
      bubbleText.textContent = LINES[S.said];
      place();
      bubble.style.setProperty("--say", "1");
    }

    let last = 0;
    let raf = 0;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = last ? clamp((now - last) / 1000, 0, 1 / 20) : 1 / 60;
      last = now;
      S.t += dt;

      if (!S.live) {
        S.tlx = M.w * 0.5 + Math.sin(S.t * 0.55) * M.w * 0.3;
        S.tly = M.groundY - M.h * 0.34 + Math.sin(S.t * 1.3) * 12;
      }

      const follow = 1 - Math.exp(-(S.live ? 16 : 5) * dt);
      S.lx = lerp(S.lx, S.tlx, follow);
      S.ly = lerp(S.ly, S.tly, follow);

      const reach = M.birdW * 0.92;
      const standoff = M.birdW * 0.86;

      if (Math.abs(S.lx - S.bx) > M.birdW * 0.8) S.side = S.lx > S.bx ? 1 : -1;

      const edge = M.birdW * 0.42;
      const want = clamp(S.lx - S.side * standoff, edge, M.w - edge);
      const gap = want - S.bx;
      const prevX = S.bx;

      const startDist = gap * S.side > 0 ? M.birdW * 0.26 : M.birdW * 0.55;
      if (!S.walking && Math.abs(gap) > startDist) S.walking = true;
      if (S.walking && Math.abs(gap) < 8) S.walking = false;

      if (S.walking) {
        S.face = gap > 0 ? 1 : -1;
        const committed = clamp(S.faceT * S.face, 0, 1);
        const pull = (1 - Math.exp(-4.2 * dt)) * committed;
        const cap = MAX_SPEED * M.birdW * dt;
        S.bx += clamp(gap * pull, -cap, cap);
      } else {
        S.face = S.side;
      }
      S.vx = (S.bx - prevX) / dt;

      S.faceT = lerp(S.faceT, S.face, 1 - Math.exp(-11 * dt));
      const faceR = Math.abs(S.faceT) < 0.06 ? Math.sign(S.faceT || S.face) * 0.06 : S.faceT;

      const travelled = Math.abs(S.bx - prevX);
      S.phase += (travelled / (STRIDE * M.scale)) * 2 * Math.PI;

      const moving = travelled / dt > 14;
      S.still = moving ? 0 : S.still + dt;

      S.gait = lerp(S.gait, S.walking ? 1 : 0, 1 - Math.exp(-7 * dt));
      const cycle = S.phase / (2 * Math.PI);
      const g = S.gait;

      const bob = -BOB * (0.5 - 0.5 * Math.cos(4 * Math.PI * cycle)) * g;
      const lean = clamp(Math.abs(S.vx) * 0.020, 0, 5) * g;
      body!.style.setProperty("--bob", bob.toFixed(2));
      body!.style.setProperty("--lean", lean.toFixed(2));

      const hp = (cycle * 2) % 1;
      const thrust = hp < 0.72
        ? THRUST * (1 - (hp / 0.72) * 2)
        : (() => {
            const s = (hp - 0.72) / 0.28;
            const e = s * s * (3 - 2 * s);
            return THRUST * (-1 + 2 * e);
          })();
      head!.style.setProperty("--hx", (thrust * g).toFixed(2));

      const limbs = [limbBack!, limbFront!];
      const toes = [toesBack!, toesFront!];
      for (let i = 0; i < 2; i++) {
        const hip = { x: HIP[i].x, y: HIP[i].y + bob };
        const u = (((cycle + i * 0.5) % 1) + 1) % 1;
        const f = footAt(u);
        const target = { x: hip.x + f.x * g, y: GROUND_Y + f.y * g };
        const L = solveLeg(hip, target);
        limbs[i].setAttribute(
          "d",
          `M${hip.x.toFixed(1)} ${hip.y.toFixed(1)}L${L.knee.x.toFixed(1)} ${L.knee.y.toFixed(1)}L${L.foot.x.toFixed(1)} ${L.foot.y.toFixed(1)}`
        );
        const fx = L.foot.x;
        const fy = L.foot.y;
        toes[i].setAttribute(
          "d",
          `M${(fx - 11).toFixed(1)} ${(fy + 1).toFixed(1)}h22M${fx.toFixed(1)} ${fy.toFixed(1)}l-8 8M${fx.toFixed(1)} ${fy.toFixed(1)}l8 8`
        );
        if (i === 1) S.frontFootX = fx;
      }

      const rest = birdPoint(SHOULDER.x, SHOULDER.y);
      const up = clamp((rest.y - S.ly) / (M.birdW * 0.9), -1, 1);
      wing!.style.setProperty("--wing", (up * -18).toFixed(2));
      const shoulderPt = birdPoint(SHOULDER.x + Math.max(0, up) * 5, SHOULDER.y - Math.max(0, up) * 24);

      const step = Math.floor(S.phase / Math.PI);
      if (step !== S.step) {
        if (moving) dropPrint();
        S.step = step;
      }

      let dx = shoulderPt.x - S.lx;
      let dy = shoulderPt.y - S.ly;
      let d = Math.hypot(dx, dy) || 1;

      const FAR = reach * 1.45;
      const NEAR = reach * 0.9;
      if (d > FAR) { const over = d - FAR; S.lx += (dx / d) * over; S.ly += (dy / d) * over; }
      if (d < NEAR) { const in_ = NEAR - d; S.lx -= (dx / d) * in_ * 0.55; S.ly -= (dy / d) * in_ * 0.55; }

      S.lx = clamp(S.lx, M.lensR + 6, M.w - M.lensR - 6);
      S.ly = clamp(S.ly, M.lensR + 6, M.h - M.lensR - 6);

      dx = shoulderPt.x - S.lx;
      dy = shoulderPt.y - S.ly;
      d = Math.hypot(dx, dy) || 1;

      const ux = dx / d;
      const uy = dy / d;
      const hand = { x: S.lx + ux * (M.lensR + 44), y: S.ly + uy * (M.lensR + 44) };

      const mx = (shoulderPt.x + hand.x) / 2;
      const my = (shoulderPt.y + hand.y) / 2;
      const bendX = -uy * 18 * Math.sign(S.faceT || 1);
      const bendY = ux * 18 * Math.sign(S.faceT || 1);
      armLimb!.setAttribute(
        "d",
        `M${shoulderPt.x.toFixed(1)} ${shoulderPt.y.toFixed(1)} Q${(mx + bendX).toFixed(1)} ${(my + bendY).toFixed(1)} ${hand.x.toFixed(1)} ${hand.y.toFixed(1)}`
      );
      armHand!.setAttribute("cx", hand.x.toFixed(1));
      armHand!.setAttribute("cy", hand.y.toFixed(1));
      armSvg!.style.setProperty("--arm-w", (M.birdW * 0.055).toFixed(1));
      armHand!.setAttribute("r", (M.birdW * 0.062).toFixed(1));

      const eyePt = birdPoint(152, 112);
      const edx = (S.lx - eyePt.x) / M.scale * (S.faceT >= 0 ? 1 : -1);
      const edy = (S.ly - eyePt.y) / M.scale;
      const ed = Math.hypot(edx, edy) || 1;
      const pull = Math.min(ed, 60) / 60 * 6;
      pupil!.style.setProperty("--px", ((edx / ed) * pull).toFixed(2));
      pupil!.style.setProperty("--py", ((edy / ed) * pull).toFixed(2));

      bird!.style.setProperty("--bx", S.bx.toFixed(1));
      bird!.style.setProperty("--by", M.groundY.toFixed(1));
      bird!.style.setProperty("--face", faceR.toFixed(3));
      scene!.style.setProperty("--lx", S.lx.toFixed(1));
      scene!.style.setProperty("--ly", S.ly.toFixed(1));
      lens!.style.setProperty("--handle", ((Math.atan2(uy, ux) * 180) / Math.PI).toFixed(1));

      speak(moving);
    }

    function point(e: PointerEvent) {
      if (reduced.matches) return;
      const r = scene!.getBoundingClientRect();
      S.tlx = clamp(e.clientX - r.left + M.offX, M.lensR + 6, r.width - M.lensR - 6);
      S.tly = clamp(e.clientY - r.top + M.offY, M.groundY - (bird?.offsetHeight || 195) * 1.25, M.groundY - 12);
      if (!S.live) {
        S.live = true;
        scene!.dataset.mode = "live";
      }
    }

    function handlePointerLeave(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      S.live = false;
      if (scene) scene.dataset.mode = "patrol";
    }

    function pose() {
      measure();
      S.bx = M.w * 0.34;
      S.face = S.faceT = S.side = 1;
      S.walking = false;
      S.lx = M.w * 0.56;
      S.ly = M.groundY - M.h * 0.36;
      S.t = 0;
      S.phase = 0;
      S.gait = 0;

      bird?.style.setProperty("--bx", S.bx.toFixed(1));
      bird?.style.setProperty("--by", M.groundY.toFixed(1));
      bird?.style.setProperty("--face", "1");
      scene?.style.setProperty("--lx", S.lx.toFixed(1));
      scene?.style.setProperty("--ly", S.ly.toFixed(1));

      for (const [i, limb, toe] of [[0, limbBack, toesBack], [1, limbFront, toesFront]] as const) {
        const hip = HIP[i];
        const L = solveLeg(hip, { x: hip.x, y: GROUND_Y });
        limb?.setAttribute("d", `M${hip.x} ${hip.y}L${L.knee.x.toFixed(1)} ${L.knee.y.toFixed(1)}L${L.foot.x.toFixed(1)} ${L.foot.y.toFixed(1)}`);
        toe?.setAttribute("d", `M${(L.foot.x - 11).toFixed(1)} ${(L.foot.y + 1).toFixed(1)}h22M${L.foot.x.toFixed(1)} ${L.foot.y.toFixed(1)}l-8 8M${L.foot.x.toFixed(1)} ${L.foot.y.toFixed(1)}l8 8`);
      }
      head?.style.setProperty("--hx", "0");
      body?.style.setProperty("--bob", "0");
      body?.style.setProperty("--lean", "0");

      const sh = birdPoint(SHOULDER.x, SHOULDER.y);
      const dx = sh.x - S.lx;
      const dy = sh.y - S.ly;
      const d = Math.hypot(dx, dy) || 1;
      const lensR = parseFloat(getComputedStyle(root!).getPropertyValue("--lens-r")) || 76;
      const hand = { x: S.lx + (dx / d) * (lensR + 44), y: S.ly + (dy / d) * (lensR + 44) };
      armLimb?.setAttribute("d", `M${sh.x.toFixed(1)} ${sh.y.toFixed(1)} Q${((sh.x + hand.x) / 2).toFixed(1)} ${((sh.y + hand.y) / 2 - 16).toFixed(1)} ${hand.x.toFixed(1)} ${hand.y.toFixed(1)}`);
      armHand?.setAttribute("cx", hand.x.toFixed(1));
      armHand?.setAttribute("cy", hand.y.toFixed(1));
      lens?.style.setProperty("--handle", ((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(1));
    }

    function start() {
      measure();
      S.bx = M.w * 0.4;
      S.lx = M.w * 0.55;
      S.ly = M.groundY - M.h * 0.34;
      S.tlx = S.lx;
      S.tly = S.ly;
      S.face = S.faceT = S.side = 1;
      S.walking = false;
      if (scene) scene.dataset.mode = "patrol";
      last = 0;
      if (!raf) raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (trail) trail.replaceChildren();
      prints.length = 0;
      if (bubble) bubble.style.setProperty("--say", "0");
      saying = false;
    }

    function apply() {
      if (reduced.matches) {
        stop();
        if (scene) scene.dataset.mode = "still";
        pose();
      } else {
        S.live = false;
        start();
      }
    }

    apply();
    reduced.addEventListener("change", apply);

    window.addEventListener("pointermove", point);
    window.addEventListener("pointerdown", point);
    document.addEventListener("pointerleave", handlePointerLeave);

    let lastW = window.innerWidth;
    const handleResize = () => {
      if (window.innerWidth === lastW) { measure(); return; }
      lastW = window.innerWidth;
      measure();
      if (reduced.matches) pose();
      else {
        S.bx = clamp(S.bx, M.birdW * 0.42, M.w - M.birdW * 0.42);
        S.lx = clamp(S.lx, 40, M.w - 40);
        S.ly = clamp(S.ly, 40, M.groundY - 10);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      stop();
      reduced.removeEventListener("change", apply);
      window.removeEventListener("pointermove", point);
      window.removeEventListener("pointerdown", point);
      document.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div ref={stageRef} className="sleuth-stage">
      <div className="sleuth-paper" aria-hidden="true" />

      {/* Main Scene */}
      <section className="sleuth-scene" data-scene data-mode="patrol">
        <span className="sleuth-floor" aria-hidden="true" />

        {/* 404 Large background number */}
        <p className="sleuth-glyph sleuth-glyph--base" aria-hidden="true">404</p>

        {/* The found layer (magnified under lens) */}
        <div className="sleuth-found" data-found aria-hidden="true">
          <p className="sleuth-glyph sleuth-glyph--lit">404</p>
          <span className="sleuth-note" style={{ "--nx": "12%", "--ny": "22%" } as React.CSSProperties}>swept</span>
          <span className="sleuth-note" style={{ "--nx": "74%", "--ny": "16%" } as React.CSSProperties}>nothing</span>
          <span className="sleuth-note" style={{ "--nx": "31%", "--ny": "70%" } as React.CSSProperties}>checked twice</span>
          <span className="sleuth-note" style={{ "--nx": "86%", "--ny": "62%" } as React.CSSProperties}>no crumbs</span>
          <span className="sleuth-note" style={{ "--nx": "52%", "--ny": "88%" } as React.CSSProperties}>still gone</span>
          <span className="sleuth-note" style={{ "--nx": "6%", "--ny": "56%" } as React.CSSProperties}>looked here</span>
          <span className="sleuth-note" style={{ "--nx": "63%", "--ny": "40%" } as React.CSSProperties}>not this one</span>
          <span className="sleuth-note" style={{ "--nx": "22%", "--ny": "44%" } as React.CSSProperties}>empty</span>
          <span className="sleuth-note" style={{ "--nx": "44%", "--ny": "14%" } as React.CSSProperties}>dusted</span>
          <span className="sleuth-note" style={{ "--nx": "92%", "--ny": "34%" } as React.CSSProperties}>no trace</span>
          <span className="sleuth-note" style={{ "--nx": "38%", "--ny": "32%" } as React.CSSProperties}>moved out</span>
          <span className="sleuth-note" style={{ "--nx": "70%", "--ny": "80%" } as React.CSSProperties}>nobody home</span>
          <span className="sleuth-note" style={{ "--nx": "16%", "--ny": "84%" } as React.CSSProperties}>case cold</span>
        </div>

        {/* Dust Particles */}
        <div className="sleuth-dust" aria-hidden="true">
          <i style={{ "--x": "12%", "--y": "26%", "--s": "5px", "--dx": "34px", "--dy": "-46px", "--dur": "19s", "--delay": "-2s" } as React.CSSProperties} />
          <i style={{ "--x": "26%", "--y": "52%", "--s": "3.5px", "--dx": "-26px", "--dy": "-38px", "--dur": "24s", "--delay": "-9s" } as React.CSSProperties} />
          <i style={{ "--x": "38%", "--y": "18%", "--s": "4px", "--dx": "22px", "--dy": "40px", "--dur": "21s", "--delay": "-14s" } as React.CSSProperties} />
          <i style={{ "--x": "49%", "--y": "63%", "--s": "3px", "--dx": "30px", "--dy": "-30px", "--dur": "27s", "--delay": "-5s" } as React.CSSProperties} />
          <i style={{ "--x": "61%", "--y": "31%", "--s": "5.5px", "--dx": "-32px", "--dy": "34px", "--dur": "23s", "--delay": "-17s" } as React.CSSProperties} />
          <i style={{ "--x": "72%", "--y": "57%", "--s": "3.5px", "--dx": "24px", "--dy": "-44px", "--dur": "20s", "--delay": "-11s" } as React.CSSProperties} />
          <i style={{ "--x": "84%", "--y": "22%", "--s": "4.5px", "--dx": "-20px", "--dy": "42px", "--dur": "26s", "--delay": "-3s" } as React.CSSProperties} />
          <i style={{ "--x": "92%", "--y": "47%", "--s": "3px", "--dx": "-28px", "--dy": "-32px", "--dur": "22s", "--delay": "-20s" } as React.CSSProperties} />
          <i style={{ "--x": "5%", "--y": "68%", "--s": "4px", "--dx": "26px", "--dy": "-36px", "--dur": "25s", "--delay": "-7s" } as React.CSSProperties} />
        </div>

        {/* Footprint Trail */}
        <div className="sleuth-trail" data-trail aria-hidden="true" />

        {/* Skirting ground */}
        <span className="sleuth-ground" aria-hidden="true" />

        {/* The Bird */}
        <div className="sleuth-bird" data-bird aria-hidden="true">
          <svg className="sleuth-bird__svg" viewBox="0 0 240 260" fill="none">
            <ellipse className="sleuth-bird__shadow" data-shadow cx="118" cy="250" rx="66" ry="8" />

            <g className="sleuth-bird__legs" data-legs>
              <g className="sleuth-leg">
                <path className="sleuth-leg__limb" data-limb="back" d="" />
                <path className="sleuth-leg__toes" data-toes="back" d="" />
              </g>
              <g className="sleuth-leg">
                <path className="sleuth-leg__limb" data-limb="front" d="" />
                <path className="sleuth-leg__toes" data-toes="front" d="" />
              </g>
            </g>

            <g className="sleuth-bird__body" data-body>
              <path className="sleuth-bird__tail" d="M62 132 14 96l14 44-16 34 54 12z" />
              <ellipse className="sleuth-bird__blob" cx="118" cy="142" rx="72" ry="76" />

              <g className="sleuth-bird__head" data-head>
                <g className="sleuth-bird__crest">
                  <path d="M96 74c-6-16-2-30 8-38 2 14 8 22 14 28z" />
                  <path d="M118 66c-2-18 4-30 16-36-2 14 0 24 4 32z" />
                  <path d="M140 72c4-16 14-25 26-26-8 11-11 21-10 31z" />
                </g>

                <path className="sleuth-bird__beak" d="M176 120l40 11-40 12z" />

                <g className="sleuth-bird__eye" data-eye>
                  <circle className="sleuth-eye__white" cx="152" cy="112" r="16" />
                  <circle className="sleuth-eye__pupil" data-pupil cx="152" cy="112" r="7" />
                  <circle className="sleuth-eye__spark" cx="147" cy="106" r="2.6" />
                </g>
              </g>

              <g className="sleuth-bird__spots">
                <circle cx="92" cy="150" r="4.4" /><circle cx="80" cy="176" r="4.4" />
                <circle cx="100" cy="192" r="4.4" /><circle cx="120" cy="204" r="4.4" />
                <circle cx="72" cy="132" r="4.4" /><circle cx="144" cy="200" r="4.4" />
              </g>

              <g className="sleuth-bird__wing" data-wing>
                <ellipse className="sleuth-wing__plate" cx="140" cy="166" rx="36" ry="44" />
                <path className="sleuth-wing__swirl" d="M156 152c-18 0-32 12-32 26 0 12 9 20 21 20" />
              </g>
            </g>
          </svg>
        </div>

        {/* Arm */}
        <svg className="sleuth-arm" data-arm aria-hidden="true">
          <path className="sleuth-arm__limb" data-arm-limb d="" />
          <circle className="sleuth-arm__hand" data-arm-hand r="13" cx="0" cy="0" />
        </svg>

        {/* Magnifying Glass */}
        <div className="sleuth-lens" data-lens aria-hidden="true">
          <span className="sleuth-lens__handle" />
          <span className="sleuth-lens__ring" />
          <span className="sleuth-lens__glass" />
        </div>

        {/* Speech Bubble */}
        <p className="sleuth-bubble" data-bubble aria-hidden="true">
          <span data-bubble-text>Hmm.</span>
        </p>
      </section>

      {/* Foreground Copy & Recovery Navigation */}
      <div className="sleuth-copy">
        <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-[#81889a]">
          404 — Page Not Found
        </span>
        <h1 className="sleuth-copy__title">
          Looking for a Game?
        </h1>
        <p className="sleuth-copy__sub">
          Nothing at this address. The page may have moved or no longer exists.
        </p>

        {/* Action Buttons */}
        <div className="sleuth-copy__actions">
          <Link
            href="/"
            className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-full bg-[#facc15] px-6 py-2 text-xs font-black uppercase tracking-wider text-black shadow-md shadow-[#facc15]/20 transition-all hover:bg-[#fde047] hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Home size={13} strokeWidth={2.5} />
            <span>Return to Store</span>
          </Link>

          <Link
            href="/games"
            className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-6 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white/[0.1] hover:border-white/40 active:scale-95 cursor-pointer"
          >
            <Search size={13} strokeWidth={2.5} />
            <span>Browse All Games</span>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="sleuth-quick-links text-xs text-[#8991a6]">
          <Link href="/track-order" className="hover:text-[#facc15] transition-colors inline-flex items-center gap-1">
            Track Order <ArrowRight size={12} />
          </Link>
          <Link href="/faq" className="hover:text-[#facc15] transition-colors inline-flex items-center gap-1">
            Help & FAQ <ArrowRight size={12} />
          </Link>
          <Link href="/support" className="hover:text-[#facc15] transition-colors inline-flex items-center gap-1">
            Contact Support <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
