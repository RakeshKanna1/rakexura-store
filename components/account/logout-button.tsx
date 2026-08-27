"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cart-store";

export function LogoutButton({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const router = useRouter();
  const resetUserData = useCartStore((state) => state.resetUserData);
  
  async function logout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return toast.error("Could not log out. Please try again.");
    resetUserData();
    window.dispatchEvent(new Event("rakexura-auth-updated"));
    toast.success("You are safely logged out.");
    router.replace("/");
    router.refresh();
  }

  const defaultClasses = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 transition duration-150 cursor-pointer select-none";

  return (
    <button
      type="button"
      onClick={logout}
      className={className || defaultClasses}
    >
      <LogOut size={compact ? 14 : 15} className="shrink-0 text-red-400" />
      <span>Sign Out</span>
    </button>
  );
}
