import { rateLimiter } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const rateLimitKey = "rate-limit:notifications-new-user:" + ip;
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, display_name, role, notified_owner_signup")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Profile not found",
            code: "NOT_FOUND"
          }
        },
        { status: 404 }
      );
    }

    // Only notify if they haven't been notified yet and they are a customer
    if (profile.role === "customer" && !profile.notified_owner_signup) {
      const subject = `New Customer Registered: ${profile.display_name || user.email}`;
      const textContent = `
        A new customer has signed up/logged in for the first time!

        Name: ${profile.display_name || "Unknown"}
        Email: ${user.email}
        User ID: ${user.id}
      `;

      // 1. Send email to owner with clean admin-focused HTML
      const adminEmail = process.env.OWNER_EMAIL || "12k21rakeshkannam@gmail.com";
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app";
      const adminHtml = `
        <!DOCTYPE html>
        <html>
          <body style="margin:0;padding:24px;background-color:#07050e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e4e4e7;">
            <div style="max-width:560px;margin:0 auto;background-color:#0e0a1f;border:1px solid rgba(139,92,246,0.3);border-radius:16px;padding:32px;box-shadow:0 20px 50px rgba(0,0,0,0.8);">
              <div style="text-align:center;margin-bottom:24px;">
                <span style="display:inline-block;padding:5px 14px;background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);border-radius:20px;font-size:10px;font-weight:900;color:#c4b5fd;letter-spacing:2px;text-transform:uppercase;">
                  👤 STORE ALERT
                </span>
                <h1 style="margin:12px 0 4px;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">
                  NEW CUSTOMER REGISTERED
                </h1>
                <p style="margin:0;font-size:12px;color:#8991a6;font-weight:600;">A new user created an account on Rakexura Store</p>
              </div>

              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 0;font-size:12px;color:#8991a6;font-weight:700;">Customer Name</td>
                  <td align="right" style="padding:8px 0;font-size:13px;color:#ffffff;font-weight:800;">${profile.display_name || "New Customer"}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:12px;color:#8991a6;font-weight:700;">Email Address</td>
                  <td align="right" style="padding:8px 0;font-size:13px;color:#c4b5fd;font-weight:800;">
                    <a href="mailto:${user.email}" style="color:#c4b5fd;text-decoration:none;">${user.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:12px;color:#8991a6;font-weight:700;">User ID</td>
                  <td align="right" style="padding:8px 0;font-size:11px;color:#8991a6;font-family:monospace;">${user.id}</td>
                </tr>
              </table>

              <div style="text-align:center;">
                <a href="${siteUrl}/admin" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:900;font-size:12px;letter-spacing:0.5px;">
                  🚀 Open Admin Dashboard &rarr;
                </a>
              </div>
            </div>
          </body>
        </html>
      `;

      await sendEmail({
        to: adminEmail,
        subject,
        text: textContent,
        html: adminHtml,
      });

      // 2. Notify all admins in-app and via push
      try {
        const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
        if (admins && admins.length > 0) {
          const adminNotifs = admins.map((admin) => ({
            user_id: admin.id,
            title: "New User Registered",
            message: `New customer: ${profile.display_name || user.email} signed up!`,
            type: "signup",
            link: "/admin",
          }));
          await supabase.from("notifications").insert(adminNotifs);
          await Promise.all(
            adminNotifs.map((n) => sendPushNotification(n.user_id, n.title, n.message, n.link))
          );
        }
      } catch (dbError) {
        console.error("Failed to insert admin signup notification:", dbError);
      }

      // 3. Mark as notified in database
      await supabase
        .from("profiles")
        .update({ notified_owner_signup: true })
        .eq("id", user.id);
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
    console.error("Error in new-user notification route:", error);
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
