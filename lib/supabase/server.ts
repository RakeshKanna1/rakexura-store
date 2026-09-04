import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cache } from "react";

export const createClient = cache(async () => {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items) => {
          try {
            items.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
              });
            });
          } catch {
            // Server Components cannot write cookies; middleware refreshes sessions.
          }
        },
      },
    },
  );
});

export const getAuthenticatedUser = cache(async () => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data) return null;
    return data.user ?? null;
  } catch {
    return null;
  }
});

export const getCurrentUserProfile = cache(async () => {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return profile;
});

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createSupabaseJsClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
