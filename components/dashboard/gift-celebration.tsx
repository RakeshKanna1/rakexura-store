"use client";

import { useEffect, useState } from "react";
import { Confetti } from "@/components/common/confetti";

export function GiftCelebration() {
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    // Trigger confetti immediately when the component mounts
    setCelebrate(true);
  }, []);

  return <Confetti active={celebrate} onComplete={() => setCelebrate(false)} />;
}
