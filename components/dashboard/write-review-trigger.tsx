"use client";

import { useState } from "react";
import { WriteReviewModal } from "@/components/dashboard/write-review-modal";
import { AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";

interface WriteReviewTriggerProps {
  gameId: number;
  gameTitle: string;
}

export function WriteReviewTrigger({ gameId, gameTitle }: WriteReviewTriggerProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="group/rev inline-flex items-center justify-center gap-1.5 rounded-md border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 hover:border-[#8b5cf6]/50 px-3 py-1.5 text-xs font-black text-[#c4b5fd] hover:text-white transition-all duration-200 hover:scale-105 cursor-pointer shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.15)]"
      >
        <Star size={12} className="text-[#facc15] fill-[#facc15] shrink-0 transition-transform duration-200 group-hover/rev:scale-110" />
        <span>Write Review</span>
      </button>

      <AnimatePresence>
        {showModal && (
          <WriteReviewModal
            gameId={gameId}
            gameTitle={gameTitle}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
