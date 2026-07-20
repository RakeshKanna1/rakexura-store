import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    if (/tablet|ipad/i.test(ua)) return "Tablet";
    return "Mobile";
  }
  return "Desktop";
}

function parseReferrer(rawReferrer: string | null): string {
  if (!rawReferrer) return "Direct / None";
  if (rawReferrer.includes("wa.me") || rawReferrer.includes("whatsapp")) return "WhatsApp";
  if (rawReferrer.includes("google.")) return "Google Search";
  if (rawReferrer.includes("instagram.")) return "Instagram";
  if (rawReferrer.includes("facebook.")) return "Facebook";
  if (rawReferrer.includes("t.co") || rawReferrer.includes("twitter.com") || rawReferrer.includes("x.com")) return "X / Twitter";
  if (rawReferrer.includes("youtube.")) return "YouTube";
  try {
    const url = new URL(rawReferrer);
    return url.hostname.replace("www.", "");
  } catch {
    return "External Link";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { path, visitorId, referrer } = body;

    if (!path) {
      return NextResponse.json({ error: "Path required" }, { status: 400 });
    }

    // Don't track admin pages or API routes to keep stats clean
    if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/_next")) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const headers = req.headers;
    const userAgent = headers.get("user-agent") || "";
    const rawIp = headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "Unknown";
    const parsedReferrer = parseReferrer(referrer || headers.get("referer"));
    const deviceType = getDeviceType(userAgent);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userName: string | null = null;
    let userEmail: string | null = null;

    if (user) {
      userEmail = user.email || null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      userName = profile?.display_name || user.email?.split("@")[0] || "Customer";
    }

    await supabase.from("visitor_logs").insert({
      visitor_id: visitorId || "guest_" + Math.random().toString(36).substring(2, 9),
      user_id: user?.id || null,
      user_name: userName,
      user_email: userEmail,
      path: path.substring(0, 250),
      referrer: parsedReferrer,
      device_type: deviceType,
      user_agent: userAgent.substring(0, 300),
      ip_address: rawIp,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to track visitor:", err);
    return NextResponse.json({ error: "Tracking error" }, { status: 500 });
  }
}
