"use client";

import { useEffect, useState } from "react";

const GLYPHS = "RAKEXU0123456789@#$%-+=_?*[]{}";

export function DecryptedText({ 
  text, 
  speed = 30, 
  delay = 200, 
  className = "" 
}: { 
  text: string; 
  speed?: number; 
  delay?: number; 
  className?: string; }) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let active = true;
    let intervalId: ReturnType<typeof setInterval>;

    const startAnimation = () => {
      let iteration = 0;
      intervalId = setInterval(() => {
        if (!active) return;
        
        const scrambled = text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) {
              return text[index];
            }
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join("");

        setDisplayText(scrambled);

        if (iteration >= text.length) {
          clearInterval(intervalId);
        }
        iteration += 1 / 2.5; // Controls how fast the characters lock into place
      }, speed);
    };

    const timeoutId = setTimeout(startAnimation, delay);

    return () => {
      active = false;
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [text, speed, delay]);

  return <span className={className}>{displayText || text}</span>;
}
