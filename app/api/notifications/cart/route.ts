import { NextResponse } from "next/server";
import { rateLimiter } from "@/lib/security/rate-limit";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendCartRecoveryEmail, CartRecoveryItem } from "@/lib/email";
import { sendCartReminderPush } from "@/lib/push";
import { SITE_CONFIG } from "@/lib/config";

export const runtime = "nodejs";

type CartItemInput = {
  title: string;
  platform?: string;
  quantity?: number;
  imageUrl?: string;
  price?: number;
};

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const rateLimitKey = `rate-limit:notifications-cart:${ip}`;
    const limitRes = await rateLimiter.limit(rateLimitKey, 10, 60);
    if (!limitRes.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Too many requests. Please try again in a minute.",
            code: "RATE_LIMIT_EXCEEDED",
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(limitRes.reset - Math.floor(Date.now() / 1000))) },
        }
      );
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json().catch(() => ({}));
    const requestedUserId = body.userId || body.targetUserId;
    const requestedEmail = body.email || body.targetEmail;
    const customItems = Array.isArray(body.items) ? (body.items as CartItemInput[]) : null;
    const brandName = body.brandName || "RAKEXURA STORE";
    const siteUrl = SITE_CONFIG.siteUrl.replace(/\/$/, "");
    const checkoutUrl = body.checkoutUrl || `${siteUrl}/checkout`;
    const storeUrl = body.storeUrl || `${siteUrl}/games`;

    // Determine target user ID and email
    let targetUserId = user?.id || null;
    let targetEmail = user?.email || null;
    let customerName = user?.user_metadata?.display_name || user?.user_metadata?.name || null;

    // If an admin or caller is specifying a target user/email
    if (requestedUserId && requestedUserId !== user?.id) {
      targetUserId = requestedUserId;
      // Fetch target profile
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("email, display_name")
        .eq("id", requestedUserId)
        .maybeSingle();

      if (profile?.email) targetEmail = profile.email;
      if (profile?.display_name) customerName = profile.display_name;
    }

    if (requestedEmail && requestedEmail.includes("@")) {
      targetEmail = requestedEmail;
    }

    if (!targetEmail && !targetUserId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "No recipient email or user identified.",
            code: "MISSING_RECIPIENT",
          },
        },
        { status: 400 }
      );
    }

    // Build Cart Items list
    const cartItems: CartRecoveryItem[] = [];

    if (customItems && customItems.length > 0) {
      customItems.forEach((item) => {
        cartItems.push({
          title: item.title || "Selected Game",
          platform: item.platform || "PC",
          quantity: item.quantity || 1,
          imageUrl: item.imageUrl || `${siteUrl}/images/rakexura-silver-badge.png`,
          price: item.price,
        });
      });
    } else if (targetUserId) {
      // Query customer's active cart from Supabase
      const [cartRes, bundleRes] = await Promise.all([
        adminSupabase
          .from("cart_items")
          .select("variant_type, quantity, games(title, cover_image, sale_price, steam_price, offline_price)")
          .eq("user_id", targetUserId),
        adminSupabase
          .from("cart_bundles")
          .select("quantity, bundles(title, cover_image, bundle_price)")
          .eq("user_id", targetUserId),
      ]);

      if (cartRes.data && cartRes.data.length > 0) {
        cartRes.data.forEach((row: {
          variant_type?: string | null;
          quantity?: number | null;
          games?: {
            title?: string | null;
            cover_image?: string | null;
            sale_price?: number | null;
            steam_price?: number | null;
            offline_price?: number | null;
          } | Array<{
            title?: string | null;
            cover_image?: string | null;
            sale_price?: number | null;
            steam_price?: number | null;
            offline_price?: number | null;
          }> | null;
        }) => {
          const game = Array.isArray(row.games) ? row.games[0] : row.games;
          if (game) {
            cartItems.push({
              title: game.title || "PC Game",
              platform: row.variant_type || "PC",
              quantity: row.quantity || 1,
              imageUrl: game.cover_image || `${siteUrl}/images/rakexura-silver-badge.png`,
              price: game.sale_price || game.steam_price || game.offline_price || 0,
            });
          }
        });
      }

      if (bundleRes.data && bundleRes.data.length > 0) {
        bundleRes.data.forEach((row: {
          quantity?: number | null;
          bundles?: {
            title?: string | null;
            cover_image?: string | null;
            bundle_price?: number | null;
          } | Array<{
            title?: string | null;
            cover_image?: string | null;
            bundle_price?: number | null;
          }> | null;
        }) => {
          const bundle = Array.isArray(row.bundles) ? row.bundles[0] : row.bundles;
          if (bundle) {
            cartItems.push({
              title: bundle.title || "Game Bundle",
              platform: "Bundle",
              quantity: row.quantity || 1,
              imageUrl: bundle.cover_image || `${siteUrl}/images/rakexura-silver-badge.png`,
              price: bundle.bundle_price || 0,
            });
          }
        });
      }
    }

    // Fallback if no specific cart items were found
    if (cartItems.length === 0) {
      cartItems.push({
        title: "Selected PC Game",
        platform: "PC",
        quantity: 1,
        imageUrl: `${siteUrl}/images/rakexura-silver-badge.png`,
      });
    }

    let emailSent = false;
    let pushSent = false;

    // 1. Send Recovery Email if email is available
    if (targetEmail && targetEmail.includes("@")) {
      const emailResult = await sendCartRecoveryEmail({
        to: targetEmail,
        customerName: customerName || undefined,
        brandName,
        items: cartItems,
        checkoutUrl,
        storeUrl,
      });
      emailSent = emailResult.ok;
    }

    // 2. Send Push Notification if user ID is available
    if (targetUserId) {
      try {
        const pushResult = await sendCartReminderPush(targetUserId, {
          items: cartItems.map((i) => ({ title: i.title })),
          checkoutUrl,
        });
        pushSent = Boolean(pushResult.success);

        // Also insert In-App Bell Notification in Supabase
        const firstItemTitle = cartItems[0]?.title || "games";
        const itemSnippet = cartItems.length > 1 ? `${firstItemTitle} and more` : firstItemTitle;
        await adminSupabase.from("notifications").insert({
          user_id: targetUserId,
          title: "Your cart is ready for checkout",
          message: `You left ${itemSnippet} in your shopping cart. Complete your checkout before stock runs out!`,
          type: "cart",
          link: "/checkout",
        });
      } catch (pushErr) {
        console.warn("Cart push reminder failed:", pushErr);
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      pushSent,
      itemsCount: cartItems.length,
      recipient: targetEmail,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Cart notification route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message,
          code: "CART_NOTIFICATION_FAILED",
        },
      },
      { status: 500 }
    );
  }
}
