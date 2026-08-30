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

  // Fast path: Pass through to Server Component layout which performs full secure session & role checks
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };

