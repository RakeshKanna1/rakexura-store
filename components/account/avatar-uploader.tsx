"use client";

import Image from "next/image";
import { Camera, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cropAndCompressImage } from "@/lib/image-compression";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrl } from "@/app/dashboard/settings/actions";

export function AvatarUploader({ userId, name, avatarUrl }: { userId: string; name: string; avatarUrl?: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl ?? "");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose a JPG, PNG, or WebP image");
    setBusy(true);
    try {
      const supabase = createClient();
      const blob = await cropAndCompressImage(file, 512, 512);
      const path = `${userId}/avatar.webp`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/webp", upsert: true, cacheControl: "3600" });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const res = await updateAvatarUrl(url);
      if (!res.success) throw new Error(res.error || "Could not update your profile picture");
      setPreview(url);
      window.dispatchEvent(new CustomEvent("rakexura-profile-updated", { detail: { avatarUrl: url } }));
      toast.success("Profile picture updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your profile picture");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return <div className="flex items-center gap-4"><button type="button" onClick={() => input.current?.click()} disabled={busy} className="group relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/[.05]" aria-label="Change profile picture">{preview ? <Image src={preview} alt={`${name} profile picture`} fill sizes="80px" className="object-cover" unoptimized /> : <span className="text-2xl font-black">{name.slice(0, 1).toUpperCase()}</span>}<span className="absolute inset-0 grid place-items-center bg-black/65 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">{busy ? <LoaderCircle className="animate-spin" /> : <Camera />}</span></button><div><strong className="block">Profile picture</strong><p className="mt-1 text-xs leading-5 text-[#8991a6]">Square JPG, PNG, or WebP. Rakexura compresses it before upload.</p><button type="button" onClick={() => input.current?.click()} disabled={busy} className="mt-2 text-sm font-bold text-[#b9a4ff] hover:text-white">{busy ? "Uploading..." : "Choose image"}</button></div><input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(event.target.files?.[0])} /></div>;
}
