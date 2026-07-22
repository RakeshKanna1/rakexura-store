"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

interface WriteReviewModalProps {
  gameId: number;
  gameTitle: string;
  onClose: () => void;
}

export function WriteReviewModal({ gameId, gameTitle, onClose }: WriteReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      toast.error("Review must be at least 10 characters long.");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to submit a review.");
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.rpc("submit_verified_review", {
        p_game_id: gameId,
        p_rating: rating,
        p_message: comment.trim(),
        p_media_urls: []
      });

      if (error) {
        throw error;
      }

      toast.success("We received your request. Thanks for the review!");
      
      // Reset state variables completely on completion
      const submittedComment = comment.trim();
      setComment("");
      setRating(5);
      setHoverRating(null);
      
      // Dismiss error/pending toasts and close
      toast.dismiss();
      onClose();

      // Trigger owner push notification (only goes to owner/admin)
      try {
        await fetch("/api/notifications/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameTitle,
            rating,
            comment: submittedComment
          })
        });
      } catch (err) {
        console.error("Failed to trigger review notification:", err);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1: return "Terrible 😠";
      case 2: return "Bad 😞";
      case 3: return "Decent 😊";
      case 4: return "Great 😁";
      case 5: return "Excellent! 🤩";
      default: return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#090a12]/98 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.9)] md:p-8 backdrop-blur-2xl"
      >
        {/* Glow Effects */}
        <div className="absolute -left-20 -top-20 -z-10 h-44 w-44 rounded-full bg-[#8b5cf6]/8 blur-[60px]" />
        <div className="absolute -right-20 -bottom-20 -z-10 h-44 w-44 rounded-full bg-[#facc15]/5 blur-[65px]" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-white/5 bg-white/[0.02] p-2 text-zinc-400 hover:border-white/15 hover:bg-white/5 hover:text-white transition-all duration-300 cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <span className="inline-block rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#b9a4ff] mb-3">
          Product Feedback
        </span>

        <h3 className="text-2xl font-black tracking-tight text-white leading-snug">
          Review <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#b9a4ff] to-[#facc15]">{gameTitle}</span>
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-[#8991a6]">
          Share your gameplay experience or activation setup. Your review helps the community make informed decisions.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-black uppercase tracking-widest text-[#8b5cf6]">
                Your Rating
              </label>
              <span className="text-[11px] font-black text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {getRatingLabel(hoverRating ?? rating)}
              </span>
            </div>
            
            <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.04] bg-black/35 p-3.5 shadow-inner">
              {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => {
                const active = value <= (hoverRating ?? rating);
                return (
                  <motion.button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(null)}
                    whileHover={{ scale: 1.2, rotate: 8 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 450, damping: 15 }}
                    aria-label={`Rate ${value} stars`}
                    className="p-1 focus-visible:outline-none cursor-pointer rounded-lg hover:bg-white/[0.03]"
                  >
                    <Star
                      size={28}
                      className={`transition-all duration-200 ${
                        active 
                          ? "text-[#facc15] filter drop-shadow-[0_0_10px_rgba(250,204,21,0.65)]" 
                          : "text-zinc-650 hover:text-zinc-500"
                      }`}
                      fill={active ? "currentColor" : "transparent"}
                      strokeWidth={active ? 1.5 : 2}
                    />
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="review-body" className="block text-xs font-black uppercase tracking-widest text-[#8b5cf6] mb-2">
              Written Review
            </label>
            <div className="relative">
              <textarea
                id="review-body"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                minLength={10}
                maxLength={1200}
                rows={5}
                placeholder="What did you think of the game? Describe the installation simplicity, game performance, or overall gameplay fun..."
                className="w-full rounded-xl border border-white/10 bg-black/45 p-4 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-300 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]/30 focus:bg-black/60"
              />
              <div className="mt-2 flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                <span className={comment.trim().length >= 10 ? "text-[#00d68f]" : "text-zinc-500 animate-pulse"}>
                  {comment.trim().length >= 10 ? "✓ Minimum length requirement met" : `Need at least ${10 - comment.trim().length} more characters`}
                </span>
                <span className={`${comment.length >= 1100 ? "text-red-400" : "text-zinc-500"}`}>
                  {comment.length} / 1200
                </span>
              </div>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={submitting || comment.trim().length < 10}
            whileHover={submitting || comment.trim().length < 10 ? {} : { scale: 1.01, y: -1 }}
            whileTap={submitting || comment.trim().length < 10 ? {} : { scale: 0.99 }}
            className={`w-full relative overflow-hidden rounded-xl py-3.5 px-6 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              comment.trim().length >= 10
                ? "bg-gradient-to-r from-[#8b5cf6] via-[#a78bfa] to-[#facc15] text-black shadow-[0_4px_25px_rgba(139,92,246,0.3)] hover:shadow-[0_8px_30px_rgba(250,204,21,0.45)] cursor-pointer"
                : "bg-white/[0.04] border border-white/10 text-zinc-500 cursor-not-allowed shadow-none"
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Star size={14} className={comment.trim().length >= 10 ? "fill-black text-black" : "text-zinc-600"} />
              {submitting ? "Publishing Review..." : comment.trim().length < 10 ? "Submit Review (Write 10+ Characters)" : "Submit Review for Moderation"}
            </span>
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
