import { rateLimiter } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const rateLimitKey = "rate-limit:notifications-test-push:" + ip;
  const limitRes = await rateLimiter.limit(rateLimitKey, 5, 60);
  if (!limitRes.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Too many requests. Please try again in a minute.",
          code: "RATE_LIMIT_EXCEEDED"
        }
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limitRes.reset - Math.floor(Date.now() / 1000))) }
      }
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Unauthorized",
            code: "UNAUTHORIZED"
          }
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || "Test Push Notification");
    const message = String(body.message || "Hello from Rakexura Store! Push notifications are working.");
    const url = String(body.url || "/dashboard");

    const result = await sendPushNotification(user.id, title, message, url);
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message,
          code: "INTERNAL_ERROR"
        }
      },
      { status: 500 }
    );
  }
}
