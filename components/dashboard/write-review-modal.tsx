"use client";

import { useState, useEffect } from "react";
import { Star, X, Sparkles, ThumbsUp, Smile, Meh, Frown } from "lucide-react";
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
        p_message: comment.trim()
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Thank you! Your review has been submitted for approval.");
      onClose();

      try {
        const submittedRating = rating;
        const submittedComment = comment.trim();

        await fetch("/api/notifications/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            userEmail: user.email,
            gameId,
            gameTitle,
            rating: submittedRating,
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

  const getRatingBadge = (val: number) => {
    switch (val) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#ff4757] bg-[#ff4757]/15 border border-[#ff4757]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <Frown size={11} /> Poor
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#ffa502] bg-[#ffa502]/15 border border-[#ffa502]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <Meh size={11} /> Fair
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#00d68f] bg-[#00d68f]/15 border border-[#00d68f]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <Smile size={11} /> Good
          </span>
        );
      case 4:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#38bdf8] bg-[#38bdf8]/15 border border-[#38bdf8]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <ThumbsUp size={11} /> Very Good
          </span>
        );
      case 5:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#facc15] bg-[#facc15]/15 border border-[#facc15]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(250,204,21,0.2)]">
            <Sparkles size={11} /> Excellent
          </span>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0c0d16] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.95)] sm:p-7 backdrop-blur-2xl"
      >
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -left-20 -top-20 -z-10 h-44 w-44 rounded-full bg-[#8b5cf6]/10 blur-[60px]" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 -z-10 h-44 w-44 rounded-full bg-[#facc15]/8 blur-[65px]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-[#8991a6] hover:border-white/20 hover:bg-white/10 hover:text-white transition-all cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <p className="eyebrow mb-2">Game Feedback</p>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug pr-8">
          Review <span className="text-[#facc15]">{gameTitle}</span>
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[#8991a6]">
          Share your gameplay experience or activation setup. Your review helps the community make informed decisions.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#b9a4ff]">
                Your Rating
              </label>
              {getRatingBadge(hoverRating ?? rating)}
            </div>
            
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/40 p-2.5 shadow-inner">
              {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => {
                const active = value <= (hoverRating ?? rating);
                return (
                  <motion.button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(null)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={`Rate ${value} stars`}
                    className="p-1 focus-visible:outline-none cursor-pointer rounded hover:bg-white/[0.04]"
                  >
                    <Star
                      size={24}
                      className={`transition-all duration-200 ${
                        active 
                          ? "text-[#facc15] filter drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" 
                          : "text-zinc-600 hover:text-zinc-400"
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
            <label htmlFor="review-body" className="block text-xs font-bold uppercase tracking-wider text-[#b9a4ff] mb-1.5">
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
                rows={4}
                placeholder="What did you think of the game? Describe the installation simplicity, game performance, or overall gameplay fun..."
                className="w-full rounded-lg border border-white/10 bg-black/45 p-3.5 text-sm text-white placeholder-[#6b7280] outline-none transition-all duration-300 focus:border-[#facc15]/60 focus:ring-1 focus:ring-[#facc15]/30 focus:bg-black/60 resize-none"
              />
              <div className="mt-1.5 flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                <span className={comment.trim().length >= 10 ? "text-[#00d68f]" : "text-[#8991a6]"}>
                  {comment.trim().length >= 10 ? "✓ Minimum length requirement met" : `Need at least ${10 - comment.trim().length} more characters`}
                </span>
                <span className={`${comment.length >= 1100 ? "text-red-400" : "text-[#8991a6]"}`}>
                  {comment.length} / 1200
                </span>
              </div>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={submitting || comment.trim().length < 10}
            whileHover={submitting || comment.trim().length < 10 ? {} : { scale: 1.01 }}
            whileTap={submitting || comment.trim().length < 10 ? {} : { scale: 0.99 }}
            className={`w-full relative overflow-hidden rounded-lg py-3 px-6 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              comment.trim().length >= 10
                ? "bg-[#facc15] text-black shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:bg-[#ffe45c] cursor-pointer"
                : "bg-white/[0.04] border border-white/10 text-zinc-500 cursor-not-allowed shadow-none"
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Star size={14} className={comment.trim().length >= 10 ? "fill-black text-black" : "text-zinc-600"} />
              {submitting ? "Publishing Review..." : comment.trim().length < 10 ? "Submit Review (Write 10+ Characters)" : "Submit Review"}
            </span>
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
