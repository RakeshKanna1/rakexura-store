"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface FlyingItem {
  id: string;
  src: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  endX: number;
  endY: number;
}

export function triggerFlyToCart(
  src: string,
  source: HTMLElement | React.MouseEvent | Element | null
) {
  if (typeof window === "undefined") return;

  let startX = window.innerWidth / 2;
  let startY = window.innerHeight / 2;
  let startWidth = 80;
  let startHeight = 100;

  if (source) {
    let targetEl: Element | null = null;
    if ("currentTarget" in source && source.currentTarget instanceof Element) {
      targetEl = source.currentTarget;
    } else if (source instanceof Element) {
      targetEl = source;
    }

    if (targetEl) {
      const cardEl = targetEl.closest("article, .spotlight-card, [data-fly-source]") || targetEl;
      const rect = cardEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
        startWidth = Math.min(rect.width, 140);
        startHeight = Math.min(rect.height, 160);
      }
    }
  }

  // Find header cart button in top navbar
  const cartBtn = document.querySelector('[aria-label^="Open cart"]') || document.querySelector('.btn-secondary[aria-label*="cart"]');
  let endX = window.innerWidth - 80;
  let endY = 30;

  if (cartBtn) {
    const cartRect = cartBtn.getBoundingClientRect();
    endX = cartRect.left + cartRect.width / 2;
    endY = cartRect.top + cartRect.height / 2;
  }

  const id = `${Date.now()}-${Math.random()}`;

  window.dispatchEvent(
    new CustomEvent("trigger-fly-to-cart", {
      detail: {
        id,
        src,
        startX,
        startY,
        startWidth,
        startHeight,
        endX,
        endY,
      },
    })
  );
}

export function FlyToCartAnimator() {
  const [items, setItems] = useState<FlyingItem[]>([]);

  useEffect(() => {
    const handleFly = (e: Event) => {
      const detail = (e as CustomEvent).detail as FlyingItem;
      if (!detail) return;

      setItems((prev) => [...prev, detail]);

      // Trigger cart icon pulse animation after flight completes (~650ms)
      setTimeout(() => {
        const cartBtn = document.querySelector('[aria-label^="Open cart"]');
        if (cartBtn) {
          cartBtn.classList.add("scale-125", "ring-4", "ring-[#facc15]/60", "transition-all", "duration-200");
          setTimeout(() => {
            cartBtn.classList.remove("scale-125", "ring-4", "ring-[#facc15]/60");
          }, 300);
        }
      }, 600);

      // Clean up item after animation ends (750ms)
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== detail.id));
      }, 750);
    };

    window.addEventListener("trigger-fly-to-cart", handleFly);
    return () => window.removeEventListener("trigger-fly-to-cart", handleFly);
  }, []);

  if (!items.length) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden">
      {items.map((item) => {
        const deltaX = item.endX - item.startX;
        const deltaY = item.endY - item.startY;

        return (
          <div
            key={item.id}
            className="absolute rounded-lg border-2 border-[#facc15] shadow-[0_0_25px_rgba(250,204,21,0.7)] bg-[#08090c] overflow-hidden"
            style={{
              width: `${item.startWidth}px`,
              height: `${item.startHeight}px`,
              left: `${item.startX - item.startWidth / 2}px`,
              top: `${item.startY - item.startHeight / 2}px`,
              animation: `flyToCartKeyframes 0.65s cubic-bezier(0.18, 0.89, 0.32, 1.15) forwards`,
              transformOrigin: "center center",
              "--delta-x": `${deltaX}px`,
              "--delta-y": `${deltaY}px`,
            } as React.CSSProperties}
          >
            <Image
              src={item.src}
              alt="Flying Game"
              fill
              className="object-cover"
              sizes="140px"
              unoptimized
            />
          </div>
        );
      })}

      <style jsx global>{`
        @keyframes flyToCartKeyframes {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          40% {
            transform: translate(calc(var(--delta-x) * 0.35), calc(var(--delta-y) * 0.25 - 60px)) scale(0.75) rotate(-12deg);
            opacity: 0.95;
          }
          100% {
            transform: translate(var(--delta-x), var(--delta-y)) scale(0.12) rotate(25deg);
            opacity: 0.1;
          }
        }
      `}</style>
    </div>
  );
}
