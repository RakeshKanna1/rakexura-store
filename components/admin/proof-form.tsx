"use client";

import { ImageUp, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cropAndCompressImage } from "@/lib/image-compression";
import { createClient } from "@/lib/supabase/client";

export function ProofForm() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [type, setType] = useState("whatsapp");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit() {
    if (!file) return toast.error("Choose a customer proof image");
    setBusy(true);
    try {
      const supabase = createClient();
      const blob = await cropAndCompressImage(file, 900, 1200);
      const path = `proofs/${Date.now()}-${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage.from("game-images").upload(path, blob, { contentType: "image/webp" });
      if (uploadError) throw uploadError;
      const imageUrl = supabase.storage.from("game-images").getPublicUrl(path).data.publicUrl;
      const { error } = await supabase.from("customer_proofs").insert({ image_url: imageUrl, caption: caption.trim() || null, proof_type: type, approved: true });
      if (error) { await supabase.storage.from("game-images").remove([path]); throw error; }
      setFile(null); setCaption("");
      toast.success("Customer proof published");
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not publish proof"); }
    finally { setBusy(false); }
  }

  return <section className="premium-panel mt-8 rounded-md p-5 md:p-7"><p className="eyebrow">Homepage trust marquee</p><h2 className="mt-2 text-2xl font-black">Publish customer proof</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#8991a6]">Remove phone numbers, payment IDs, and other private details before uploading. Published images appear in the homepage proof rail.</p><div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px]"><label className="text-sm font-bold">Caption<input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Game delivered successfully" className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 outline-none focus:border-[#8b5cf6]" /></label><label className="text-sm font-bold">Proof type<select value={type} onChange={(event) => setType(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#090c14] px-3"><option value="whatsapp">WhatsApp</option><option value="payment">Payment</option><option value="testimonial">Testimonial</option></select></label></div><div className="mt-4 flex flex-wrap items-center gap-3"><label className="btn btn-secondary cursor-pointer"><ImageUp size={17} /> {file?.name || "Choose proof image"}<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><button type="button" onClick={() => void submit()} disabled={busy} className="btn btn-primary">{busy && <LoaderCircle size={17} className="animate-spin" />} Publish proof</button></div></section>;
}
