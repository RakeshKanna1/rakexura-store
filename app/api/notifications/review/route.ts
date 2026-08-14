import { NextResponse } from "next/server";
import { sendEmail, buildAdminAlertEmailHtml } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";
import { rateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const rateLimitKey = `rate-limit:notify-review:${ip}`;
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
    const gameTitle = String(body.gameTitle ?? "Game").trim();
    const rating = Number(body.rating ?? 5);
    const comment = String(body.comment ?? "").trim();

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app").replace(/\/$/, "");
    const subject = `New Review Submitted for ${gameTitle}`;
    const textContent = `
      Customer: ${user.email}
      Game: ${gameTitle}
      Rating: ${rating} / 5 stars
      Comment: "${comment}"
    `;

    const htmlContent = buildAdminAlertEmailHtml({
      badgeText: "REVIEW ALERT",
      title: "NEW REVIEW SUBMITTED",
      subtitle: `A customer submitted a review for ${gameTitle}`,
      fields: [
        { label: "Game Title", value: gameTitle },
        { label: "Rating", value: "★".repeat(Math.max(1, Math.min(5, rating))) + ` (${rating}/5)` },
        {
          label: "Customer",
          value: user.email || "Customer",
          isLink: Boolean(user.email),
          linkHref: user.email ? `mailto:${user.email}` : undefined,
        },
        { label: "Comment", value: comment ? `"${comment}"` : "No written comment" },
        {
          label: "Submitted At",
          value: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
      actionButton: {
        label: "Moderate Reviews",
        url: `${siteUrl}/admin/reviews`,
      },
      footerNote: "Automated Admin Alert • Internal Confidential",
    });

    // 1. Send email to owner
    const adminEmail = process.env.OWNER_EMAIL || "12k21rakeshkannam@gmail.com";
    await sendEmail({
      to: adminEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    // 2. Notify all admins in-app and via push
    try {
      const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
      if (admins && admins.length > 0) {
        const adminNotifs = admins.map((admin) => ({
          user_id: admin.id,
          title: "New Review Submitted",
          message: `New review for ${gameTitle} (${rating}★): "${comment.substring(0, 60)}${comment.length > 60 ? "..." : ""}"`,
          type: "review",
          link: "/admin/reviews",
        }));
        await supabase.from("notifications").insert(adminNotifs);
        await Promise.all(
          adminNotifs.map((n) => sendPushNotification(n.user_id, n.title, n.message, n.link))
        );
      }
    } catch (dbError) {
      console.error("Failed to insert admin review notification into Supabase:", dbError);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ok: true
        }
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in review notification route:", error);
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
