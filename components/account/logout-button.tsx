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
  return <button type="button" onClick={logout} className={className || "btn btn-secondary w-full"}><LogOut size={compact ? 16 : 18} /> Logout</button>;
}
