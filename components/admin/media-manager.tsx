"use client";

import { Copy, ImageUp, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cropAndCompressImage } from "@/lib/image-compression";
import { createClient } from "@/lib/supabase/client";
import { ProofForm } from "./proof-form";

type MediaItem = { name: string; url: string };

export function MediaManager() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [working, setWorking] = useState(false);
  async function load() {
    const supabase = createClient();
    const { data } = await supabase.storage.from("game-images").list("library", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    setItems((data ?? []).filter((item) => item.name && !item.name.endsWith("/")).map((item) => ({ name: item.name, url: supabase.storage.from("game-images").getPublicUrl(`library/${item.name}`).data.publicUrl })));
  }
  useEffect(() => { void load(); }, []);
  async function upload(file?: File) {
    if (!file) return;
    setWorking(true);
    try {
      const blob = await cropAndCompressImage(file, 1600, 900);
      const name = `${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, "-").replace(/\.[^.]+$/, "")}.webp`;
      const { error } = await createClient().storage.from("game-images").upload(`library/${name}`, blob, { contentType: "image/webp" });
      if (error) throw error;
      toast.success("Media uploaded and compressed"); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); }
    finally { setWorking(false); }
  }
  async function remove(name: string) {
    const { error } = await createClient().storage.from("game-images").remove([`library/${name}`]);
    if (error) return toast.error(error.message);
    toast.success("Media deleted"); await load();
  }
  return <><ProofForm /><section className="premium-panel mt-8 rounded-md p-5 md:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Storage library</p><h2 className="mt-2 text-2xl font-black">Upload and reuse media</h2><p className="mt-2 text-sm text-[#8991a6]">Uploads are center-cropped to 16:9, compressed to WebP, and stored in Supabase.</p></div><label className="btn btn-primary cursor-pointer">{working ? <Loader2 className="animate-spin" /> : <ImageUp size={17} />} Upload image<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={working} onChange={(event) => void upload(event.target.files?.[0])} /></label></div><div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{items.map((item) => <article key={item.name} className="overflow-hidden rounded border border-white/[.08] bg-black/20"><div className="relative aspect-video"><Image src={item.url} alt="" fill unoptimized className="object-cover" /></div><div className="flex items-center gap-2 p-2"><button type="button" onClick={() => { void navigator.clipboard.writeText(item.url); toast.success("Public URL copied"); }} className="btn btn-secondary min-h-9 flex-1 px-2 text-xs"><Copy size={14} /> Copy URL</button><button type="button" onClick={() => void remove(item.name)} className="grid h-9 w-9 place-items-center rounded border border-red-400/20 text-red-300" aria-label="Delete media"><Trash2 size={14} /></button></div></article>)}{!items.length && <p className="col-span-full rounded border border-white/[.08] p-8 text-center text-sm text-[#8991a6]">No reusable media uploaded yet.</p>}</div></section></>;
}
