"use client";

import { WifiOff, Globe, Monitor, Clock, ShieldCheck, Gamepad2 } from "lucide-react";

export function PlatformIcon({
  platform,
  className = "h-3.5 w-3.5 shrink-0",
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

  // Steam
  if (p.includes("steam") || title.includes("steam")) {
    return (
      <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.03 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c.002.053.006.104.006.158 0 1.808-1.22 3.33-2.884 3.793l-2.49-1.028C7.039 20.916 9.356 22 11.979 22c6.075 0 11.001-4.925 11.001-11S18.054 0 11.979 0zM7.545 15.347l-1.661-.686a2.76 2.76 0 0 0-.246.541l2.128.88a1.764 1.764 0 0 1-.221-.735zm10.395-6.437a2.531 2.531 0 1 1-5.062 0 2.531 2.531 0 0 1 5.062 0z"/>
      </svg>
    );
  }

  // Epic Games
  if (p.includes("epic") || title.includes("epic")) {
    return (
      <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.75 1.5C3.75 1.5 1.5 3.375 1.5 5.625v12.75C1.5 20.625 3.75 22.5 3.75 22.5h16.5c0 0 2.25-1.875 2.25-4.125V5.625C22.5 3.375 20.25 1.5 20.25 1.5H3.75zm8.25 4.5h4.5v2.25H12V10.5h3.75v2.25H12V15h4.5v2.25H9.75V6H12z"/>
      </svg>
    );
  }

  // Rockstar Games
  if (p.includes("rockstar") || title.includes("rockstar") || title.includes("gta") || title.includes("rdr")) {
    return (
      <svg className={`${className} fill-current text-[#ffab00]`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    );
  }

  // Ubisoft / Ubisoft Connect
  if (p.includes("ubisoft") || p.includes("uplay") || title.includes("ubisoft") || title.includes("assassin")) {
    return (
      <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    );
  }

  // EA / Electronic Arts / Origin
  if (p.includes("ea") || p.includes("origin") || title.includes("electronic arts") || title.includes("fifa") || title.includes("fc 24") || title.includes("fc 25")) {
    return (
      <svg className={`${className} fill-current text-[#ff4655]`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2V7h2v10z"/>
      </svg>
    );
  }

  // Battle.net / Blizzard
  if (p.includes("battle") || p.includes("blizzard") || title.includes("diablo") || title.includes("call of duty")) {
    return (
      <svg className={`${className} fill-current text-[#00aeff]`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l-8-4v9l8 4 8-4v-9l-8 4z"/>
      </svg>
    );
  }

  // GOG Galaxy
  if (p.includes("gog")) {
    return (
      <svg className={`${className} fill-current text-[#a855f7]`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V11h-2v2h-1v-4h4v7.93z"/>
      </svg>
    );
  }

  // Xbox
  if (p.includes("xbox") || title.includes("xbox")) {
    return (
      <svg className={`${className} fill-current text-[#107c10]`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.192 3.149C6.31 1.258 9.07 0 12.115 0c3.046 0 5.805 1.258 7.923 3.149l-5.63 6.012c-.7-.746-1.503-1.428-2.293-2.023-.79.595-1.593 1.277-2.293 2.023l-5.63-6.012zM.74 7.643c-.47 1.345-.74 2.793-.74 4.307 0 3.73 1.63 7.07 4.22 9.387l5.22-6.527c-.89-.95-1.73-2.02-2.45-3.197L.74 7.643zm22.52 0l-6.25 3.97c-.72 1.177-1.56 2.247-2.45 3.197l5.22 6.527C22.37 19.02 24 15.68 24 11.95c0-1.514-.27-2.962-.74-4.307zM12.115 17.06c1.17 0 2.37-.28 3.52-.82l-3.52-4.4-3.52 4.4c1.15.54 2.35.82 3.52.82z"/>
      </svg>
    );
  }

  // PlayStation
  if (p.includes("playstation") || p.includes("ps5") || p.includes("ps4") || title.includes("playstation")) {
    return (
      <svg className={`${className} fill-current text-[#0070d1]`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.98 2.59v12.28l3.41 1.05V6.75l2.42 1.15v6.52l3.41 1.05V3.88L8.98 2.59zM1.5 16.5c3.27 1.06 6.88.93 10.02-.27l-1.04 2.92C7.79 20.2 4.3 20.17 1.5 19.1v-2.6zm10.74-.29c3.14 1.2 6.75 1.33 10.02.27v2.6c-2.8 1.07-6.29 1.1-8.98.05l-1.04-2.92z"/>
      </svg>
    );
  }

  // Nvidia GeForce Now
  if (title.includes("geforce") || title.includes("nvidia") || p.includes("geforce") || p.includes("nvidia")) {
    return (
      <svg className={`${className} fill-current text-[#76b900]`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c-2.48 0-4.5-2.02-4.5-4.5S10.52 7.5 13 7.5c1.84 0 3.42 1.11 4.11 2.7l-1.89.81C14.86 9.87 14.01 9.3 13 9.3c-1.49 0-2.7 1.21-2.7 2.7s1.21 2.7 2.7 2.7c1.01 0 1.86-.57 2.22-1.71l1.89.81c-.69 1.59-2.27 2.7-4.11 2.7z"/>
      </svg>
    );
  }

  // Duration / Time
  if (p.includes("month") || p.includes("year") || p.includes("duration") || p.includes("days")) {
    return <Clock className={className} />;
  }

  // Offline Key Mode
  if (p.includes("offline")) {
    return <WifiOff className={className} />;
  }

  // Online / Global Key Mode
  if (p.includes("online") || p.includes("global")) {
    return <Globe className={className} />;
  }

  // Default PC
  return <Gamepad2 className={className} />;
}

