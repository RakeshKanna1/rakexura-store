"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Printer } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ReceiptItem {
  name: string;
  platform?: string;
  price: number;
  quantity?: number;
}

interface ThermalReceiptPrinterProps {
  orderReference: string;
  customerName?: string;
  items: ReceiptItem[];
  total: number;
  taxRate?: number;
  date?: string;
  autoPrint?: boolean;
  statusHeading?: string;
  statusSubtext?: string;
  hideActions?: boolean;
  onTearComplete?: () => void;
}

export function ThermalReceiptPrinter({
  orderReference,
  items,
  total,
  taxRate = 0,
  date,
  autoPrint = true,
  statusHeading = "",
  statusSubtext = "",
  hideActions = false,
  onTearComplete,
}: ThermalReceiptPrinterProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrinted, setIsPrinted] = useState(false);
  const [isTorn, setIsTorn] = useState(false);
  const [tearDirection, setTearDirection] = useState<"right" | "left">("right");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bladeFlash, setBladeFlash] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const formattedDate = date || new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).toUpperCase();

  // Calculate subtotals
  const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = total > 0 ? total : subtotal + taxAmount;

  // Initialize Web Audio API
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume();
    }
  };

  // Play thermal motor sound
  const playPrinterSound = useCallback((durationMs: number) => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = durationMs / 1000;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(620, now);
    filter.Q.setValueAtTime(3.5, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.04, now + 0.08);
    gainNode.gain.setValueAtTime(0.04, now + duration - 0.12);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  }, [soundEnabled]);

  const playTearSound = () => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.35;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1400, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  };

  const hasAutoPrintedRef = useRef<string | null>(null);
  const isPrintingRef = useRef(false);

  const triggerPrint = useCallback(() => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;
    setIsTorn(false);
    setIsPrinted(false);
    setIsPrinting(true);

    const duration = 2200;
    playPrinterSound(duration);

    setTimeout(() => {
      isPrintingRef.current = false;
      setIsPrinting(false);
      setIsPrinted(true);
    }, duration);
  }, [playPrinterSound]);

  const triggerTear = (dir: "right" | "left" = "right") => {
    if (!isPrinted || isPrinting || isTorn) return;
    setTearDirection(dir);
    playTearSound();
    setBladeFlash(true);
    setIsTorn(true);

    setTimeout(() => {
      setIsPrinted(false);
      setBladeFlash(false);
      setIsTorn(false);
      if (onTearComplete) {
        onTearComplete();
      }
    }, 550);
  };

  useEffect(() => {
    if (autoPrint && hasAutoPrintedRef.current !== orderReference) {
      hasAutoPrintedRef.current = orderReference;
      const timer = setTimeout(() => {
        triggerPrint();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [orderReference, autoPrint, triggerPrint]);

  return (
    <div className="w-full flex flex-col items-center select-none py-2 font-sans">
      {/* Sound Mute Toggle */}
      <div className="w-full max-w-[260px] flex justify-end mb-1 px-1">
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-6 w-6 rounded bg-black/40 border border-white/10 text-[#8991a6] hover:text-[#facc15] hover:border-[#facc15]/30 flex items-center justify-center transition cursor-pointer"
          title={soundEnabled ? "Mute Sound" : "Enable Sound"}
        >
          {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>
      </div>

      {/* Main Dispenser Machine Unit */}
      <div className="relative w-[260px] flex flex-col items-center z-30">
        {/* Machine Hood Top */}
        <div className="w-[260px] h-[32px] rounded-t-md bg-[#0d111c] border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.5)] relative overflow-hidden z-30">
          <div className="absolute top-[1px] left-[4%] w-[92%] h-[1.5px] bg-gradient-to-r from-transparent via-[#facc15] to-transparent rounded-full opacity-75" />
          <div
            className={`absolute top-[12px] right-[12px] w-[6px] h-[6px] rounded-full transition-all ${
              isPrinting
                ? "bg-[#facc15] shadow-[0_0_10px_#facc15] animate-pulse"
                : "bg-[#00d68f] shadow-[0_0_8px_#00d68f]"
            }`}
          />
        </div>

        {/* Slot Slit */}
        <div className="w-[236px] h-[6px] -mt-[3px] bg-[#05070f] rounded-sm shadow-[inset_0_3px_6px_rgba(0,0,0,0.95)] z-10" />

        {/* Cutter Blade Flash Effect */}
        {bladeFlash && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0.1 }}
            animate={{ opacity: [0, 1, 0], scaleX: 1 }}
            transition={{ duration: 0.35 }}
            className="absolute top-[29px] z-40 w-[236px] h-[2px] bg-[#00d68f] shadow-[0_0_14px_#00d68f]"
          />
        )}

        {/* Machine Hood Bottom Lip */}
        <div className="w-[260px] h-[8px] -mt-[2px] rounded-b-md bg-[#0d111c] border border-white/10 border-t-0 shadow-md z-20" />
      </div>

      {/* Relative Flex Flow Paper Container (Pushes layout down naturally) */}
      <div className="w-full flex flex-col items-center -mt-[6px] z-10 relative">
        <AnimatePresence mode="wait">
          {(isPrinting || isPrinted || isTorn) && (
            <motion.div
              key="paper-wrapper"
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: isTorn ? 0 : "auto",
                opacity: isTorn ? 0 : 1,
              }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: isTorn ? 0.55 : 0.4 }}
              className="w-[240px] overflow-hidden flex flex-col items-center py-1"
              style={{
                filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.65))",
              }}
            >
              {/* Bi-Directional Left & Right Tear Paper Animation */}
              <motion.div
                drag={isPrinted && !isTorn && !isPrinting ? true : false}
                dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={(_, info) => {
                  if (isPrinted && !isTorn && !isPrinting) {
                    const isLeft = info.offset.x < 0;
                    triggerTear(isLeft ? "left" : "right");
                  }
                }}
                onClick={(e) => {
                  if (isPrinted && !isTorn && !isPrinting) {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const isLeft = clickX < rect.width / 2;
                    triggerTear(isLeft ? "left" : "right");
                  }
                }}
                initial={{ y: "-100%", opacity: 0 }}
                animate={
                  isPrinting
                    ? {
                        y: ["-100%", "-60%", "-20%", "0%"],
                        opacity: [0.2, 0.7, 0.95, 1],
                      }
                    : isTorn
                    ? tearDirection === "left"
                      ? {
                          x: [0, -18, -55, -110],
                          y: [0, 6, 14, 22],
                          rotate: [0, 3, 8, 14],
                          scale: [1, 1, 0.98, 0.94],
                          opacity: [1, 1, 0.8, 0],
                        }
                      : {
                          x: [0, 18, 55, 110],
                          y: [0, 6, 14, 22],
                          rotate: [0, -3, -8, -14],
                          scale: [1, 1, 0.98, 0.94],
                          opacity: [1, 1, 0.8, 0],
                        }
                    : { y: "0%", opacity: 1 }
                }
                transition={{
                  duration: isTorn ? 0.55 : isPrinting ? 2.2 : 0.35,
                  ease: isTorn ? [0.2, 0.8, 0.2, 1] : [0.22, 1, 0.36, 1],
                }}
                style={{
                  transformOrigin: tearDirection === "left" ? "top left" : "top right",
                  clipPath: `polygon(
                    0% 0%, 100% 0%,
                    100% calc(100% - 10px),
                    98.0% 100%, 96.0% calc(100% - 10px),
                    94.0% 100%, 92.0% calc(100% - 10px),
                    90.0% 100%, 88.0% calc(100% - 10px),
                    86.0% 100%, 84.0% calc(100% - 10px),
                    82.0% 100%, 80.0% calc(100% - 10px),
                    78.0% 100%, 76.0% calc(100% - 10px),
                    74.0% 100%, 72.0% calc(100% - 10px),
                    70.0% 100%, 68.0% calc(100% - 10px),
                    66.0% 100%, 64.0% calc(100% - 10px),
                    62.0% 100%, 60.0% calc(100% - 10px),
                    58.0% 100%, 56.0% calc(100% - 10px),
                    54.0% 100%, 52.0% calc(100% - 10px),
                    50.0% 100%, 48.0% calc(100% - 10px),
                    46.0% 100%, 44.0% calc(100% - 10px),
                    42.0% 100%, 40.0% calc(100% - 10px),
                    38.0% 100%, 36.0% calc(100% - 10px),
                    34.0% 100%, 32.0% calc(100% - 10px),
                    30.0% 100%, 28.0% calc(100% - 10px),
                    26.0% 100%, 24.0% calc(100% - 10px),
                    22.0% 100%, 20.0% calc(100% - 10px),
                    18.0% 100%, 16.0% calc(100% - 10px),
                    14.0% 100%, 12.0% calc(100% - 10px),
                    10.0% 100%, 8.0% calc(100% - 10px),
                    6.0% 100%, 4.0% calc(100% - 10px),
                    2.0% 100%, 0% calc(100% - 10px)
                  )`,
                }}
                className={`w-[220px] mx-auto bg-[#fafaf8] border border-[#d9dce5] border-t-0 text-[#05070f] font-sans pointer-events-auto relative shadow-2xl pb-3 ${
                  isPrinted && !isTorn && !isPrinting ? "cursor-grab active:cursor-grabbing hover:brightness-[0.98]" : ""
                }`}
              >
                {/* Authentic Thermal Paper Noise Grain Texture */}
                <div
                  className="absolute inset-0 opacity-[0.035] pointer-events-none z-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  }}
                />

                <div className="p-3 text-[11px] leading-snug relative z-20 font-sans">
                  {/* Receipt Header with Official Logo Image */}
                  <div className="flex justify-between items-start mb-2 font-sans">
                    <div>
                      <div className="font-extrabold text-[11px] text-[#6d28d9] tracking-wider font-sans">RAKEXURA STORE</div>
                      <div className="text-[9px] text-[#6a7282] font-sans">CYBER ORDER RECEIPT</div>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/Assets/RakeLogo.png"
                      alt="Rakexura"
                      className="w-7 h-7 rounded-sm object-contain shrink-0 shadow-sm"
                    />
                  </div>

                  {/* Amount Display */}
                  <div className="mb-2 font-sans">
                    <div className="text-xl font-black text-[#05070f] leading-none font-sans">
                      {formatPrice(grandTotal)}
                    </div>
                    <div className="text-[8px] text-[#6a7282] uppercase mt-0.5 font-sans">
                      {formattedDate} | {orderReference}
                    </div>
                  </div>

                  <div className="w-full border-b border-dashed border-[#d0d6e5] my-1.5" />

                  {/* Items breakdown */}
                  <div className="space-y-1 my-1.5 font-sans">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] font-sans">
                        <span className="truncate max-w-[130px]">
                          {item.quantity && item.quantity > 1 ? `${item.quantity}X ` : "1X "}
                          {item.name}
                        </span>
                        <span className="font-bold">{formatPrice(item.price * (item.quantity || 1))}</span>
                      </div>
                    ))}
                  </div>

                  <div className="w-full border-b border-dashed border-[#d0d6e5] my-1.5" />

                  {/* Totals */}
                  <div className="space-y-0.5 text-[10px] font-sans">
                    <div className="flex justify-between text-[#6a7282]">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#6a7282]">
                      <span>Tax ({taxRate}%)</span>
                      <span>{taxRate === 0 ? formatPrice(0) : formatPrice(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between font-black text-[11px] pt-1 border-t border-[#05070f] text-[#05070f]">
                      <span>TOTAL</span>
                      <span>{formatPrice(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Footer barcode */}
                  <div className="text-center mt-2.5 pt-1.5 font-sans">
                    <div className="text-[9px] font-bold text-[#6a7282] tracking-wider mb-1 font-sans">
                      HAVE A NICE DAY!
                    </div>
                    <div className="flex flex-col items-center gap-0.5 opacity-80 font-sans">
                      <div
                        className="w-[82%] h-5"
                        style={{
                          background: `repeating-linear-gradient(90deg, #05070f 0px, #05070f 1.5px, transparent 1.5px, transparent 3px, #05070f 3px, #05070f 4px, transparent 4px, transparent 5.5px, #05070f 5.5px, #05070f 8px, transparent 8px, transparent 9.5px)`,
                        }}
                      />
                      <div className="text-[8px] text-[#6a7282] font-sans">RX-STORE-{orderReference}</div>
                    </div>
                  </div>
                </div>

                {/* Jagged Serrated Paper Cut Bottom Edge Graphic */}
                <div className="w-full h-3 flex items-end overflow-hidden -mt-1 opacity-90">
                  <svg className="w-full h-3 text-[#fafaf8]" viewBox="0 0 220 10" preserveAspectRatio="none" fill="currentColor">
                    <path d="M0,0 L5,10 L10,0 L15,10 L20,0 L25,10 L30,0 L35,10 L40,0 L45,10 L50,0 L55,10 L60,0 L65,10 L70,0 L75,10 L80,0 L85,10 L90,0 L95,10 L100,0 L105,10 L110,0 L115,10 L120,0 L125,10 L130,0 L135,10 L140,0 L145,10 L150,0 L155,10 L160,0 L165,10 L170,0 L175,10 L180,0 L185,10 L190,0 L195,10 L200,0 L205,10 L210,0 L215,10 L220,0 Z" />
                  </svg>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Heading & Action Buttons (Only shown when hideActions is false AND statusHeading is provided) */}
      {!hideActions && Boolean(statusHeading) && (
        <div className="flex flex-col items-center justify-center gap-2 font-sans text-center mt-3 relative z-20">
          <h3 className="text-base font-extrabold text-white tracking-tight">{statusHeading}</h3>
          {statusSubtext && <p className="text-[11px] text-[#8991a6] -mt-1">{statusSubtext}</p>}

          <div className="flex items-center gap-2 mt-1">
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => triggerPrint()}
              disabled={isPrinting}
              className="btn min-h-9 bg-[#facc15] hover:bg-[#fbbf24] text-[#05070f] text-xs font-extrabold py-1.5 px-4 rounded-md shadow-[0_0_12px_rgba(250,204,21,0.2)] flex items-center gap-1.5 cursor-pointer transition active:scale-[0.97] disabled:opacity-60"
            >
              <Printer size={13} /> {isPrinting ? "Printing..." : isPrinted ? "Re-Print Receipt" : "Print Receipt"}
            </button>
            {isPrinted && !isPrinting && (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => triggerTear("right")}
                className="btn min-h-9 bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold py-1.5 px-3 rounded-md border border-white/10 flex items-center gap-1.5 cursor-pointer transition active:scale-[0.97]"
              >
                Tear Receipt
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
