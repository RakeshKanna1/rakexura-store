"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle2, AlertCircle, Copy, Sparkles } from "lucide-react";
import styles from "@/components/auth/animated-otp.module.css";
import { toast } from "sonner";

export default function OtpPreviewPage() {
  const [mounted, setMounted] = useState(false);
  const [autoDemo, setAutoDemo] = useState(true);
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
        if (autoDemo && p - lastInteractRef.current > RESUME_MS) {
          setUserActive(false);
          cycleRef.current++;
          buildScript();
        }
      } else if (autoDemo) {
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
  }, [autoDemo, userActive]);

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

  const fillTestCode = (code: string) => {
    goUser(true);
    const split = code.split("");
    setDigits(split);
    inputsRef.current[5]?.focus();
    handleVerify(code);
  };

  const resetAll = () => {
    setUserActive(false);
    cycleRef.current = 0;
    buildScript();
    toast.info("Demo animation reset to beginning");
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#facc15]/5 blur-[120px] pointer-events-none" />
      <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-[#25d366]/5 blur-[120px] pointer-events-none" />

      {/* Top Header & Navigation */}
      <div className="w-full max-w-xl flex items-center justify-between mb-8 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8991a6] hover:text-white transition-colors bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft size={14} />
          <span>Back to Store</span>
        </Link>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#facc15] font-bold bg-[#facc15]/10 border border-[#facc15]/20 px-3 py-1.5 rounded-lg">
          <Sparkles size={13} />
          <span>OTP Animation Live Preview</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0f17]/90 p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl relative z-10">
        {/* The Animated OTP Component HTML/CSS */}
        <div
          className={`${styles["foc-root"]} ${isSuccess ? styles["foc-success"] : ""} ${
            isShake ? styles["foc-shake"] : ""
          }`}
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

      {/* Interactive Control Dashboard */}
      <div className="w-full max-w-md mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs space-y-3 z-10">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#8991a6] uppercase tracking-wider text-[10px]">
            Preview Controls
          </span>
          <div className="flex items-center gap-2">
            <button
              suppressHydrationWarning
              onClick={() => setAutoDemo(!autoDemo)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                autoDemo
                  ? "bg-[#25d366]/15 text-[#25d366] border border-[#25d366]/30"
                  : "bg-white/5 text-[#8991a6] border border-white/10"
              }`}
            >
              {autoDemo ? <Play size={11} /> : <Pause size={11} />}
              <span>{autoDemo ? "Self-Demo: Active" : "Self-Demo: Paused"}</span>
            </button>
            <button
              suppressHydrationWarning
              onClick={resetAll}
              className="p-1 text-[#8991a6] hover:text-white hover:bg-white/10 rounded transition"
              title="Reset Animation"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            suppressHydrationWarning
            onClick={() => fillTestCode(CODE_OK)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#25d366]/10 hover:bg-[#25d366]/20 text-[#25d366] border border-[#25d366]/30 font-bold transition cursor-pointer"
          >
            <CheckCircle2 size={14} />
            <span>Test Success ({CODE_OK})</span>
          </button>
          <button
            suppressHydrationWarning
            onClick={() => fillTestCode(CODE_NO)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#ff636e]/10 hover:bg-[#ff636e]/20 text-[#ff636e] border border-[#ff636e]/30 font-bold transition cursor-pointer"
          >
            <AlertCircle size={14} />
            <span>Test Error Shake ({CODE_NO})</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-[#727a90]">
          <span>Interactive state: <strong className="text-white">{userActive ? "User typing" : "Auto loop"}</strong></span>
          <button
            suppressHydrationWarning
            onClick={() => {
              navigator.clipboard.writeText("204815");
              toast.success("Copied 204815! Press Ctrl+V on any box to test paste.");
            }}
            className="inline-flex items-center gap-1 text-[#facc15] hover:underline cursor-pointer"
          >
            <Copy size={11} />
            <span>Copy 204815</span>
          </button>
        </div>
      </div>
    </div>
  );
}
