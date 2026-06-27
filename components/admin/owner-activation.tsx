"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { activateOwnerAdmin } from "@/app/admin/owner-actions";

export function OwnerActivation() {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  async function activate() {
    setWorking(true);
    const result = await activateOwnerAdmin();
    setWorking(false);
    if (!result.ok) return toast.error(result.message);
    toast.success(result.message);
    window.dispatchEvent(new Event("rakexura-role-updated"));
    router.replace("/admin");
    router.refresh();
  }
  return <button type="button" onClick={activate} disabled={working} className="btn w-full bg-[#facc15] text-black disabled:opacity-50"><ShieldCheck size={17} />{working ? "Activating..." : "Activate Admin Access"}</button>;
}
