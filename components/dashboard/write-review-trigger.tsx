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
        className="group/rev inline-flex items-center justify-center gap-1.5 rounded-md border border-[#facc15]/30 bg-[#facc15]/[0.07] hover:bg-[#facc15]/15 hover:border-[#facc15]/60 px-2.5 py-1 text-[11px] font-extrabold text-[#fde047] hover:text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_12px_rgba(250,204,21,0.22)] active:scale-95 cursor-pointer shrink-0"
        title="Leave a verified review for this game"
      >
        <Star size={11} className="text-[#facc15] fill-[#facc15] shrink-0 transition-transform duration-200 group-hover/rev:scale-115 group-hover/rev:rotate-12" />
        <span className="tracking-wide">Write Review</span>
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
