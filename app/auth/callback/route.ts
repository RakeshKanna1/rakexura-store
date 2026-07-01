import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requested = url.searchParams.get("next");
  const next = requested?.startsWith("/") ? requested : null;
  
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=The+email+link+is+invalid+or+expired", request.url));
  }
  
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
  }
  
  const cookieStore = await cookies();
  const allCookies = await cookieStore.getAll();
  
  const handleRedirect = async (destination: string) => {
    const response = NextResponse.redirect(new URL(destination, request.url));
    allCookies.forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
        sameSite: "lax",
        secure: true,
      });
    });
    return response;
  };

  if (next) {
    return handleRedirect(next);
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user 
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() 
    : { data: null };
    
  return handleRedirect(profile?.role === "admin" ? "/admin" : "/dashboard");
}
