import React from "react";
import Image from "next/image";

export function ResellerIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 aspect-[824/732] ${className}`}>
      <Image
        src="/Assets/reseller-badge.png"
        alt="Rakexura Reseller"
        fill
        sizes="80px"
        className="object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
        priority
      />
    </span>
  );
}

export function ResellerBadge({
  size = "md",
  discount,
  showLabel = true,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  discount?: number | string | null;
  showLabel?: boolean;
  className?: string;
}) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1.5",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const label = discount && Number(discount) > 0 ? `Reseller (${discount}% OFF)` : "Verified Reseller";

  return (
    <span
      className={`inline-flex items-center rounded-md font-bold tracking-wide bg-gradient-to-b from-[#1a1722] to-[#0f0c18] border border-[#e0ce9a]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_6px_rgba(0,0,0,0.3)] select-none ${sizeClasses[size]} ${className}`}
      title={`Verified Rakexura Reseller${discount ? ` - ${discount}% Wholesale Rate` : ""}`}
    >
      <ResellerIcon className={`${iconSizes[size]} shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]`} />
      {showLabel && (
        <span className="bg-gradient-to-r from-[#fff5d6] via-[#e8d59e] to-[#d6bd78] bg-clip-text text-transparent font-bold tracking-tight">
          {label}
        </span>
      )}
    </span>
  );
}
