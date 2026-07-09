"use client";

export function ShinyText({ 
  text, 
  speed = 3, 
  type = "gold",
  className = "" 
}: { 
  text: string; 
  speed?: number; 
  type?: "gold" | "gray";
  className?: string; 
}) {
  return (
    <span
      className={`inline-block ${type === "gold" ? "shiny-text-gold" : "shiny-text-gray"} ${className}`}
      style={{ animationDuration: `${speed}s` }}
    >
      {text}
    </span>
  );
}
