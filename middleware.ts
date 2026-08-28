// Patch ESM path/Node.js global references for Edge runtime bundling compatibility
const globalRecord = globalThis as Record<string, unknown>;
if (typeof globalRecord.__dirname === "undefined") {
  globalRecord.__dirname = "/";
}
if (typeof globalRecord.__filename === "undefined") {
  globalRecord.__filename = "/";
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname !== "/auth/callback") {
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.search = request.nextUrl.search;
    return NextResponse.redirect(callbackUrl);
  }

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/account") || pathname.startsWith("/dashboard");

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }
  // Check if any Supabase auth cookie is present
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") || c.name.includes("auth-token")
  );

  // Fast path: If accessing a protected route without any auth cookie, redirect immediately (0ms)
  if (!hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  try {
    // Timeout guard: prevent middleware from hanging more than 3.5s on external auth calls
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error("Supabase auth check timed out")), 3500)
    );

    const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]);

    if (!user || error) {
      const redirectResponse = NextResponse.redirect(
        new URL("/login?next=" + encodeURIComponent(request.nextUrl.pathname), request.url)
      );
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          path: cookie.path,
          domain: cookie.domain,
          maxAge: cookie.maxAge,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          expires: cookie.expires,
          httpOnly: cookie.httpOnly,
        });
      });
      return redirectResponse;
    }
  } catch (error) {
    console.error("Middleware auth check failed or timed out:", error);
    // On timeout or failure, redirect to login cleanly instead of hanging until 504
    const redirectResponse = NextResponse.redirect(
      new URL("/login?next=" + encodeURIComponent(request.nextUrl.pathname), request.url)
    );
    return redirectResponse;
  }

  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
