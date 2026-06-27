"use client";

import Link from "next/link";
import { BadgeCheck, Paperclip, Send, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { OnboardingHint } from "@/components/common/onboarding-hint";
import { createClient } from "@/lib/supabase/client";

export function ReviewForm({ gameId, gameTitle }: { gameId: number; gameTitle: string }) {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function selectMedia(files: FileList | null) {
    const selected = Array.from(files ?? []).slice(0, 2);
    const invalid = selected.find((file) => !/^(image\/(jpeg|png|webp)|video\/mp4)$/.test(file.type) || file.size > 10 * 1024 * 1024);
    if (invalid) return toast.error("Review media must be JPG, PNG, WebP, or MP4 under 10 MB");
    setMedia(selected);
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); toast.error("Sign in before reviewing a purchase."); return; }
    const uploaded: string[] = [];
    for (const file of media) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from("review-media").upload(path, file, { contentType: file.type, upsert: false });
      if (error) { if (uploaded.length) await supabase.storage.from("review-media").remove(uploaded); setSubmitting(false); toast.error(`Could not upload review media: ${error.message}`); return; }
      uploaded.push(path);
    }
    const { error } = await supabase.rpc("submit_verified_review", { p_game_id: gameId, p_rating: rating, p_message: message.trim(), p_media_urls: uploaded });
    setSubmitting(false);
    if (error) { if (uploaded.length) await supabase.storage.from("review-media").remove(uploaded); return toast.error(error.message); }
    setMessage(""); setMedia([]);
    toast.success("We received your request. Thanks for the review!");

    // Trigger owner push notification (only goes to owner/admin)
    try {
      await fetch("/api/notifications/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle,
          rating,
          comment: message.trim()
        })
      });
    } catch (err) {
      console.error("Failed to trigger review notification:", err);
    }
  }

  return <section className="space-y-3"><OnboardingHint id="first-review" title="Reviews are linked to real purchases">You can review a game after it appears in My Library. Submissions are moderated before publication.</OnboardingHint><div className="premium-panel rounded-md p-6"><div className="flex items-start gap-3"><BadgeCheck className="mt-1 shrink-0 text-[#00d68f]" /><div><p className="eyebrow">Verified purchase review</p><h2 className="mt-2 text-xl font-black">Review {gameTitle}</h2><p className="mt-2 text-sm leading-6 text-[#8991a6]">Available after delivery. Reviews and optional media are moderated before publication.</p></div></div><form onSubmit={submitReview} className="mt-6 space-y-4"><fieldset><legend className="mb-2 text-xs font-bold text-[#aeb5c8]">Your rating</legend><div className="flex gap-2">{Array.from({ length: 5 }, (_, index) => index + 1).map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} stars`} className="rounded p-1 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#facc15]"><Star size={22} className={value <= rating ? "text-[#ffb800]" : "text-[#4b5265]"} fill={value <= rating ? "currentColor" : "none"} /></button>)}</div></fieldset><textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} maxLength={1200} required rows={4} placeholder="Share your delivery and game experience" className="w-full resize-y rounded-md border border-white/10 bg-black/25 p-4 text-sm outline-none transition focus:border-[#facc15]/60" /><label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-dashed border-white/10 bg-black/15 px-4 text-sm transition hover:border-white/25"><Paperclip size={17} className="text-[#facc15]" /><span><b className="block">{media.length ? `${media.length} file${media.length > 1 ? "s" : ""} selected` : "Add optional proof media"}</b><small className="text-[#8991a6]">Up to 2 images or MP4 files, 10 MB each</small></span><input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4" className="sr-only" onChange={(event) => selectMedia(event.target.files)} /></label><div className="flex flex-wrap items-center justify-between gap-3"><Link href="/login" className="text-xs text-[#8991a6] hover:text-white">Need to sign in?</Link><button type="submit" disabled={submitting || message.trim().length < 10} className="btn btn-primary gap-2 disabled:cursor-not-allowed disabled:opacity-50"><Send size={15} /> {submitting ? "Submitting..." : "Submit review"}</button></div></form></div></section>;
}
