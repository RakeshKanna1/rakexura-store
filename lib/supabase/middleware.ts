import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
          });
        });
      },
    },
  });
  // Fast path: if no auth cookies present, skip network getUser check
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") || c.name.includes("auth-token")
  );
  if (!hasAuthCookie) return response;

  try {
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error("Supabase auth check timed out")), 3500)
    );
    await Promise.race([authPromise, timeoutPromise]);
  } catch {
    // Ignore auth check error during session refresh in middleware
  }
  return response;
}
