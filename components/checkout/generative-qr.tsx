"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { RefreshCw, QrCode } from "lucide-react";

interface GenerativeQrProps {
  upiId: string;
  amount: number;
  payeeName?: string;
  note?: string;
  size?: number;
  className?: string;
}

export function GenerativeQr({
  upiId,
  amount,
  payeeName = "Rakexura",
  note = "Rakexura Game Order",
  size = 160,
  className = "",
}: GenerativeQrProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [generating, setGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);

  const formattedAmount = amount.toFixed(2);
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

  const renderQrCode = useCallback(async () => {
    if (!canvasRef.current) return;
    setGenerating(true);
    setHasError(false);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2d canvas context");

      // High-DPI canvas resolution scaling for sharp QR rendering
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const displaySize = size;
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
      ctx.scale(dpr, dpr);

      // Generate clean QR code onto canvas without center overlay
      await QRCode.toCanvas(canvas, upiUrl, {
        width: displaySize * dpr,
        margin: 1,
        errorCorrectionLevel: "M",
        color: {
          dark: "#0a0a0f", // Crisp dark modules
          light: "#ffffff", // Pure white background
        },
      });

    } catch (err) {
      console.error("Generative QR code rendering failed:", err);
      setHasError(true);
    } finally {
      setGenerating(false);
    }
  }, [upiUrl, size]);

  useEffect(() => {
    void renderQrCode();
  }, [renderQrCode]);

  return (
    <div className={`relative flex flex-col items-center justify-between rounded-lg bg-white p-3 text-black text-center shadow-sm border border-slate-200 select-none ${className}`}>
      {/* Header with Rakexura Brand Badge & Name */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="relative h-5 w-5 rounded-full overflow-hidden shrink-0 bg-[#0d111c]">
          <Image
            src="/Assets/RakeBadge.png"
            alt="Rakexura Logo"
            fill
            className="object-contain p-0.5"
          />
        </span>
        <span className="text-xs font-extrabold text-slate-900 truncate">{payeeName}</span>
      </div>

      {/* Clean QR Canvas */}
      <div className="relative flex items-center justify-center my-0.5">
        <canvas
          ref={canvasRef}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="block cursor-pointer"
          title={`Scan to pay ₹${formattedAmount} via any UPI app`}
        />

        {generating && (
          <div className="absolute inset-0 bg-white/90 rounded flex flex-col items-center justify-center text-slate-700 text-[11px] font-semibold gap-1">
            <RefreshCw size={16} className="animate-spin text-slate-600" />
            <span>Updating...</span>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 bg-white rounded flex flex-col items-center justify-center text-center p-2 text-red-500 text-[11px]">
            <QrCode size={18} className="mb-1" />
            <span>Could not load QR</span>
          </div>
        )}
      </div>

      {/* Footer UPI ID */}
      <div className="mt-1 pt-1 border-t border-slate-100 w-full text-[10px] text-slate-500 font-mono font-medium truncate">
        UPI ID: {upiId}
      </div>
    </div>
  );
}
