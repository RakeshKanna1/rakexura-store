"use client";

import React, { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import styles from "./animated-otp.module.css";

interface AnimatedOtpInputProps {
  length?: number;
  email?: string;
  name?: string;
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  errorMessage?: string;
  onComplete: (code: string) => void;
  onCodeChange?: (code: string) => void;
}

export function AnimatedOtpInput({
  length = 6,
  email = "",
  name = "",
  isLoading = false,
  isError = false,
  isSuccess = false,
  errorMessage = "",
  onComplete,
  onCodeChange,
}: AnimatedOtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [tapIndex, setTapIndex] = useState<number | null>(null);
  const [shake, setShake] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Trigger shake animation when error happens
  useEffect(() => {
    if (isError) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isError]);

  const handleChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      onCodeChange?.(nextDigits.join(""));
      return;
    }

    const nextDigits = [...digits];
    const lastChar = numericValue.slice(-1);
    nextDigits[index] = lastChar;
    setDigits(nextDigits);

    // Tap animation
    setTapIndex(index);
    setTimeout(() => setTapIndex(null), 350);

    const fullCode = nextDigits.join("");
    onCodeChange?.(fullCode);

    // Auto-focus next input
    if (index < length - 1 && lastChar) {
      inputsRef.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }

    // Auto-submit if all digits are entered
    if (nextDigits.every((d) => d !== "") && nextDigits.length === length) {
      onComplete(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        setDigits(nextDigits);
        onCodeChange?.(nextDigits.join(""));
        inputsRef.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      } else {
        const nextDigits = [...digits];
        nextDigits[index] = "";
        setDigits(nextDigits);
        onCodeChange?.(nextDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    const nextDigits = Array(length).fill("");
    for (let i = 0; i < pasted.length; i++) {
      nextDigits[i] = pasted[i];
    }
    setDigits(nextDigits);
    const fullCode = nextDigits.join("");
    onCodeChange?.(fullCode);

    const targetFocus = Math.min(pasted.length, length - 1);
    inputsRef.current[targetFocus]?.focus();
    setActiveIndex(targetFocus);

    if (pasted.length === length) {
      onComplete(fullCode);
    }
  };

  const codeFilledCount = digits.filter((d) => d !== "").length;

  return (
    <div className={`${styles["foc-root"]} ${isSuccess ? styles["foc-success"] : ""} ${shake ? styles["foc-shake"] : ""}`}>
      {/* Header */}
      <div className={styles["foc-head"]}>
        <span className={styles["foc-eyebrow"]}>Security Check</span>
        <h2 className={styles["foc-title"]}>Enter Verification Code</h2>
        <p className={styles["foc-sub"]}>
          {email ? (
            <>
              We sent a 6-digit code to <strong className="text-white">{email}</strong>
            </>
          ) : (
            `We sent a 6-digit code to verify ${name || "your account"}.`
          )}
        </p>
      </div>

      {/* Boxes Form */}
      <div className={styles["foc-form"]}>
        <div className={styles["foc-boxes"]} role="group" aria-label="One-time code, 6 digits">
          <span className={styles["foc-ripple"]} aria-hidden="true" />
          <span className={`${styles["foc-ripple"]} ${styles["foc-ripple--blue"]}`} aria-hidden="true" />

          {digits.map((digit, i) => {
            const isActive = activeIndex === i;
            const isFilled = digit !== "";
            const isTapped = tapIndex === i;

            return (
              <React.Fragment key={i}>
                {/* Visual Divider in the center */}
                {i === 3 && <span className={styles["foc-divider"]} aria-hidden="true" />}

                <div
                  className={`${styles["foc-box"]} ${isActive ? styles["foc-box--active"] : ""} ${
                    isFilled ? styles["foc-box--filled"] : ""
                  } ${isTapped ? styles["foc-box--tap"] : ""}`}
                  style={{ "--foc-i": i } as React.CSSProperties}
                  onClick={() => inputsRef.current[i]?.focus()}
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
                    disabled={isLoading || isSuccess}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={() => setActiveIndex(i)}
                    onPaste={handlePaste}
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    spellCheck={false}
                    aria-label={`Digit ${i + 1} of ${length}`}
                  />
                  {/* SVG Checkmark */}
                  <svg className={styles["foc-check"]} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12.6l4.3 4.3L19 6.7" />
                  </svg>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Live Status Indicator */}
        <div
          className={`${styles["foc-status"]} ${
            isSuccess
              ? styles["foc-status--ok"]
              : isError
              ? styles["foc-status--err"]
              : ""
          }`}
          role="status"
          aria-live="polite"
        >
          <span className={styles["foc-status-dot"]} aria-hidden="true" />
          <span className={styles["foc-status-text"]}>
            {isLoading ? (
              <span className="flex items-center gap-1.5 text-amber-400">
                <Loader2 size={13} className="animate-spin" /> Verifying security code...
              </span>
            ) : isSuccess ? (
              "Code verified successfully!"
            ) : isError ? (
              errorMessage || "Invalid or expired code. Try again."
            ) : codeFilledCount === length ? (
              "Ready to submit"
            ) : (
              `Enter the 6-digit code (${codeFilledCount}/${length})`
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
