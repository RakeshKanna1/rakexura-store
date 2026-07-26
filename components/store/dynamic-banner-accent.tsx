"use client";

import { useEffect } from "react";

export function DynamicBannerAccent({ src }: { src?: string | null }) {
  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = src;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = 64;
        canvas.height = 64;

        ctx.drawImage(img, 0, 0, 64, 64);
        const imageData = ctx.getImageData(0, 0, 64, 64).data;

        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < imageData.length; i += 16) {
          const red = imageData[i];
          const green = imageData[i + 1];
          const blue = imageData[i + 2];
          const alpha = imageData[i + 3];

          if (alpha < 128) continue;

          // Skip near-black and near-white pixels
          const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
          if (brightness < 30 || brightness > 225) continue;

          // Prefer saturated colors
          const max = Math.max(red, green, blue);
          const min = Math.min(red, green, blue);
          const saturation = max === 0 ? 0 : (max - min) / max;

          if (saturation > 0.15) {
            r += red;
            g += green;
            b += blue;
            count++;
          }
        }

        if (count > 0) {
          const avgR = Math.round(r / count);
          const avgG = Math.round(g / count);
          const avgB = Math.round(b / count);

          const hexColor = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1)}`;

          document.documentElement.style.setProperty("--game-accent", hexColor);
          document.documentElement.style.setProperty("--game-accent-rgb", `${avgR}, ${avgG}, ${avgB}`);
        }
      } catch {
        // Fallback silently if CORS blocks canvas sampling
      }
    };
  }, [src]);

  return null;
}
