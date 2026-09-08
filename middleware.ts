// Patch ESM path/Node.js global references for Edge runtime bundling compatibility
const globalRecord = globalThis as Record<string, unknown>;
if (typeof globalRecord.__dirname === "undefined") {
  globalRecord.__dirname = "/";
}
if (typeof globalRecord.__filename === "undefined") {
  globalRecord.__filename = "/";
}

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname !== "/auth/callback") {
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.search = request.nextUrl.search;
    return NextResponse.redirect(callbackUrl);
  }

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/dashboard");

  // Sync Supabase session and automatically purge any dead/invalid refresh tokens
  const { response, user } = await updateSession(request);

  // If accessing a protected route without a valid session, redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    // Forward Set-Cookie headers (such as purged cookies) to the redirect response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        redirectResponse.headers.append(key, value);
      }
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
