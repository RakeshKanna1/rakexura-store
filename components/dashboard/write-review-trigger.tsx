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
        className="group/rev inline-flex items-center justify-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-bold text-[#c4b5fd] hover:bg-[#8b5cf6] hover:border-[#8b5cf6] hover:text-white transition-all cursor-pointer shrink-0"
      >
        <Star size={11} className="text-[#facc15] fill-[#facc15] group-hover/rev:text-white group-hover/rev:fill-white transition-colors duration-200" />
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
