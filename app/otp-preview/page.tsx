"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "@/components/auth/animated-otp.module.css";
import { toast } from "sonner";

export default function OtpPreviewPage() {
  const [mounted, setMounted] = useState(false);
  const [userActive, setUserActive] = useState(false);
  const [statusText, setStatusText] = useState("Enter the 6-digit code");
  const [statusType, setStatusType] = useState<"" | "ok" | "err">("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShake, setIsShake] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [tapIndex, setTapIndex] = useState<number | null>(null);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const cycleRef = useRef<number>(0);
  const scriptRef = useRef<{ t: number; end?: boolean; fn: () => void }[]>([]);
  const sIdxRef = useRef<number>(0);
  const timelineRef = useRef<number>(0);
  const prevNowRef = useRef<number>(0);
  const lastInteractRef = useRef<number>(0);
  const wrongTimerRef = useRef<NodeJS.Timeout | null>(null);

  const CODE_OK = "204815";
  const CODE_NO = "061947";
  const RESUME_MS = 5200;

  // Build idle autoplay script
  const buildScript = () => {
    scriptRef.current = [];
    timelineRef.current = 0;
    sIdxRef.current = 0;
    const good = cycleRef.current % 2 === 0;
    const code = good ? CODE_OK : CODE_NO;

    scriptRef.current.push({
      t: 0,
      fn: () => {
        setIsSuccess(false);
        setIsShake(false);
        setDigits(Array(6).fill(""));
        setActiveIndex(-1);
        setStatusText("Enter the 6-digit code");
        setStatusType("");
      },
    });

    let t = 460;
    for (let i = 0; i < 6; i++) {
      const idx = i;
      const char = code.charAt(idx);
      const at = t;

      scriptRef.current.push({
        t: at,
        fn: () => {
          setActiveIndex(idx);
        },
      });

      scriptRef.current.push({
        t: at + 130,
        fn: () => {
          setDigits((prev) => {
            const next = [...prev];
            next[idx] = char;
            return next;
          });
          setTapIndex(idx);
          setTimeout(() => setTapIndex(null), 300);
        },
      });
      t += 300;
    }

    scriptRef.current.push({
      t: t + 120,
      fn: () => {
        setActiveIndex(-1);
      },
    });
    t += 520;

    if (good) {
      scriptRef.current.push({
        t: t,
        fn: () => {
          setIsShake(false);
          setIsSuccess(true);
          setActiveIndex(-1);
          setStatusText("Code verified");
          setStatusType("ok");
        },
      });
      t += 2200;
    } else {
      scriptRef.current.push({
        t: t,
        fn: () => {
          setIsSuccess(false);
          setIsShake(true);
          setActiveIndex(-1);
          setStatusText("Incorrect code, try 204815");
          setStatusType("err");
        },
      });
      t += 1600;
    }

    scriptRef.current.push({
      t: t + 620,
      end: true,
      fn: () => {},
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Main animation frame loop
  useEffect(() => {
    if (!mounted) return;
    buildScript();
    prevNowRef.current = performance.now();

    const frame = () => {
      const p = performance.now();
      let dt = p - prevNowRef.current;
      if (dt < 0) dt = 0;
      if (dt > 80) dt = 80;
      prevNowRef.current = p;

      if (userActive) {
        if (p - lastInteractRef.current > RESUME_MS) {
          setUserActive(false);
          cycleRef.current++;
          buildScript();
        }
      } else {
        timelineRef.current += dt;
        while (sIdxRef.current < scriptRef.current.length && scriptRef.current[sIdxRef.current].t <= timelineRef.current) {
          const step = scriptRef.current[sIdxRef.current++];
          try {
            step.fn();
          } catch {}
          if (step.end) {
            cycleRef.current++;
            buildScript();
            break;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(frame);
    };

    animFrameRef.current = requestAnimationFrame(frame);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    };
  }, [userActive, mounted]);

  // Real user interaction helpers
  const goUser = (reset = false) => {
    if (wrongTimerRef.current) {
      clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = null;
    }
    if (!userActive && reset) {
      setDigits(Array(6).fill(""));
      setIsSuccess(false);
      setIsShake(false);
      setStatusText("Enter the 6-digit code");
      setStatusType("");
    }
    setUserActive(true);
    lastInteractRef.current = performance.now();
  };

  const handleVerify = (typedCode: string) => {
    if (typedCode === CODE_OK) {
      setIsShake(false);
      setIsSuccess(true);
      setActiveIndex(-1);
      setStatusText("Code verified");
      setStatusType("ok");
      toast.success("Correct Code Verified (204815)!");
    } else {
      setIsSuccess(false);
      setIsShake(true);
      setActiveIndex(-1);
      setStatusText("Incorrect code, try 204815");
      setStatusType("err");
      toast.error(`Code ${typedCode} failed. Try 204815!`);

      lastInteractRef.current = performance.now();
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => {
        wrongTimerRef.current = null;
        if (!userActive) return;
        setDigits(Array(6).fill(""));
        setIsShake(false);
        setIsSuccess(false);
        setStatusText("Enter the 6-digit code");
        setStatusType("");
        inputsRef.current[0]?.focus();
      }, 1500);
    }
  };

  const handleInputChange = (idx: number, val: string) => {
    goUser(false);
    const clean = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);

    if (clean) {
      setTapIndex(idx);
      setTimeout(() => setTapIndex(null), 300);
      if (idx < 5) {
        inputsRef.current[idx + 1]?.focus();
        setActiveIndex(idx + 1);
      }
    }

    setIsShake(false);
    setIsSuccess(false);

    if (next.every((d) => d !== "")) {
      handleVerify(next.join(""));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    goUser(false);
    if (e.key === "Backspace") {
      if (!digits[idx] && idx > 0) {
        e.preventDefault();
        const next = [...digits];
        next[idx - 1] = "";
        setDigits(next);
        inputsRef.current[idx - 1]?.focus();
        setActiveIndex(idx - 1);
      } else if (digits[idx]) {
        const next = [...digits];
        next[idx] = "";
        setDigits(next);
      }
      setIsShake(false);
      setIsSuccess(false);
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      inputsRef.current[idx - 1]?.focus();
      setActiveIndex(idx - 1);
    } else if (e.key === "ArrowRight" && idx < 5) {
      e.preventDefault();
      inputsRef.current[idx + 1]?.focus();
      setActiveIndex(idx + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    goUser(true);
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const next = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    setIsShake(false);
    setIsSuccess(false);

    const focusIdx = Math.min(pasted.length, 5);
    inputsRef.current[focusIdx]?.focus();
    setActiveIndex(focusIdx);

    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#facc15]/5 blur-[120px] pointer-events-none" />
      <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-[#25d366]/5 blur-[120px] pointer-events-none" />

      {/* Minimal subtle back link */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#8991a6] hover:text-white transition-colors bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 px-3 py-1.5 rounded-lg z-20"
      >
        <ArrowLeft size={13} />
        <span>Store</span>
      </Link>

      {/* The Animated OTP Component */}
      <div
        className={`${styles["foc-root"]} ${isSuccess ? styles["foc-success"] : ""} ${
          isShake ? styles["foc-shake"] : ""
        } relative z-10`}
      >
          <div className={styles["foc-head"]}>
            <span className={styles["foc-eyebrow"]}>Security check</span>
            <h2 className={styles["foc-title"]}>Enter your code</h2>
            <p className={styles["foc-sub"]}>We sent a 6-digit code to verify your account.</p>
          </div>

          <form className={styles["foc-form"]} onSubmit={(e) => e.preventDefault()} noValidate autoComplete="off">
            <div className={styles["foc-boxes"]} role="group" aria-label="One-time code, 6 digits">
              <span className={styles["foc-ripple"]} aria-hidden="true" />
              <span className={`${styles["foc-ripple"]} ${styles["foc-ripple--blue"]}`} aria-hidden="true" />

              {digits.map((digit, i) => {
                const isActive = activeIndex === i;
                const isFilled = digit !== "";
                const isTapped = tapIndex === i;

                return (
                  <React.Fragment key={i}>
                    {i === 3 && <span className={styles["foc-divider"]} aria-hidden="true" />}
                    <div
                      className={`${styles["foc-box"]} ${isActive ? styles["foc-box--active"] : ""} ${
                        isFilled ? styles["foc-box--filled"] : ""
                      } ${isTapped ? styles["foc-box--tap"] : ""}`}
                      style={{ "--foc-i": i } as React.CSSProperties}
                      onClick={() => {
                        goUser(false);
                        inputsRef.current[i]?.focus();
                        setActiveIndex(i);
                      }}
                    >
                      <span className={styles["foc-caret"]} aria-hidden="true" />
                      <input
                        ref={(el) => {
                          inputsRef.current[i] = el;
                        }}
                        className={styles["foc-input"]}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        suppressHydrationWarning
                        onPointerDown={() => goUser(true)}
                        onFocus={() => {
                          goUser(true);
                          setActiveIndex(i);
                        }}
                        onChange={(e) => handleInputChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={handlePaste}
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        spellCheck={false}
                        aria-label={`Digit ${i + 1} of 6`}
                      />
                      <svg className={styles["foc-check"]} viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12.6l4.3 4.3L19 6.7" />
                      </svg>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            <div
              className={`${styles["foc-status"]} ${
                statusType === "ok"
                  ? styles["foc-status--ok"]
                  : statusType === "err"
                  ? styles["foc-status--err"]
                  : ""
              }`}
              role="status"
              aria-live="polite"
            >
              <span className={styles["foc-status-dot"]} aria-hidden="true" />
              <span className={styles["foc-status-text"]}>{statusText}</span>
            </div>

            <p className={styles["foc-hint"]}>
              Tip: <strong className="text-white font-mono">204815</strong> verifies, any other code fails. Paste fills every box.
            </p>
          </form>
        </div>
    </div>
  );
}
