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
    
    // Fetch all push subscriptions for this user using security definer RPC
    const { data: rpcSubs, error: rpcErr } = await supabase
      .rpc("get_user_push_subscriptions" as never, { p_user_id: userId } as never);
    
    let subscriptions = rpcSubs as Array<{ endpoint: string; p256dh: string; auth: string }> | null;
    if (rpcErr || !subscriptions) {
      const { data: directSubs, error } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId);
      if (error && !subscriptions) {
        console.error("Error fetching push subscriptions:", error);
        return { success: false, error: error.message };
      }
      subscriptions = directSubs;
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

export type CartReminderPushOptions = {
  items?: Array<{ title: string }>;
  checkoutUrl?: string;
};

export async function sendCartReminderPush(
  userId: string,
  options: CartReminderPushOptions = {}
) {
  const title = "Your cart is ready for checkout";
  let body = "Items are waiting in your cart. Complete your checkout before stock runs out!";
  if (options.items && options.items.length > 0) {
    const titles = options.items.map((i) => i.title).filter(Boolean).slice(0, 2).join(", ");
    const remaining = options.items.length > 2 ? ` and ${options.items.length - 2} more` : "";
    body = `Items left in shopping cart: ${titles}${remaining}. Complete your checkout now!`;
  }
  const link = options.checkoutUrl || "/checkout";
  return await sendPushNotification(userId, title, body, link);
}

