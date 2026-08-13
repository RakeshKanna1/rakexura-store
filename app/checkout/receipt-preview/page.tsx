"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ThermalReceiptPrinter } from "@/components/checkout/thermal-receipt-printer";

function PreviewFocusModeWhatsAppPrinter({
  orderReference,
  customerName,
  total,
  items,
  whatsappUrl,
}: {
  orderReference: string;
  customerName: string;
  total: number;
  items: Array<{ name: string; platform?: string; price: number; quantity?: number }>;
  whatsappUrl: string;
}) {
  const [secondsLeft, setSecondsLeft] = useState(12);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [key, setKey] = useState(1);

  const doRedirect = useCallback(() => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    toast.success("Demo Complete! In live checkout, this opens WhatsApp.");
    setTimeout(() => {
      setIsRedirecting(false);
    }, 2000);
  }, [isRedirecting]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          doRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [doRedirect, key]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const restartDemo = () => {
    setSecondsLeft(12);
    setIsRedirecting(false);
    setKey((k) => k + 1);
  };

  if (!mounted) return null;

  return (
    <div className="py-2 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 w-full max-w-sm mx-auto font-sans">
      {/* Clean Professional Header Card */}
      <div className="w-full mb-4 p-4 rounded-xl border border-white/10 bg-[#0d111c] text-center relative overflow-hidden font-sans shadow-lg">
        {/* Animated Top Border Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-black/40 overflow-hidden">
          <motion.div
            key={key}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 12, ease: "linear" }}
            className="h-full bg-gradient-to-r from-[#00bb7f] via-[#facc15] to-[#00d68f]"
          />
        </div>

        <h3 className="text-sm font-bold text-white flex items-center justify-center gap-2 pt-0.5">
          <span className="h-2 w-2 rounded-full bg-[#00d68f] shadow-[0_0_8px_#00d68f]" />
          <span>Connecting to WhatsApp</span>
        </h3>

        <p className="text-xs text-[#8d95aa] mt-1 font-mono">
          {secondsLeft > 0 ? (
            <span>Redirecting automatically in <span className="text-[#00d68f] font-bold">{secondsLeft}s</span></span>
          ) : (
            <span className="text-[#00d68f] font-bold">Opening WhatsApp...</span>
          )}
        </p>

        {/* Skip / Action Buttons */}
        <div className="mt-3.5 flex items-center justify-center gap-2">
          <button
            suppressHydrationWarning
            type="button"
            onClick={doRedirect}
            className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-[#00bb7f] hover:bg-[#00a872] text-[#05070f] font-bold text-xs transition cursor-pointer active:scale-[0.98]"
          >
            <span>Open WhatsApp Now</span>
            <MessageCircle size={14} />
          </button>
          <button
            suppressHydrationWarning
            type="button"
            onClick={restartDemo}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-white/5 hover:bg-white/10 text-[#8d95aa] hover:text-white border border-white/10 font-medium text-xs transition cursor-pointer"
            title="Replay demo animation"
          >
            <RefreshCw size={13} />
            <span>Replay</span>
          </button>
        </div>

        <p className="text-[11px] text-[#8d95aa] mt-3">
          Tap or tear receipt below to open WhatsApp immediately
        </p>
      </div>

      {/* 3D Thermal Receipt Printer */}
      <ThermalReceiptPrinter
        key={key}
        orderReference={orderReference}
        customerName={customerName}
        total={total}
        items={items}
        autoPrint={true}
        statusHeading=""
        statusSubtext=""
        hideActions={true}
        onTearComplete={doRedirect}
      />
    </div>
  );
}

export default function ReceiptPreviewPage() {
  const demoItems = [
    { name: "Grand Theft Auto V", platform: "Steam", price: 149, quantity: 1 },
    { name: "Cyberpunk 2077: Phantom Liberty", platform: "Epic", price: 199, quantity: 1 }
  ];

  return (
    <div className="min-h-screen bg-[#05070f] text-white flex flex-col items-center justify-center p-4 relative font-sans">
      <div className="absolute top-6 left-6 z-50">
        <Link
          href="/checkout"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#8d95aa] hover:text-white transition bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-md border border-white/10"
        >
          <ArrowLeft size={14} />
          Back to Checkout
        </Link>
      </div>

      <div className="w-full max-w-lg rounded-xl bg-[#0d111c] border border-white/10 p-6 text-center shadow-xl relative">
        <PreviewFocusModeWhatsAppPrinter
          orderReference="RKX-2608-DEMO"
          customerName="Rakexura Gamer"
          total={348}
          items={demoItems}
          whatsappUrl="https://wa.me/918317416695"
        />
      </div>
    </div>
  );
}
