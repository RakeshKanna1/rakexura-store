"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, KeyRound, Copy, Check, Sparkles, ShieldCheck } from "lucide-react";
import styles from "@/components/auth/animated-otp.module.css";
import { toast } from "sonner";
import { buildOtpVerificationEmailHtml, getSupabaseOtpEmailTemplateHtml } from "@/lib/email-templates";

export default function OtpPreviewPage() {
  const [activeTab, setActiveTab] = useState<"input" | "email">("input");
  const [copiedSupabase, setCopiedSupabase] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [previewCode, setPreviewCode] = useState("204815");
  const [previewName, setPreviewName] = useState("Alex Gamer");
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

  // Main animation frame loop for input demo
  useEffect(() => {
    if (!mounted || activeTab !== "input") return;
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
  }, [userActive, mounted, activeTab]);

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

  // Generate Email HTML
  const emailHtml = useMemo(() => {
    return buildOtpVerificationEmailHtml({
      otpCode: previewCode || "204815",
      userName: previewName || "Alex Gamer",
      userEmail: "gamer@rakexura.store",
      purpose: "sign in verification",
      expiresInMinutes: 10,
    });
  }, [previewCode, previewName]);

  const handleCopySupabaseTemplate = () => {
    const template = getSupabaseOtpEmailTemplateHtml();
    navigator.clipboard.writeText(template);
    setCopiedSupabase(true);
    toast.success("Copied Supabase Email Template ({{ .Token }}) to clipboard!");
    setTimeout(() => setCopiedSupabase(false), 2500);
  };

  const handleCopyRawHtml = () => {
    navigator.clipboard.writeText(emailHtml);
    setCopiedHtml(true);
    toast.success("Copied Email HTML template to clipboard!");
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col items-center justify-start p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#facc15]/5 blur-[120px] pointer-events-none" />
      <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-[#25d366]/5 blur-[120px] pointer-events-none" />

      {/* Top Bar Navigation & Tab Switcher */}
      <header className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-4 py-4 mb-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8991a6] hover:text-white transition-colors bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 px-3.5 py-2 rounded-lg"
        >
          <ArrowLeft size={14} />
          <span>Back to Store</span>
        </Link>

        {/* Tab Switcher */}
        <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab("input")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "input"
                ? "bg-[#facc15] text-black shadow-md"
                : "text-[#8991a6] hover:text-white"
            }`}
          >
            <KeyRound size={14} />
            <span>Interactive Input Demo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "email"
                ? "bg-[#facc15] text-black shadow-md"
                : "text-[#8991a6] hover:text-white"
            }`}
          >
            <Mail size={14} />
            <span>HTML Email Template</span>
          </button>
        </div>
      </header>

      {/* Tab 1: Interactive Animated Input */}
      {activeTab === "input" && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md my-auto z-10">
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
      )}

      {/* Tab 2: HTML Email Template Preview (Redwiat-Style) */}
      {activeTab === "email" && (
        <div className="w-full max-w-4xl flex flex-col items-center gap-6 z-10 pb-12">
          {/* Controls Header */}
          <div className="w-full bg-[#0c0d14] border border-white/10 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8991a6] mb-1">
                  Test Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={previewCode}
                  onChange={(e) => setPreviewCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="bg-black/50 border border-white/15 rounded-lg px-3 py-1.5 text-sm font-mono font-bold tracking-widest text-[#facc15] w-28 text-center focus:border-[#facc15] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8991a6] mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={previewName}
                  onChange={(e) => setPreviewName(e.target.value)}
                  className="bg-black/50 border border-white/15 rounded-lg px-3 py-1.5 text-sm font-bold text-white w-40 focus:border-[#facc15] outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopySupabaseTemplate}
                className="flex items-center gap-2 bg-[#facc15] text-black px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide hover:bg-[#e6bb12] transition-colors shadow-md"
              >
                {copiedSupabase ? <Check size={15} /> : <Sparkles size={15} />}
                <span>{copiedSupabase ? "Copied Template!" : "Copy Supabase {{ .Token }} Template"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyRawHtml}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-colors border border-white/10"
              >
                {copiedHtml ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedHtml ? "Copied HTML!" : "Copy HTML"}</span>
              </button>
            </div>
          </div>

          {/* Email Info Banner */}
          <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck size={16} className="shrink-0 text-emerald-400" />
            <span>
              <strong>Responsive HTML Email Template:</strong> Designed with full table-based layout compatibility for Gmail, Outlook, Apple Mail, iOS Mail, and Android.
            </span>
          </div>

          {/* Rendered Email Frame */}
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="bg-[#181920] px-4 py-2.5 flex items-center justify-between border-b border-white/10 text-xs text-[#8991a6]">
              <span className="font-mono">From: Rakexura Security &lt;security@rakexura.store&gt;</span>
              <span className="font-mono">Subject: Your Rakexura Verification Code</span>
            </div>
            <iframe
              srcDoc={emailHtml}
              title="OTP Email Preview"
              className="w-full h-[640px] border-0 bg-[#f4f5f7]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
