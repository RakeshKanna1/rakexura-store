"use client";

import Image from "next/image";
import { ImageUp, Loader2 } from "lucide-react";
import { DragEvent, useState, useEffect } from "react";
import { toast } from "sonner";
import { cropAndCompressImage } from "@/lib/image-compression";
import { createClient } from "@/lib/supabase/client";

export function ImageUploader({ name, label, initial, type }: { name: string; label: string; initial?: string | null; type: "cover" | "banner" }) {
  const [value, setValue] = useState(initial ?? "");
  const [uploading, setUploading] = useState(false);
  const dimensions = type === "cover" ? [600, 800] as const : [1600, 900] as const;

  // Ensure existing image strings are assigned directly to the editing state fields
  useEffect(() => {
    setValue(initial || (type === "cover" ? "/Assets/Featured/game.webp" : "/Assets/Banners/game.webp"));
  }, [initial, type]);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in as admin before uploading.");
      const blob = await cropAndCompressImage(file, dimensions[0], dimensions[1]);
      const path = `games/${user.id}/${Date.now()}-${type}.webp`;
      const { error } = await supabase.storage.from("game-images").upload(path, blob, { contentType: "image/webp", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("game-images").getPublicUrl(path);
      setValue(data.publicUrl);
      toast.success(`${label} uploaded and optimized`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); }
    finally { setUploading(false); }
  }
  function drop(event: DragEvent<HTMLLabelElement>) { event.preventDefault(); void upload(event.dataTransfer.files[0]); }
  return <div className={type === "banner" ? "md:col-span-2" : ""}><label className="text-sm font-bold">{label}<input name={name} value={value} onChange={(event) => setValue(event.target.value)} placeholder={type === "cover" ? "/Assets/Featured/game.webp" : "/Assets/Banners/game.webp"} className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-[#facc15]" /></label><label onDragOver={(event) => event.preventDefault()} onDrop={drop} className={`mt-3 flex cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-white/15 bg-black/20 transition hover:border-[#facc15]/50 ${type === "cover" ? "aspect-[3/4] max-w-[230px]" : "aspect-video w-full"}`}>{value ? <span className="relative block h-full w-full"><img src={value} alt={`${label} preview`} className="object-cover w-full h-full rounded-lg" /><span className="absolute inset-x-2 bottom-2 rounded bg-black/75 px-3 py-2 text-center text-xs">Replace image</span></span> : <span className="flex flex-col items-center gap-2 p-5 text-center text-xs text-[#8f96a8]">{uploading ? <Loader2 className="animate-spin text-[#facc15]" /> : <ImageUp className="text-[#facc15]" />}Drop or choose image<small>{dimensions[0]} × {dimensions[1]} WebP output</small></span>}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])} /></label></div>;
}
