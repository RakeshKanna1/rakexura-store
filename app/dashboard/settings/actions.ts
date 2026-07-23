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

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").upsert({
    id: user.id,
    email: user.email,
    display_name: displayName,
    whatsapp: whatsapp || null,
    role: "customer",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
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

  const profilePayload = {
    id: user.id,
    email: user.email,
    display_name: cleanName,
    whatsapp: cleanPhone || null,
    role: "customer",
    updated_at: new Date().toISOString(),
  };

  const admin = createAdminClient();
  const { error: upsertErr } = await admin.from("profiles").upsert(profilePayload);
  if (upsertErr) {
    return { success: false, error: upsertErr.message };
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
  const { error: upsertErr } = await admin.from("profiles").upsert(profilePayload);
  if (upsertErr) {
    return { success: false, error: upsertErr.message };
  }

  await supabase.auth.updateUser({ data: { whatsapp: cleanDigits } }).catch(() => null);

  return { success: true, whatsapp: cleanDigits };
}

export async function updateAvatarUrl(avatarUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required." };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").upsert({
    id: user.id,
    email: user.email,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } }).catch(() => null);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true };
}
