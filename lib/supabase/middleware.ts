import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { response, user: null };

  const allCookies = request.cookies.getAll();
  const authCookies = allCookies.filter(
    (c) => c.name.startsWith("sb-") || c.name.includes("auth-token")
  );

  // Fast path: if no auth cookies present, skip network getUser check
  if (authCookies.length === 0) {
    return { response, user: null };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            maxAge: options?.maxAge ?? 60 * 60 * 24 * 365,
          });
        });
      },
    },
  });

  const purgeAuthCookies = () => {
    authCookies.forEach((c) => {
      response.cookies.set(c.name, "", {
        maxAge: 0,
        path: "/",
        expires: new Date(0),
      });
    });
  };

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      const errMessage = (error.message || "").toLowerCase();
      const isExplicitlyRevoked =
        (error as { code?: string }).code === "refresh_token_not_found" ||
        (errMessage.includes("invalid refresh token") && !errMessage.includes("already used"));

      if (isExplicitlyRevoked) {
        purgeAuthCookies();
      }
      return { response, user: null };
    }

    return { response, user: data?.user ?? null };
  } catch {
    // On network timeout or edge runtime error, never purge valid cookies so user stays logged in
    return { response, user: null };
  }
}
