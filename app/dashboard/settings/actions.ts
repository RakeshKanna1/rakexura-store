"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rateLimiter } from "@/lib/security/rate-limit";

export async function updateAccount(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const rateLimitKey = `rate-limit:update-account:${ip}`;
  const limitRes = await rateLimiter.limit(rateLimitKey, 5, 60);
  if (!limitRes.success) {
    redirect("/dashboard/settings?error=Too+many+update+attempts.+Please+wait+a+minute.");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const displayName = String(formData.get("display_name") ?? "").trim();
  let whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  if (whatsapp.length === 10) {
    whatsapp = `91${whatsapp}`;
  }

  if (displayName.length < 2) redirect("/dashboard/settings?error=Enter+a+valid+display+name");
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 15)) redirect("/dashboard/settings?error=Enter+a+valid+WhatsApp+number");

  const { data: updatedRows, error: updateErr } = await supabase
    .from("profiles")
    .update({ display_name: displayName, whatsapp: whatsapp || null, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id");

  if (updateErr || !updatedRows || updatedRows.length === 0) {
    try {
      const admin = createAdminClient();
      await admin.from("profiles").upsert({
        id: user.id,
        email: user.email,
        display_name: displayName,
        whatsapp: whatsapp || null,
        role: "customer",
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Ignore fallback error if admin key is missing
    }
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  redirect("/dashboard/settings?message=Account+settings+saved");
}

export async function saveAccountSettings({
  displayName,
  whatsapp,
}: {
  displayName: string;
  whatsapp: string;
}) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const rateLimitKey = `rate-limit:update-account:${ip}`;
  const limitRes = await rateLimiter.limit(rateLimitKey, 5, 60);
  if (!limitRes.success) {
    return { success: false, error: "Too many update attempts. Please wait a minute." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required." };

  const cleanName = displayName.trim();
  let cleanPhone = whatsapp.replace(/\D/g, "");
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

  if (cleanName.length < 2) {
    return { success: false, error: "Display name must be at least 2 characters long." };
  }
  if (cleanPhone && (cleanPhone.length < 10 || cleanPhone.length > 15)) {
    return { success: false, error: "WhatsApp number must be 10 to 15 digits." };
  }

  // 1. Try UPDATE first (works under existing RLS policy for logged in user)
  const { data: updatedRows, error: updateErr } = await supabase
    .from("profiles")
    .update({ display_name: cleanName, whatsapp: cleanPhone || null, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id");

  // 2. If row was missing, try admin client upsert
  if (updateErr || !updatedRows || updatedRows.length === 0) {
    try {
      const admin = createAdminClient();
      const profilePayload = {
        id: user.id,
        email: user.email,
        display_name: cleanName,
        whatsapp: cleanPhone || null,
        role: "customer",
        updated_at: new Date().toISOString(),
      };
      await admin.from("profiles").upsert(profilePayload);
    } catch {
      // Ignore fallback error if admin key is missing
    }
  }

  await supabase.auth.updateUser({ data: { whatsapp: cleanPhone || null, full_name: cleanName } }).catch(() => null);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return {
    success: true,
    message: "Account settings saved successfully!",
    whatsapp: cleanPhone,
    displayName: cleanName,
  };
}

export async function saveWhatsAppNumber(phone: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required to link WhatsApp." };

  let cleanDigits = phone.replace(/\D/g, "");
  if (cleanDigits.length === 10) {
    cleanDigits = `91${cleanDigits}`;
  }

  if (cleanDigits.length < 10 || cleanDigits.length > 15) {
    return { success: false, error: "Please enter a valid WhatsApp phone number (10 to 15 digits)." };
  }

  const { data: updatedRows, error: updateErr } = await supabase
    .from("profiles")
    .update({ whatsapp: cleanDigits, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id");

  if (updateErr || !updatedRows || updatedRows.length === 0) {
    try {
      const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Player";
      const profilePayload = {
        id: user.id,
        email: user.email,
        display_name: displayName,
        whatsapp: cleanDigits,
        role: "customer",
        updated_at: new Date().toISOString(),
      };
      const admin = createAdminClient();
      await admin.from("profiles").upsert(profilePayload);
    } catch {
      // Ignore fallback error
    }
  }

  await supabase.auth.updateUser({ data: { whatsapp: cleanDigits } }).catch(() => null);

  return { success: true, whatsapp: cleanDigits };
}

export async function updateAvatarUrl(avatarUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required." };

  const { data: updatedRows, error: updateErr } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id");

  if (updateErr || !updatedRows || updatedRows.length === 0) {
    try {
      const admin = createAdminClient();
      await admin.from("profiles").upsert({
        id: user.id,
        email: user.email,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Ignore fallback error
    }
  }

  await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } }).catch(() => null);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true };
}
