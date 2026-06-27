"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const OWNER_EMAIL = "12k21rakeshkannam@gmail.com";

export async function activateOwnerAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, message: "Sign in with the owner account first." };
  const ownerEmail = (process.env.OWNER_EMAIL ?? process.env.NEXT_PUBLIC_OWNER_EMAIL ?? OWNER_EMAIL).trim().toLowerCase();
  if (user.email.toLowerCase() !== ownerEmail) return { ok: false, message: "This signed-in email is not the configured store owner." };
  const { data, error } = await supabase.rpc("activate_rakexura_owner");
  if (error) return { ok: false, message: `${error.message}. Run the latest Phase 11 Supabase migration, then try again.` };
  if (data !== true) return { ok: false, message: "Admin role was not saved. Run the latest repair migration and try again." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { ok: false, message: "Supabase did not persist the admin role. Run the diagnostic SQL and share the result." };
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true, message: "Admin access activated. Refreshing your control center." };
}
