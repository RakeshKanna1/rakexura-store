import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const gameTitle = String(body.gameTitle ?? "Game").trim();
    const rating = Number(body.rating ?? 5);
    const comment = String(body.comment ?? "").trim();

    const subject = `New Review Submitted for ${gameTitle}`;
    const textContent = `
      Customer: ${user.email}
      Game: ${gameTitle}
      Rating: ${rating} / 5 stars
      Comment: "${comment}"
    `;

    // 1. Send email to owner
    const adminEmail = process.env.OWNER_EMAIL || "12k21rakeshkannam@gmail.com";
    await sendEmail({
      to: adminEmail,
      subject,
      text: textContent,
    });

    // 2. Notify all admins in-app and via push (only goes to owner/admins)
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

    return NextResponse.json({ success: true, ok: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in review notification route:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
