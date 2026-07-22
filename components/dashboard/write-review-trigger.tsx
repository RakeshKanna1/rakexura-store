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
        className="group/rev inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-lg border border-[#8b5cf6]/35 bg-[#8b5cf6]/10 text-[#d8b4fe] hover:bg-[#8b5cf6]/25 hover:border-[#b9a4ff]/60 hover:text-white hover:shadow-[0_0_16px_rgba(139,92,246,0.3)] active:scale-95 transition-all duration-300 cursor-pointer"
      >
        <Star size={13} className="text-[#facc15] fill-[#facc15]/20 group-hover/rev:rotate-12 transition-transform duration-300" />
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
