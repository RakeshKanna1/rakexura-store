import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || "Test Push Notification");
    const message = String(body.message || "Hello from Rakexura Store! Push notifications are working.");
    const url = String(body.url || "/dashboard");

    const result = await sendPushNotification(user.id, title, message, url);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
