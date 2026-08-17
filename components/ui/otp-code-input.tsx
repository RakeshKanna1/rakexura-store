"use client";

import React, { useEffect, useRef } from "react";
import "./otp-code-input.css";

export interface OtpCodeInputProps {
  firstName?: string;
  onComplete?: (code: string) => void;
  enableDemo?: boolean;
}

export function OtpCodeInput({
  firstName = "your account",
  onComplete,
  enableDemo = true,
}: OtpCodeInputProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const raf = (f: FrameRequestCallback): number => window.requestAnimationFrame(f);

    const inputs = Array.from(root.querySelectorAll<HTMLInputElement>(".foc-input"));
    const boxes = inputs.map((inp) => inp.parentElement as HTMLElement);
    const N = inputs.length;
    if (!N) return;

    const statusEl = root.querySelector<HTMLElement>(".foc-status");
    const statusText = root.querySelector<HTMLElement>(".foc-status-text");
    const form = root.querySelector<HTMLFormElement>(".foc-form");

    const mq = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false, addEventListener: undefined };
    let reduce = Boolean(mq.matches);

    const CODE_OK = "204815";
    const CODE_NO = "061947";

    /* ---------- helpers ---------- */
    function setStatus(text: string, state?: string) {
      if (statusText) statusText.textContent = text;
      if (statusEl) statusEl.className = "foc-status" + (state ? " foc-status--" + state : "");
    }

    function clearActive() {
      for (let i = 0; i < N; i++) boxes[i]?.classList.remove("foc-box--active");
    }

    function setActive(i: number) {
      clearActive();
      if (i >= 0 && i < N) boxes[i]?.classList.add("foc-box--active");
    }

    function popBox(i: number) {
      const b = boxes[i];
      if (!b) return;
      b.classList.remove("foc-box--tap");
      void b.offsetWidth;
      b.classList.add("foc-box--tap");
    }

    function fillDigit(i: number, ch: string, pop?: boolean) {
      if (!inputs[i] || !boxes[i]) return;
      inputs[i].value = ch;
      boxes[i].classList.add("foc-box--filled");
      if (pop) popBox(i);
    }

    function allFilled() {
      for (let i = 0; i < N; i++) {
        if (inputs[i]?.value.length !== 1) return false;
      }
      return true;
    }

    function resetBoxes() {
      root?.classList.remove("foc-success", "foc-shake");
      clearActive();
      for (let i = 0; i < N; i++) {
        if (inputs[i]) inputs[i].value = "";
        boxes[i]?.classList.remove("foc-box--filled", "foc-box--tap");
      }
    }

    function success(demo?: boolean) {
      root?.classList.remove("foc-shake");
      root?.classList.add("foc-success");
      clearActive();
      for (let i = 0; i < N; i++) boxes[i]?.classList.add("foc-box--filled");
      setStatus("Code verified", "ok");
      if (!demo && document.activeElement && "blur" in document.activeElement) {
        (document.activeElement as HTMLElement).blur();
      }
    }

    function wrong() {
      root?.classList.remove("foc-success");
      root?.classList.add("foc-shake");
      clearActive();
      for (let i = 0; i < N; i++) boxes[i]?.classList.add("foc-box--filled");
      setStatus("Incorrect code, try 204815", "err");
    }

    /* ---------- user verification ---------- */
    let wrongTimer: NodeJS.Timeout | number = 0;
    function verifyUser() {
      let typed = "";
      for (let vi = 0; vi < N; vi++) typed += inputs[vi]?.value || "";

      if (onComplete) {
        onComplete(typed);
      }

      if (typed === CODE_OK) {
        success(false);
        return;
      }

      wrong();
      lastInteract = performance.now();
      if (wrongTimer) clearTimeout(wrongTimer);
      wrongTimer = setTimeout(() => {
        wrongTimer = 0;
        if (!userActive) return;
        resetBoxes();
        setStatus("Enter the 6-digit code", "");
        lastInteract = performance.now();
        try {
          inputs[0]?.focus();
        } catch {}
      }, 1500);
    }

    /* ---------- real interaction ---------- */
    let userActive = false;
    let lastInteract = 0;
    const RESUME_MS = 5200;

    function goUser(reset?: boolean) {
      if (wrongTimer) {
        clearTimeout(wrongTimer);
        wrongTimer = 0;
      }
      if (!userActive && reset) resetBoxes();
      userActive = true;
      lastInteract = performance.now();
      clearActive();
    }

    const listeners: { el: HTMLElement | Window | MediaQueryList; event: string; handler: EventListener }[] = [];

    inputs.forEach((inp, idx) => {
      const onPointerDown = () => goUser(true);
      const onFocus = () => goUser(true);

      const onInput = () => {
        goUser(false);
        const v = inp.value.replace(/[^0-9]/g, "");
        inp.value = v.slice(-1);
        if (inp.value) {
          boxes[idx]?.classList.add("foc-box--filled");
          popBox(idx);
          if (idx < N - 1) {
            inputs[idx + 1]?.focus();
            try {
              inputs[idx + 1]?.select();
            } catch {}
          }
        } else {
          boxes[idx]?.classList.remove("foc-box--filled");
        }
        root?.classList.remove("foc-shake");
        if (allFilled()) verifyUser();
      };

      const onKeyDown = (e: KeyboardEvent) => {
        goUser(false);
        const k = e.key;
        if (k === "Backspace") {
          if (!inp.value && idx > 0) {
            e.preventDefault();
            inputs[idx - 1]?.focus();
            if (inputs[idx - 1]) inputs[idx - 1].value = "";
            boxes[idx - 1]?.classList.remove("foc-box--filled");
          } else if (inp.value) {
            inp.value = "";
            boxes[idx]?.classList.remove("foc-box--filled");
          }
          root?.classList.remove("foc-success", "foc-shake");
        } else if (k === "ArrowLeft") {
          if (idx > 0) {
            e.preventDefault();
            inputs[idx - 1]?.focus();
          }
        } else if (k === "ArrowRight") {
          if (idx < N - 1) {
            e.preventDefault();
            inputs[idx + 1]?.focus();
          }
        } else if (k === "Home") {
          e.preventDefault();
          inputs[0]?.focus();
        } else if (k === "End") {
          e.preventDefault();
          inputs[N - 1]?.focus();
        }
      };

      const onPaste = (e: ClipboardEvent) => {
        e.preventDefault();
        goUser(true);
        const data = e.clipboardData || (window as unknown as { clipboardData?: DataTransfer }).clipboardData;
        const text = data ? data.getData("text") : "";
        const digits = (text || "").replace(/[^0-9]/g, "").slice(0, N).split("");
        if (!digits.length) return;
        root?.classList.remove("foc-success", "foc-shake");
        for (let i = 0; i < N; i++) {
          if (digits[i]) {
            fillDigit(i, digits[i], true);
          } else {
            if (inputs[i]) inputs[i].value = "";
            boxes[i]?.classList.remove("foc-box--filled");
          }
        }
        const next = Math.min(digits.length, N - 1);
        inputs[next]?.focus();
        if (allFilled()) verifyUser();
      };

      inp.addEventListener("pointerdown", onPointerDown);
      inp.addEventListener("focus", onFocus);
      inp.addEventListener("input", onInput);
      inp.addEventListener("keydown", onKeyDown as EventListener);
      inp.addEventListener("paste", onPaste as EventListener);

      listeners.push(
        { el: inp, event: "pointerdown", handler: onPointerDown },
        { el: inp, event: "focus", handler: onFocus },
        { el: inp, event: "input", handler: onInput },
        { el: inp, event: "keydown", handler: onKeyDown as EventListener },
        { el: inp, event: "paste", handler: onPaste as EventListener }
      );
    });

    if (form) {
      const onSubmit = (e: Event) => {
        e.preventDefault();
        goUser(false);
        if (allFilled()) verifyUser();
      };
      form.addEventListener("submit", onSubmit);
      listeners.push({ el: form, event: "submit", handler: onSubmit });
    }

    /* ---------- idle self demo ---------- */
    let script: { t: number; fn: () => void; end?: boolean }[] = [];
    let sIdx = 0;
    let timeline = 0;
    let cycle = 0;
    let prevNow = performance.now();
    let animId: number;

    function buildScript() {
      script = [];
      timeline = 0;
      sIdx = 0;
      const good = cycle % 2 === 0;
      const code = good ? CODE_OK : CODE_NO;

      script.push({
        t: 0,
        fn: function () {
          resetBoxes();
          setStatus("Enter the 6-digit code", "");
        },
      });

      let t = 460;
      for (let i = 0; i < N; i++) {
        const idx = i;
        const at = t;
        script.push({
          t: at,
          fn: function () {
            setActive(idx);
          },
        });
        script.push({
          t: at + 130,
          fn: function () {
            fillDigit(idx, code.charAt(idx), true);
          },
        });
        t += 300;
      }
      script.push({
        t: t + 120,
        fn: function () {
          clearActive();
        },
      });
      t += 520;

      if (good) {
        script.push({
          t: t,
          fn: function () {
            success(true);
          },
        });
        t += 2200;
      } else {
        script.push({
          t: t,
          fn: function () {
            wrong();
          },
        });
        t += 1600;
      }
      script.push({ t: t + 620, end: true, fn: function () {} });
    }

    function frame() {
      const p = performance.now();
      let dt = p - prevNow;
      if (dt < 0) dt = 0;
      if (dt > 80) dt = 80;
      prevNow = p;

      if (userActive) {
        if (enableDemo && p - lastInteract > RESUME_MS) {
          userActive = false;
          if (reduce) {
            resetBoxes();
            setActive(0);
            setStatus("Enter the 6-digit code", "");
          } else {
            cycle++;
            buildScript();
          }
        }
      } else if (enableDemo && !reduce) {
        timeline += dt;
        while (sIdx < script.length && script[sIdx].t <= timeline) {
          const step = script[sIdx++];
          try {
            step.fn();
          } catch {}
          if (step.end) {
            cycle++;
            buildScript();
            break;
          }
        }
      }
      animId = raf(frame);
    }

    if (enableDemo) {
      buildScript();
      if (reduce) {
        resetBoxes();
        setActive(0);
        setStatus("Enter the 6-digit code", "");
      }
      prevNow = performance.now();
      animId = raf(frame);
    }

    if (mq.addEventListener) {
      const onMqChange = (e: MediaQueryListEvent) => {
        reduce = Boolean(e.matches);
        if (reduce) {
          resetBoxes();
          setActive(0);
          setStatus("Enter the 6-digit code", "");
        } else {
          cycle++;
          buildScript();
        }
      };
      mq.addEventListener("change", onMqChange);
      listeners.push({ el: mq as unknown as HTMLElement, event: "change", handler: onMqChange as EventListener });
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (wrongTimer) clearTimeout(wrongTimer);
      listeners.forEach(({ el, event, handler }) => {
        el.removeEventListener(event, handler);
      });
    };
  }, [firstName, onComplete, enableDemo]);

  return (
    <div ref={rootRef} className="foc-root">
      <div className="foc-head">
        <span className="foc-eyebrow">Security check</span>
        <h2 className="foc-title">Enter your code</h2>
        <p className="foc-sub">We sent a 6-digit code to verify {firstName}.</p>
      </div>

      <form className="foc-form" noValidate autoComplete="off">
        <div className="foc-boxes" role="group" aria-label="One-time code, 6 digits">
          <span className="foc-ripple" aria-hidden="true"></span>
          <span className="foc-ripple foc-ripple--blue" aria-hidden="true"></span>

          <div className="foc-box" style={{ "--foc-i": 0 } as React.CSSProperties}>
            <span className="foc-caret" aria-hidden="true"></span>
            <input
              suppressHydrationWarning
              className="foc-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              autoComplete="one-time-code"
              spellCheck={false}
              aria-label="Digit 1 of 6"
            />
            <svg className="foc-check" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.6l4.3 4.3L19 6.7" />
            </svg>
          </div>
          <div className="foc-box" style={{ "--foc-i": 1 } as React.CSSProperties}>
            <span className="foc-caret" aria-hidden="true"></span>
            <input
              suppressHydrationWarning
              className="foc-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              spellCheck={false}
              aria-label="Digit 2 of 6"
            />
            <svg className="foc-check" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.6l4.3 4.3L19 6.7" />
            </svg>
          </div>
          <div className="foc-box" style={{ "--foc-i": 2 } as React.CSSProperties}>
            <span className="foc-caret" aria-hidden="true"></span>
            <input
              suppressHydrationWarning
              className="foc-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              spellCheck={false}
              aria-label="Digit 3 of 6"
            />
            <svg className="foc-check" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.6l4.3 4.3L19 6.7" />
            </svg>
          </div>

          <span className="foc-divider" aria-hidden="true"></span>

          <div className="foc-box" style={{ "--foc-i": 3 } as React.CSSProperties}>
            <span className="foc-caret" aria-hidden="true"></span>
            <input
              suppressHydrationWarning
              className="foc-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              spellCheck={false}
              aria-label="Digit 4 of 6"
            />
            <svg className="foc-check" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.6l4.3 4.3L19 6.7" />
            </svg>
          </div>
          <div className="foc-box" style={{ "--foc-i": 4 } as React.CSSProperties}>
            <span className="foc-caret" aria-hidden="true"></span>
            <input
              suppressHydrationWarning
              className="foc-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              spellCheck={false}
              aria-label="Digit 5 of 6"
            />
            <svg className="foc-check" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.6l4.3 4.3L19 6.7" />
            </svg>
          </div>
          <div className="foc-box" style={{ "--foc-i": 5 } as React.CSSProperties}>
            <span className="foc-caret" aria-hidden="true"></span>
            <input
              suppressHydrationWarning
              className="foc-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              spellCheck={false}
              aria-label="Digit 6 of 6"
            />
            <svg className="foc-check" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.6l4.3 4.3L19 6.7" />
            </svg>
          </div>
        </div>

        <div className="foc-status" role="status" aria-live="polite">
          <span className="foc-status-dot" aria-hidden="true"></span>
          <span className="foc-status-text">Enter the 6-digit code</span>
        </div>
        <p className="foc-hint">Tip: 204815 verifies, any other code fails. Paste fills every box.</p>
      </form>
    </div>
  );
}
