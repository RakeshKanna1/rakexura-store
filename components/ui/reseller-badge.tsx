import React from "react";
import Image from "next/image";

export function ResellerIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 aspect-[824/732] ${className}`}>
      <Image
        src="/Assets/reseller-badge.png"
        alt="Rakexura Reseller"
        fill
        sizes="120px"
        className="object-contain drop-shadow-[0_2px_8px_rgba(250,204,21,0.3)]"
        priority
      />
    </span>
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
    sm: "px-2 py-0.5 text-[10px] gap-1.5",
    md: "px-2.5 py-1 text-xs gap-2",
    lg: "px-3.5 py-1.5 text-sm gap-2.5",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-black tracking-wide bg-gradient-to-r from-[#facc15]/15 via-[#ffe45c]/25 to-[#f59e0b]/15 text-[#facc15] border border-[#facc15]/50 shadow-[0_0_15px_rgba(250,204,21,0.25)] select-none backdrop-blur-sm ${sizeClasses[size]} ${className}`}
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
