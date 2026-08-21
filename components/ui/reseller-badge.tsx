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
    md: "px-2.5 py-1 text-xs gap-2",
    lg: "px-3.5 py-1.5 text-sm gap-2.5",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  };

  const label = discount && Number(discount) > 0 ? `Reseller (${discount}% OFF)` : "Verified Reseller";

  return (
    <span
      className={`inline-flex items-center rounded-md font-bold tracking-wide bg-[#16171d] text-[#e0ce9a] border border-amber-400/25 select-none ${sizeClasses[size]} ${className}`}
      title={`Verified Rakexura Reseller${discount ? ` - ${discount}% Wholesale Rate` : ""}`}
    >
      <ResellerIcon className={`${iconSizes[size]} shrink-0`} />
      {showLabel && (
        <span className="text-[#e0ce9a] font-bold">
          {label}
        </span>
      )}
    </span>
  );
}
