"use client";

import { useState } from "react";
import { WriteReviewModal } from "@/components/dashboard/write-review-modal";
import { AnimatePresence } from "framer-motion";

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
        className="border border-[#8b5cf6]/30 bg-[#8b5cf6]/5 hover:bg-[#8b5cf6]/15 hover:border-[#b9a4ff]/40 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-md text-[#b9a4ff] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] hover:shadow-[0_0_12px_rgba(139,92,246,0.15)] active:scale-[0.97] transition-all duration-300 mt-1 cursor-pointer"
      >
        Write a Review
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
