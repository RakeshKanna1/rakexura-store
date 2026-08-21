import React from "react";

export function ResellerIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="goldShield" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="30%" stopColor="#facc15" />
          <stop offset="70%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
        <linearGradient id="goldCore" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#facc15" floodOpacity="0.4" />
        </filter>
      </defs>
      {/* Outer Hexagonal Crest */}
      <path
        d="M12 2L20.5 6.5V13.5C20.5 18 16.5 21.5 12 22.5C7.5 21.5 3.5 18 3.5 13.5V6.5L12 2Z"
        fill="url(#goldShield)"
        stroke="#fef08a"
        strokeWidth="0.75"
        filter="url(#goldGlow)"
      />
      {/* Dark Inner Inset */}
      <path
        d="M12 3.8L18.8 7.4V13.2C18.8 16.8 15.6 19.8 12 20.7C8.4 19.8 5.2 16.8 5.2 13.2V7.4L12 3.8Z"
        fill="#090814"
        stroke="#ca8a04"
        strokeWidth="0.5"
      />
      {/* Radiant Diamond Star Emblem */}
      <path
        d="M12 6.5L13.5 10.5L17.5 12L13.5 13.5L12 17.5L10.5 13.5L6.5 12L10.5 10.5L12 6.5Z"
        fill="url(#goldCore)"
      />
      {/* Center Precision Dot */}
      <circle cx="12" cy="12" r="1.5" fill="#ffffff" />
    </svg>
  );
}

export function ResellerBadge({
  size = "md",
  showLabel = true,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-black tracking-wide bg-gradient-to-r from-[#facc15]/15 via-[#ffe45c]/25 to-[#f59e0b]/15 text-[#facc15] border border-[#facc15]/50 shadow-[0_0_12px_rgba(250,204,21,0.2)] select-none backdrop-blur-sm ${sizeClasses[size]} ${className}`}
      title="Verified Rakexura Wholesale Reseller"
    >
      <ResellerIcon className={`${iconSizes[size]} shrink-0`} />
      {showLabel && (
        <span className="bg-gradient-to-r from-[#fff9db] via-[#facc15] to-[#f59e0b] bg-clip-text text-transparent uppercase tracking-wider font-extrabold">
          Verified Reseller
        </span>
      )}
    </span>
  );
}
