import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Setup VAPID details
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:12k21rakeshkannam@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (serviceKey) {
    return createClient(url, serviceKey, {
      auth: { persistSession: false }
    });
  }
  return await createServerClient();
}

export async function sendPushNotification(userId: string, title: string, message: string, link: string = "/") {
  try {
    const supabase = await getSupabaseAdmin();
    
    // Fetch all push subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching push subscriptions:", error);
      return { success: false, error: error.message };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, sentCount: 0 };
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/Assets/RakeLogo.png",
      badge: "/Assets/RakeBadge.png",
      url: link
    });

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };
          await webpush.sendNotification(pushSubscription, payload);
          return { endpoint: sub.endpoint, success: true };
        } catch (err: unknown) {
          // If subscription has expired or is invalid, remove it from DB
          const errorObj = err as { statusCode?: number; message?: string };
          if (errorObj.statusCode === 410 || errorObj.statusCode === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
          return { endpoint: sub.endpoint, success: false, error: errorObj.message || "Failed to push" };
        }
      })
    );

    const sentCount = results.filter((r) => r.success).length;
    return { success: true, sentCount, results };
  } catch (error: unknown) {
    console.error("Error in sendPushNotification:", error);
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
