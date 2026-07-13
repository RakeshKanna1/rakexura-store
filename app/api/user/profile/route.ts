import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const rateLimitKey = `rate-limit:user-profile:${ip}`;
    const limitRes = await rateLimiter.limit(rateLimitKey, 20, 60); // 20 requests per minute
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

    // 1. Direct Purchases count:
    const { count: libraryCount } = await supabase
      .from("customer_library")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    // 2. Viral Referrals count:
    const { count: referralCount } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id);

    const purchasePoints = (libraryCount ?? 0) * 100;
    const referralPoints = (referralCount ?? 0) * 500;
    const totalPoints = Math.min(10000, purchasePoints + referralPoints);

    let level = "Bronze";
    if (totalPoints >= 10000) level = "Platinum";
    else if (totalPoints >= 5000) level = "Diamond";
    else if (totalPoints >= 3000) level = "Gold";
    else if (totalPoints >= 1000) level = "Silver";

    // Upsert into user_rewards table to keep database in sync
    await supabase
      .from("user_rewards")
      .upsert({ user_id: user.id, points: totalPoints, level })
      .select();

    return NextResponse.json(
      {
        success: true,
        data: {
          points: totalPoints,
          level,
          libraryCount: libraryCount ?? 0,
          referralCount: referralCount ?? 0,
          purchasePoints,
          referralPoints,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in profile rewards validation api:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Internal Server Error",
          code: "INTERNAL_ERROR"
        }
      },
      { status: 500 }
    );
  }
}
