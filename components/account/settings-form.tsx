"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserRound, Mail, ShieldCheck, Loader2, Check } from "lucide-react";
import { saveAccountSettings } from "@/app/dashboard/settings/actions";

interface SettingsFormProps {
  initialDisplayName: string;
  initialWhatsapp: string;
  userEmail: string;
  role: string;
}

export function SettingsForm({
  initialDisplayName,
  initialWhatsapp,
  userEmail,
  role,
}: SettingsFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await saveAccountSettings({ displayName, whatsapp });
      if (!res.success) {
        toast.error(res.error || "Failed to update settings");
        return;
      }

      toast.success(res.message || "Account settings saved successfully!");

      if (res.whatsapp !== undefined) {
        setWhatsapp(res.whatsapp || "");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("profile-updated", {
            detail: { whatsapp: res.whatsapp, display_name: res.displayName },
          })
        );
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="premium-panel mt-5 space-y-5 rounded-lg p-6 sm:p-8">
      <label className="block text-sm font-bold">
        <span className="flex items-center gap-2 mb-2">
          <UserRound size={16} /> Display name
        </span>
        <input
          name="display_name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={2}
          className="mt-2 min-h-12 w-full rounded-md border border-white/10 bg-black/20 px-4 outline-none focus:border-[#8b5cf6]"
        />
      </label>

      <label className="block text-sm font-bold">
        <span className="flex items-center gap-2 mb-2">
          <Mail size={16} /> Email
        </span>
        <input
          value={userEmail}
          readOnly
          className="mt-2 min-h-12 w-full cursor-not-allowed rounded-md border border-white/[.06] bg-black/10 px-4 text-[#8991a6]"
        />
      </label>

      <label className="block text-sm font-bold">
        <span className="flex items-center justify-between mb-2">
          <span>WhatsApp number</span>
          {whatsapp ? (
            <span className="inline-flex items-center gap-1 text-xs text-[#00d68f] font-extrabold font-mono">
              <Check size={14} className="text-[#00d68f]" /> Linked (+{whatsapp})
            </span>
          ) : (
            <span className="text-xs text-[#8991a6] font-normal">Not linked yet</span>
          )}
        </span>
        <input
          name="whatsapp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          inputMode="tel"
          placeholder="Enter phone number (e.g., 919876543210)"
          className="mt-2 min-h-12 w-full rounded-md border border-white/10 bg-black/20 px-4 outline-none focus:border-[#8b5cf6]"
        />
      </label>

      <div className="flex items-center gap-2 rounded-md bg-[#00d68f]/[.06] p-4 text-xs text-[#9ee8ca]">
        <ShieldCheck size={17} /> Account role: {role}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
          </>
        ) : (
          "Save settings"
        )}
      </button>
    </form>
  );
}
