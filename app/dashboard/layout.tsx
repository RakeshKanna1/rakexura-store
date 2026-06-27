import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Subtle brand color gradient glow matching logo signature colors */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.06),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(167,139,250,0.03),transparent_50%)]" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
