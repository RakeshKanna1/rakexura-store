import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/push";
import { rateLimiter } from "@/lib/security/rate-limit";
import { logError } from "@/lib/security/logger";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const rateLimitKey = `rate-limit:request-freebie:${ip}`;
    const limitRes = await rateLimiter.limit(rateLimitKey, 3, 60);
    if (!limitRes.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limitRes.reset - Math.floor(Date.now() / 1000))) } }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile and rewards points
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, role, last_request_date")
      .eq("id", user.id)
      .maybeSingle();

    const { data: reward } = await supabase
      .from("user_rewards")
      .select("points, level")
      .eq("user_id", user.id)
      .maybeSingle();

    const userPoints = reward?.points ?? 0;
    const userRank = reward?.level ?? "Bronze";

    // 1. Gate: Must be Diamond or Platinum (points >= 4000)
    if (userPoints < 4000) {
      return NextResponse.json({ error: "Insufficient rank points." }, { status: 403 });
    }

    // 2. Cooldown Gate: 24 hours check
    if (profile?.last_request_date) {
      const lastRequest = new Date(profile.last_request_date).getTime();
      const diff = Date.now() - lastRequest;
      if (diff < 24 * 60 * 60 * 1000) {
        return NextResponse.json({ error: "A waiting period of 24 hours is active." }, { status: 429 });
      }
    }

    // Update last_request_date in profiles
    const nowStr = new Date().toISOString();
    await supabase
      .from("profiles")
      .update({ last_request_date: nowStr })
      .eq("id", user.id);

    // Insert support ticket for administrative grid tracking
    await supabase.from("support_tickets").insert({
      user_id: user.id,
      subject: `Loyalty Freebie Request - ${userRank}`,
      message: `User ID: ${user.id}\nUsername: ${profile?.display_name || user.email}\nEmail: ${user.email}\nExplicit Rank Status: ${userRank}\nPoints: ${userPoints}\nRequested at: ${nowStr}`,
      status: "open"
    });

    // 3. Send email to Administrator
    const adminEmail = process.env.OWNER_EMAIL || "12k21rakeshkannam@gmail.com";
    const subject = `Loyalty Freebie Request - ${userRank}`;
    const textContent = `
      User ID: ${user.id}
      Username: ${profile?.display_name || user.email}
      Email: ${user.email}
      Explicit Rank Status: ${userRank}
      Points: ${userPoints}
      Requested at: ${nowStr}
    `;
    await sendEmail({
      to: adminEmail,
      subject,
      text: textContent,
    });

    // 4. Push in-app notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Request Pending",
      message: "Checking verification status",
      type: "reward",
      link: "/dashboard/rewards"
    });

    await sendPushNotification(user.id, "Request Pending", "Checking verification status", "/dashboard/rewards");

    // Notify admins of the freebie request (only goes to owner/admins)
    try {
      const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
      if (admins && admins.length > 0) {
        const adminNotifs = admins.map((admin) => ({
          user_id: admin.id,
          title: "New Freebie Request",
          message: `Customer ${profile?.display_name || user.email} requested a loyalty freebie code.`,
          type: "reward",
          link: "/admin/requests",
        }));
        await supabase.from("notifications").insert(adminNotifs);
        await Promise.all(
          adminNotifs.map((n) => sendPushNotification(n.user_id, n.title, n.message, n.link))
        );
      }
    } catch (err) {
      logError({
        category: "internal_error",
        message: "Failed to notify admins of freebie request",
        error: err
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logError({
      category: "internal_error",
      message: "Request freebie API route handler failed",
      error
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
