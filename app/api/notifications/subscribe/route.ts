import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json().catch(() => ({}));
    const sub = body.subscription || body;
    const endpoint = sub.endpoint;
    const p256dh = sub.keys?.p256dh || sub.p256dh;
    const auth = sub.keys?.auth || sub.auth;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ success: false, error: "Invalid subscription data" }, { status: 400 });
    }

    const admin = await createAdminClient();
    const { error } = await admin.from("push_subscriptions").upsert({
      user_id: user?.id || null,
      endpoint,
      p256dh,
      auth,
      user_agent: request.headers.get("user-agent") || body.userAgent || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "endpoint" });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const endpoint = body.endpoint;
    if (!endpoint) return NextResponse.json({ success: false }, { status: 400 });

    const admin = await createAdminClient();
    await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
