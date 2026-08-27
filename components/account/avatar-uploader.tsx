"use client";

import Image from "next/image";
import { Camera, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cropAndCompressImage } from "@/lib/image-compression";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrl } from "@/app/dashboard/settings/actions";

export function AvatarUploader({
  userId,
  name,
  avatarUrl,
  centered = false,
}: {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  centered?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl ?? "");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose a JPG, PNG, WebP, or AVIF image");
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
      toast.success("Profile picture updated successfully!");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your profile picture");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  if (centered) {
    return (
      <div className="flex flex-col items-center text-center">
        {/* Modern Interactive Avatar with Docked Corner Badge */}
        <div className="relative group cursor-pointer" onClick={() => input.current?.click()}>
          {/* Subtle Ambient Halo */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#8b5cf6]/50 via-[#a78bfa]/20 to-[#00df81]/30 blur-sm opacity-60 group-hover:opacity-100 transition duration-300 pointer-events-none" />
          
          <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white/20 bg-[#08090d] shadow-2xl transition duration-200 group-hover:border-[#8b5cf6] focus-visible:outline-none">
            <div className="relative h-full w-full overflow-hidden rounded-full">
              {preview ? (
                <Image
                  src={preview}
                  alt={`${name} profile picture`}
                  fill
                  sizes="96px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <span className="grid h-full w-full place-items-center bg-gradient-to-br from-[#8b5cf6]/30 to-[#6d28d9]/30 text-2xl font-black text-white">
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}

              {/* Hover Dark Frosted Overlay */}
              <span className="absolute inset-0 grid place-items-center bg-black/60 opacity-0 transition group-hover:opacity-100 backdrop-blur-[2px]">
                {busy ? (
                  <LoaderCircle className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <div className="flex flex-col items-center text-white">
                    <Camera className="h-5 w-5" />
                    <span className="text-[10px] font-bold mt-0.5">Edit</span>
                  </div>
                )}
              </span>
            </div>
          </div>

          {/* Docked Corner Camera Badge */}
          <div className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-[#8b5cf6] text-white border-2 border-[#0d0f17] shadow-lg transition-transform duration-200 group-hover:scale-110 group-hover:bg-[#7c3aed]">
            {busy ? <LoaderCircle size={13} className="animate-spin" /> : <Camera size={13} />}
          </div>
        </div>

        <input
          ref={input}
          hidden
          type="file"
          accept="image/*,.avif,.webp,.png,.jpg,.jpeg"
          onChange={(event) => void upload(event.target.files?.[0])}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="group relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/[.05]"
        aria-label="Change profile picture"
      >
        {preview ? (
          <Image src={preview} alt={`${name} profile picture`} fill sizes="80px" className="object-cover" unoptimized />
        ) : (
          <span className="text-2xl font-black">{name.slice(0, 1).toUpperCase()}</span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/65 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          {busy ? <LoaderCircle className="animate-spin" /> : <Camera />}
        </span>
      </button>
      <div>
        <strong className="block text-white">Profile picture</strong>
        <p className="mt-1 text-xs leading-5 text-[#8991a6]">Square AVIF, WebP, PNG, or JPG. Compressed automatically.</p>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="mt-2 text-sm font-bold text-[#b9a4ff] hover:text-white"
        >
          {busy ? "Uploading..." : "Choose image"}
        </button>
      </div>
      <input
        ref={input}
        hidden
        type="file"
        accept="image/*,.avif,.webp,.png,.jpg,.jpeg"
        onChange={(event) => void upload(event.target.files?.[0])}
      />
    </div>
  );
}
