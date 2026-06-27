"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateAccount(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  if (displayName.length < 2) redirect("/dashboard/settings?error=Enter+a+valid+display+name");
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 15)) redirect("/dashboard/settings?error=Enter+a+valid+WhatsApp+number");
  const { error } = await supabase.from("profiles").update({ display_name: displayName, whatsapp: whatsapp || null }).eq("id", user.id);
  if (error) redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard/settings?message=Account+settings+saved");
}
