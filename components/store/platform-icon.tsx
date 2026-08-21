"use client";

import { WifiOff, Globe, Monitor, Clock } from "lucide-react";

export function PlatformIcon({
  platform,
  className = "h-2.5 w-2.5 shrink-0",
  active = false,
  gameTitle = "",
}: {
  platform: string;
  className?: string;
  active?: boolean;
  gameTitle?: string;
}) {
  const p = platform.toLowerCase();
  const title = (gameTitle || "").toLowerCase();

  if (title.includes("xbox") || p.includes("xbox")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/Assets/xbox-logo-50.png"
        alt="Xbox"
        className={`${className} object-contain`}
        style={{ filter: active ? "brightness(0)" : "invert(1)" }}
      />
    );
  }

  if (title.includes("geforce") || title.includes("nvidia") || p.includes("geforce") || p.includes("nvidia")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/Assets/nvidia-logo-48.png"
        alt="Nvidia GeForce"
        className={`${className} object-contain`}
      />
    );
  }

  if (p.includes("month") || p.includes("year") || p.includes("duration") || p.includes("days")) {
    return <Clock className={className} />;
  }

  if (p.includes("steam")) {
    return (
      <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.03 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c.002.053.006.104.006.158 0 1.808-1.22 3.33-2.884 3.793l-2.49-1.028C7.039 20.916 9.356 22 11.979 22c6.075 0 11.001-4.925 11.001-11S18.054 0 11.979 0zM7.545 15.347l-1.661-.686a2.76 2.76 0 0 0-.246.541l2.128.88a1.764 1.764 0 0 1-.221-.735zm10.395-6.437a2.531 2.531 0 1 1-5.062 0 2.531 2.531 0 0 1 5.062 0z"/>
      </svg>
    );
  }

  if (p.includes("epic")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/Assets/epic-games-logo-32.png"
        alt="Epic Games"
        className={`${className} object-contain`}
        style={{ filter: active ? "brightness(0)" : "brightness(0) invert(1)" }}
      />
    );
  }

  if (p.includes("xbox")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/Assets/xbox-logo-50.png"
        alt="Xbox"
        className={`${className} object-contain`}
        style={{ filter: active ? "brightness(0)" : "invert(1)" }}
      />
    );
  }

  if (p.includes("geforce") || p.includes("nvidia")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/Assets/nvidia-logo-48.png"
        alt="Nvidia GeForce"
        className={`${className} object-contain`}
      />
    );
  }

  if (p.includes("offline")) {
    return <WifiOff className={className} />;
  }

  if (p.includes("online")) {
    return <Globe className={className} />;
  }

  return <Monitor className={className} />;
}
