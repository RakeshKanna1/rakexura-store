"use client";

import { useEffect, useState, useCallback } from "react";
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
  size = 180,
  className = "",
}: GenerativeQrProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [hasError, setHasError] = useState(false);

  const formattedAmount = amount.toFixed(2);
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

  const renderQrCode = useCallback(async () => {
    setGenerating(true);
    setHasError(false);

    try {
      // Generate ultra-sharp 512x512 QR code data URL (scales responsively via CSS without layout blowout)
      const dataUrl = await QRCode.toDataURL(upiUrl, {
        width: 512,
        margin: 1,
        errorCorrectionLevel: "M",
        color: {
          dark: "#0a0a0f", // Crisp dark modules
          light: "#ffffff", // Pure white background
        },
      });

      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error("Generative QR code rendering failed:", err);
      setHasError(true);
    } finally {
      setGenerating(false);
    }
  }, [upiUrl]);

  useEffect(() => {
    void renderQrCode();
  }, [renderQrCode]);

  return (
    <div className={`relative flex flex-col items-center justify-between rounded-xl bg-white p-3.5 text-black text-center shadow-md border border-slate-200 select-none w-full max-w-[220px] mx-auto overflow-hidden ${className}`}>
      {/* Header with Rakexura Brand Badge & Name */}
      <div className="flex items-center justify-between w-full mb-2 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
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
        <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">
          ₹{formattedAmount}
        </span>
      </div>

      {/* Responsive Sharp QR Image */}
      <div className="relative w-full aspect-square max-w-[180px] mx-auto flex items-center justify-center my-1 bg-white rounded-lg overflow-hidden">
        {qrDataUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={qrDataUrl}
            alt={`UPI QR Code for ₹${formattedAmount}`}
            className="w-full h-full object-contain block"
            width={size}
            height={size}
          />
        ) : null}

        {generating && (
          <div className="absolute inset-0 bg-white/95 rounded-lg flex flex-col items-center justify-center text-slate-700 text-[11px] font-semibold gap-1.5">
            <RefreshCw size={18} className="animate-spin text-violet-600" />
            <span>Generating QR...</span>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 bg-white rounded-lg flex flex-col items-center justify-center text-center p-2 text-red-500 text-[11px]">
            <QrCode size={20} className="mb-1" />
            <span>Could not load QR</span>
          </div>
        )}
      </div>

      {/* Footer UPI ID */}
      <div className="mt-2 pt-2 border-t border-slate-100 w-full text-[10px] text-slate-500 font-mono font-medium truncate" title={upiId}>
        UPI ID: {upiId}
      </div>
    </div>
  );
}
