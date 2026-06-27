import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const gameName = String(body.gameName ?? "").trim();
    const platform = String(body.platform ?? "Steam").trim();
    const customerEmail = String(body.customerEmail ?? "").trim();

    if (gameName.length < 2) {
      return NextResponse.json({ success: false, ok: false, error: "Game name is required" }, { status: 400 });
    }

    const text = [
      "New Rakexura game request",
      "",
      `Game: ${gameName}`,
      `Platform: ${platform}`,
      customerEmail ? `Customer email: ${customerEmail}` : "Customer email: signed-in customer",
    ].join("\n");

    const email = await sendEmail({
      to: process.env.OWNER_EMAIL ?? process.env.NEXT_PUBLIC_OWNER_EMAIL,
      subject: `New game request: ${gameName}`,
      text,
    });

    try {
      const supabase = await createClient();
      const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
      if (admins && admins.length > 0) {
        const adminNotifs = admins.map((admin) => ({
          user_id: admin.id,
          title: "New Game Request",
          message: `Customer requested: "${gameName}" on ${platform}.`,
          type: "request",
          link: `/admin/requests`,
        }));
        await supabase.from("notifications").insert(adminNotifs);
        await Promise.all(
          adminNotifs.map((n) => sendPushNotification(n.user_id, n.title, n.message, n.link))
        );
      }
    } catch (dbError) {
      console.error("Failed to insert admin request notification into Supabase:", dbError);
    }

    return NextResponse.json({ success: true, ok: true, email }, { status: 200 });
  } catch (error) {
    console.error("Error in request notification route:", error);
    return NextResponse.json({ success: true, ok: true, error: error instanceof Error ? error.message : String(error) }, { status: 200 });
  }
}
