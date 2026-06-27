"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";
import { cleanPhone, sendWhatsAppText } from "@/lib/whatsapp";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";


async function getAdminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  return supabase;
}

function idFrom(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid record");
  return id;
}

type SupabaseAdmin = Awaited<ReturnType<typeof createClient>>;

type ParsedOrderItem = {
  type?: string;
  gameId?: number;
  title: string;
  platform?: string;
  quantity: number;
  price?: number;
};

type OrderForStatus = {
  id: number;
  user_id: string | null;
  game_id: number | null;
  variant_type: string | null;
  order_reference: string | null;
  customer_name: string | null;
  customer_whatsapp: string | null;
  total_price: number | null;
  cart_items: unknown;
  account_access?: string | null;
};

function parseOrderItems(raw: unknown, fallbackGameId?: number | null, fallbackPlatform?: string | null, fallbackPrice?: number | null): ParsedOrderItem[] {
  let source = raw;

  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      source = [];
    }
  }

  const entries = Array.isArray(source) ? source : [];
  const items = entries
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const gameId = Number(item.gameId ?? item.game_id ?? item.id);
      return {
        type: String(item.type ?? "game"),
        gameId: Number.isFinite(gameId) && gameId > 0 ? gameId : undefined,
        title: String(item.title ?? item.name ?? "Game order"),
        platform:
          typeof item.platform === "string"
            ? item.platform
            : typeof item.variant_type === "string"
              ? item.variant_type
              : undefined,
        quantity: Math.max(1, Number(item.quantity ?? 1) || 1),
        price: Number(item.unit_price ?? item.price ?? item.sale_price ?? item.total ?? 0) || 0,
      };
    })
    .filter(Boolean) as ParsedOrderItem[];

  if (items.length) return items;

  if (fallbackGameId) {
    return [
      {
        type: "game",
        gameId: fallbackGameId,
        title: "Game order",
        platform: fallbackPlatform ?? undefined,
        quantity: 1,
        price: Number(fallbackPrice ?? 0),
      },
    ];
  }

  return [{ type: "game", title: "Order item", platform: fallbackPlatform ?? undefined, quantity: 1, price: Number(fallbackPrice ?? 0) }];
}

async function getCustomerEmail(supabase: SupabaseAdmin, userId?: string | null) {
  if (!userId) return null;

  const { data, error } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  if (error) return null;

  return typeof data?.email === "string" && data.email.includes("@") ? data.email : null;
}

function buildEmailHtml(order: OrderForStatus, status: string, items: ParsedOrderItem[]) {
  const reference = order.order_reference || `#${order.id}`;
  const customerName = order.customer_name || "Customer";
  const fallbackTotal = items.reduce((sum, item) => sum + Number(item.price ?? 0) * item.quantity, 0);
  const total = Number(order.total_price ?? fallbackTotal).toLocaleString("en-IN");

  const statusUpper = status.toUpperCase();
  let statusBadgeColor = "#f59e0b"; // amber for verified/processing/pending
  if (statusUpper === "DELIVERED" || statusUpper === "COMPLETED") {
    statusBadgeColor = "#10b981"; // emerald
  } else if (statusUpper === "REJECTED") {
    statusBadgeColor = "#ef4444"; // red
  }

  const itemRows = items.map((item) => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
      <td style="padding: 14px 8px; text-align: left; color: #e4e4e7; font-size: 14px; line-height: 1.8;">
        <strong style="display: block; color: #ffffff;">${item.title}</strong>
        <span style="font-size: 11px; color: #8991a6; font-weight: 500;">${item.platform || "PC Game"}</span>
      </td>
      <td style="padding: 14px 8px; text-align: center; color: #e4e4e7; font-size: 14px; line-height: 1.8;">${item.quantity}</td>
      <td style="padding: 14px 8px; text-align: right; color: #ffffff; font-size: 14px; font-weight: bold; line-height: 1.8;">Rs. ${(Number(item.price ?? 0) * item.quantity).toLocaleString("en-IN")}</td>
    </tr>
  `).join("");

  let actionText = "";
  if (statusUpper === "DELIVERED" || statusUpper === "COMPLETED") {
    actionText = `
      <div style="margin: 40px 0; padding: 24px; background: rgba(16, 185, 129, 0.04); border: 1px solid rgba(16, 185, 129, 0.12); border-radius: 8px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <p style="margin: 0; color: #10b981; font-weight: 800; font-size: 16px; line-height: 1.6; text-transform: uppercase; letter-spacing: 0.05em;">Your game is ready in your library!</p>
        <p style="margin: 10px 0 0; color: #e4e4e7; font-size: 14px; line-height: 1.8;">Go to My Library in your customer dashboard to find activation instructions.</p>
      </div>
    `;
  } else if (statusUpper === "VERIFIED" || statusUpper === "PROCESSING") {
    actionText = `
      <div style="margin: 40px 0; padding: 24px; background: rgba(245, 158, 11, 0.04); border: 1px solid rgba(245, 158, 11, 0.12); border-radius: 8px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <p style="margin: 0; color: #f59e0b; font-weight: 800; font-size: 16px; line-height: 1.6; text-transform: uppercase; letter-spacing: 0.05em;">Payment Verified & Delivery Initiated</p>
        <p style="margin: 10px 0 0; color: #e4e4e7; font-size: 14px; line-height: 1.8;">We are preparing your game files now. You will receive another notification upon completion.</p>
      </div>
    `;
  } else if (statusUpper === "REJECTED") {
    actionText = `
      <div style="margin: 40px 0; padding: 24px; background: rgba(239, 68, 68, 0.04); border: 1px solid rgba(239, 68, 68, 0.12); border-radius: 8px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <p style="margin: 0; color: #ef4444; font-weight: 800; font-size: 16px; line-height: 1.6; text-transform: uppercase; letter-spacing: 0.05em;">Payment verification needs attention</p>
        <p style="margin: 10px 0 0; color: #e4e4e7; font-size: 14px; line-height: 1.8;">Please upload a clear payment screenshot or contact support to resolve this issue.</p>
      </div>
    `;
  }

  const copy: Record<string, string> = {
    Verified: `Payment verified. Preparing your game delivery now.`,
    Processing: `Your game is being prepared for delivery.`,
    Delivered: `Your game has been delivered and is ready to play.`,
    Completed: `Your order has been completed successfully.`,
    Rejected: `We could not verify payment. Please contact support.`,
    Pending: `Your order is pending payment review.`,
  };

  const statusDesc = copy[status] ?? `Your order status is now ${status}.`;

  return `
    <div style="margin:0;background:#070708;padding:48px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7">
      <div style="max-width:580px;margin:auto;border:1px solid rgba(255,255,255,0.08);border-radius:12px;background:#0f0f11;padding:48px;box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
        <header style="border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:24px;text-align:center;">
          <h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:.03em;color:#ffffff;">RAKEXURA</h1>
          <span style="font-size:11px;color:#8b5cf6;font-weight:800;letter-spacing:.1em;text-transform:uppercase;">PC Game Store</span>
        </header>
        
        <div style="padding: 24px 0;">
          <p style="margin:0 0 12px;font-size:16px;color:#ffffff;font-weight:bold;line-height:1.6;">Hi ${customerName},</p>
          <p style="margin:0;font-size:14px;line-height:1.8;color:#e4e4e7;">${statusDesc}</p>
          
          <div style="margin:32px 0; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 18px 22px; background: rgba(255,255,255,0.015);">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="text-align: left; vertical-align: middle; padding: 0;">
                  <span style="font-size: 11px; color: #8991a6; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">Order Reference</span>
                  <code style="font-family: monospace; font-size: 15px; color: #ffffff; font-weight: 700;">${reference}</code>
                </td>
                <td style="text-align: right; vertical-align: middle; padding: 0;">
                  <span style="font-size: 11px; color: #8991a6; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">Status</span>
                  <span style="font-size: 12px; font-weight: 800; color: ${statusBadgeColor}; text-transform: uppercase; letter-spacing: 0.05em;">${statusUpper}</span>
                </td>
              </tr>
            </table>
          </div>

          ${actionText}

          <h3 style="margin:40px 0 16px;font-size:12px;font-weight:800;text-transform:uppercase;color:#8991a6;letter-spacing:.08em;">Order Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom: 2px solid rgba(255,255,255,0.08);">
                <th style="padding: 10px 8px; text-align: left; color: #8991a6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Game</th>
                <th style="padding: 10px 8px; text-align: center; color: #8991a6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Qty</th>
                <th style="padding: 10px 8px; text-align: right; color: #8991a6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 24px 8px 8px; text-align: left; color: #8991a6; font-size: 14px;">Total Paid</td>
                <td style="padding: 24px 8px 8px; text-align: right; color: #ffffff; font-size: 18px; font-weight: 900;">Rs. ${total}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <footer style="border-top:1px solid rgba(255,255,255,.08);padding-top:24px;text-align:center;color:#646b7b;font-size:11px;line-height:1.6;">
          <p style="margin:0;">Secure assisted game delivery by Rakexura Store.</p>
          <p style="margin:4px 0 0;">Need activation help or support? Reply to this email or chat on WhatsApp.</p>
        </footer>
      </div>
    </div>
  `;
}

function buildStatusEmail(order: OrderForStatus, status: string, items: ParsedOrderItem[]) {
  const reference = order.order_reference || `#${order.id}`;
  const customerName = order.customer_name || "Customer";
  const itemLines = items
    .map((item) => `- ${item.title}${item.platform ? ` (${item.platform})` : ""} x${item.quantity}`)
    .join("\n");
  const fallbackTotal = items.reduce((sum, item) => sum + Number(item.price ?? 0) * item.quantity, 0);
  const total = Number(order.total_price ?? fallbackTotal).toLocaleString("en-IN");

  const textContent = status === "Delivered" || status === "Completed"
    ? [
        `Hi ${customerName},`,
        "",
        `Your Rakexura order ${reference} has been delivered.`,
        "",
        "Invoice summary:",
        itemLines || "- Game order",
        `Total paid: Rs. ${total}`,
        "",
        "Your game is now available in My Library. Contact Rakexura support if you need activation help.",
        "",
        "Thank you for choosing Rakexura.",
      ].join("\n")
    : [
        `Hi ${customerName},`,
        "",
        status === "Verified"
          ? `Payment for your Rakexura order ${reference} has been verified. We are preparing your game delivery now.`
          : status === "Processing"
            ? `Your Rakexura order ${reference} is now being prepared for delivery.`
            : status === "Rejected"
              ? `We could not verify payment for Rakexura order ${reference}. Please share a clear payment screenshot or contact Rakexura support.`
              : `Your Rakexura order ${reference} is now ${status}.`,
        "",
        itemLines || "- Game order",
        `Total: Rs. ${total}`,
      ].join("\n");

  return {
    subject: status === "Delivered" || status === "Completed" ? `Rakexura invoice ${reference}` : `Rakexura order ${reference}: ${status}`,
    text: textContent,
    html: buildEmailHtml(order, status, items),
  };
}


async function addDeliveredItemsToLibrary(supabase: SupabaseAdmin, order: OrderForStatus, items: ParsedOrderItem[]) {
  if (!order.user_id) return { updated: false, reason: "Order is not linked to a signed-in customer" };

  const rows = items
    .filter((item) => item.type !== "bundle" && item.gameId)
    .map((item) => ({
      user_id: order.user_id,
      game_id: item.gameId!,
      order_id: order.id,
      platform: item.platform ?? order.variant_type ?? "Steam",
      delivery_notes: order.account_access ? order.account_access : "Delivered by Rakexura admin",
    }));

  if (!rows.length) return { updated: false, reason: "No direct game items found for library insert" };

  const { error } = await supabase.from("customer_library").upsert(rows, { onConflict: "user_id,game_id,platform" });
  if (error) return { updated: false, error: error.message };

  return { updated: true };
}

export async function updateOrderStatus(formData: FormData) {
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const status = String(formData.get("status") ?? "");
  if (!["Pending", "Verified", "Processing", "Delivered", "Completed", "Rejected"].includes(status)) throw new Error("Invalid status");
  const paymentStatus = status === "Rejected" ? "Rejected" : status === "Pending" ? "Pending" : "Approved";
  
  const updatePayload: Record<string, unknown> = { order_status: status, payment_status: paymentStatus, updated_at: new Date().toISOString() };
  if (formData.has("account_access")) {
    updatePayload.account_access = String(formData.get("account_access") ?? "").trim() || null;
  }

  const { data: order, error } = await supabase.from("orders").update(updatePayload).eq("id", id).select("id, user_id, game_id, variant_type, order_reference, customer_name, customer_whatsapp, total_price, cart_items, account_access").single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard/orders");
  revalidatePath("/track");

  const items = parseOrderItems(order.cart_items, order.game_id, order.variant_type, order.total_price);
  if (status === "Delivered" || status === "Completed") {
    await addDeliveredItemsToLibrary(supabase, order, items);
  }

  // Add a database notification for the customer regarding the order transition
  if (order.user_id) {
    let notifTitle = "";
    let notifMessage = "";
    if (status === "Delivered" || status === "Completed") {
      notifTitle = "Order Delivered";
      notifMessage = "Your game has been successfully added to your library.";
    } else if (status === "Verified") {
      notifTitle = "Payment Verified";
      notifMessage = "Payment verified. Preparing your game delivery now.";
    } else if (status === "Processing") {
      notifTitle = "Order Processing";
      notifMessage = "Preparing your game delivery.";
    } else if (status === "Rejected") {
      notifTitle = "Payment Failed";
      notifMessage = "Payment verification failed. Please contact support.";
    } else if (status === "Pending") {
      notifTitle = "Order Pending";
      notifMessage = "Your order is pending payment review.";
    }

    if (notifTitle) {
      await supabase.from("notifications").insert({
        user_id: order.user_id,
        title: notifTitle,
        message: notifMessage,
        type: "order",
        link: "/dashboard/orders",
      });
      if (order.user_id) {
        await sendPushNotification(order.user_id, notifTitle, notifMessage, "/dashboard/orders");
      }
    }
  }

  const customerEmail = await getCustomerEmail(supabase, order.user_id);
  let emailSent = false;
  let emailError = null;

  const shouldSendEmail = ["Delivered", "Completed", "Rejected"].includes(status);

  if (customerEmail && shouldSendEmail) {
    const emailData = buildStatusEmail(order, status, items);
    const emailResult = await sendEmail({
      to: customerEmail,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    });
    emailSent = emailResult.ok;
    emailError = emailResult.error ?? emailResult.reason ?? null;
  }

  const reference = order.order_reference || `#${id}`;
  const statusMessage: Record<string, string> = {
    Verified: `Hi ${order.customer_name}, payment for Rakexura order ${reference} has been verified. We are preparing your game delivery now.`,
    Processing: `Hi ${order.customer_name}, your Rakexura order ${reference} is now being prepared for delivery.`,
    Delivered: `Hi ${order.customer_name}, your Rakexura order ${reference} has been delivered. Please check the delivery details and contact us if you need activation help.`,
    Rejected: `Hi ${order.customer_name}, we could not verify payment for Rakexura order ${reference}. Please reply with a clear payment screenshot or contact us for help.`,
  };
  const normalizedPhone = cleanPhone(order.customer_whatsapp);
  const customerMessage = statusMessage[status] ?? `Your Rakexura order ${reference} is now ${status}.`;
  const customerDelivery = await sendWhatsAppText(normalizedPhone, customerMessage);
  return {
    status,
    message: `Order ${reference} marked as ${status}.`,
    customerMessageSent: customerDelivery.ok,
    customerMessageSkipped: Boolean(customerDelivery.skipped),
    customerMessageError: customerDelivery.error ?? customerDelivery.reason ?? null,
    customerEmailSent: emailSent,
    customerEmailError: emailError,
  };
}

export async function saveAccountAccess(formData: FormData) {
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const accountAccess = String(formData.get("account_access") ?? "").trim();

  const { error } = await supabase
    .from("orders")
    .update({ account_access: accountAccess || null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath("/dashboard/orders");
  revalidatePath("/track");
  return { success: true };
}

export async function moderateReview(formData: FormData) {
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const decision = String(formData.get("decision"));
  const { data: review } = decision === "delete" ? await supabase.from("reviews").select("media_urls").eq("id", id).maybeSingle() : { data: null };
  const query = decision === "delete" ? supabase.from("reviews").delete().eq("id", id) : supabase.from("reviews").update({ approved: decision === "approve" }).eq("id", id);
  const { error } = await query;
  if (error) throw new Error(error.message);
  if (decision === "delete" && Array.isArray(review?.media_urls) && review.media_urls.length) await supabase.storage.from("review-media").remove(review.media_urls);
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
}

export async function updateRequestStatus(formData: FormData) {
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const requestedStatus = String(formData.get("status") ?? "");
  const status = requestedStatus === "Added" ? "available" : requestedStatus.toLowerCase();
  if (!["requested", "reviewing", "planned", "available", "declined"].includes(status)) throw new Error("Invalid status");

  const { data: requestRow } = await supabase.from("game_requests").select("game_name, user_id").eq("id", id).single();

  const { error } = await supabase.from("game_requests").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/game-requests");
  revalidatePath("/admin/requests");
  revalidatePath("/requests");

  if (status === "available" && requestRow) {
    await supabase.from("notifications").insert({
      user_id: requestRow.user_id,
      title: "Requested Game Added!",
      message: `The game you requested (${requestRow.game_name}) has been added to the store! Click here to view the catalog.`,
      type: "game",
      link: "/games"
    });
    if (requestRow.user_id) {
      await sendPushNotification(
        requestRow.user_id,
        "Requested Game Added!",
        `The game you requested (${requestRow.game_name}) has been added to the store!`,
        "/games"
      );
    }

    redirect(`/admin/messages?prefill=${encodeURIComponent(requestRow.game_name)}`);
  }
}

export async function toggleCoupon(formData: FormData) {
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const active = String(formData.get("active")) === "true";
  const { error } = await supabase.from("coupons").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/coupons");
}

export async function archiveGame(formData: FormData) {
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const archived = String(formData.get("archived")) === "true";
  const { error } = await supabase.from("games").update({ archived }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/games");
  revalidatePath("/games");
}

function optionalNumber(value: FormDataEntryValue | null) {
  if (value === null || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function saveGame(formData: FormData) {
  const supabase = await getAdminClient();
  const rawId = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 2) throw new Error("Game title is required");
  const platforms = formData.getAll("platforms").map(String).filter((value) => ["Steam", "Epic", "Offline", "Online", "Xbox", "Nvidia GeForce"].includes(value));
  if (!platforms.length) throw new Error("Select at least one platform");
  const keyFeaturesRaw = String(formData.get("key_features") ?? "");
  const key_features = keyFeaturesRaw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const payload = {
    title,
    tagline: String(formData.get("tagline") ?? "").trim() || null,
    developer: String(formData.get("developer") ?? "").trim() || null,
    publisher: String(formData.get("publisher") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    long_description: String(formData.get("long_description") ?? "").trim() || null,
    cover_image: String(formData.get("cover_image") ?? "").trim() || null,
    banner_image: String(formData.get("banner_image") ?? "").trim() || null,
    trailer_url: String(formData.get("trailer_url") ?? "").trim() || null,
    key_features: key_features.length ? key_features : null,
    steam_price: optionalNumber(formData.get("steam_price")),
    epic_price: optionalNumber(formData.get("epic_price")),
    offline_price: optionalNumber(formData.get("offline_price")),
    online_price: optionalNumber(formData.get("online_price")),
    xbox_price: optionalNumber(formData.get("xbox_price")),
    geforce_price: optionalNumber(formData.get("geforce_price")),
    duration: String(formData.get("duration") ?? "").trim() || null,
    original_price: optionalNumber(formData.get("original_price")),
    sale_price: optionalNumber(formData.get("sale_price")),
    genres: formData.getAll("genres").map(String),
    available_platforms: platforms,
    offer_enabled: formData.get("offer_enabled") === "on",
    offer_end_date: String(formData.get("offer_end_date") ?? "") || null,
    release_date: String(formData.get("release_date") ?? "") || null,
    featured_deal: formData.get("featured_deal") === "on",
    show_in_hero: formData.get("show_in_hero") === "on",
    show_in_featured: formData.get("show_in_featured") === "on",
    show_in_trending: formData.get("show_in_trending") === "on",
    show_in_recommended: formData.get("show_in_recommended") === "on",
    preorder: formData.get("preorder") === "on",
    is_subscription: formData.get("is_subscription") === "on",
    online_activation: formData.get("online_activation") === "on",
    is_premium: formData.get("is_premium") === "on",
    premium_theme: String(formData.get("premium_theme") ?? "royal").trim() || "royal",
    out_of_stock: formData.get("out_of_stock") === "on",
    archived: false,
  };
  const query = rawId ? supabase.from("games").update(payload).eq("id", Number(rawId)) : supabase.from("games").insert(payload);
  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/admin/games");
  revalidatePath("/");
  revalidatePath("/games");
  redirect("/admin/games");
}

export async function saveCoupon(formData: FormData) {
  const supabase = await getAdminClient();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discountType = String(formData.get("discount_type") ?? "percentage");
  const discountValue = optionalNumber(formData.get("discount_value"));
  if (!/^[A-Z0-9_-]{3,24}$/.test(code) || !discountValue || discountValue <= 0) throw new Error("Enter a valid coupon code and discount");
  if (!["percentage", "flat"].includes(discountType)) throw new Error("Invalid discount type");
  const payload = { code, discount_type: discountType, discount_value: discountValue, minimum_order: optionalNumber(formData.get("minimum_order")) ?? 0, usage_limit: optionalNumber(formData.get("usage_limit")), expires_at: String(formData.get("expires_at") ?? "") || null };
  const rawId = String(formData.get("id") ?? "");
  const query = rawId ? supabase.from("coupons").update(payload).eq("id", Number(rawId)) : supabase.from("coupons").insert({ ...payload, active: true });
  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function moderateProof(formData: FormData) {
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const decision = String(formData.get("decision") ?? "");
  const query = decision === "delete" ? supabase.from("customer_proofs").delete().eq("id", id) : supabase.from("customer_proofs").update({ approved: decision === "approve" }).eq("id", id);
  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/admin/media");
  revalidatePath("/");
}

export async function saveBundle(formData: FormData) {
  const supabase = await getAdminClient();
  const rawId = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const gameIds = formData.getAll("game_ids").map(Number).filter((id) => Number.isInteger(id) && id > 0);
  if (title.length < 2) throw new Error("Bundle title is required");
  if (gameIds.length < 2) throw new Error("Choose at least two games for a combo deal");
  const payload = { 
    title, 
    description: String(formData.get("description") ?? "").trim() || null, 
    cover_image: String(formData.get("cover_image") ?? "").trim() || null, 
    original_price: optionalNumber(formData.get("original_price")) ?? 0, 
    bundle_price: optionalNumber(formData.get("bundle_price")) ?? 0, 
    active: formData.get("active") === "on",
    offer_end_date: formData.get("offer_end_date") ? new Date(String(formData.get("offer_end_date"))).toISOString() : null
  };
  let bundleId = Number(rawId);
  if (rawId) {
    const { error } = await supabase.from("bundles").update(payload).eq("id", bundleId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from("bundles").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    bundleId = data.id;
  }
  const { error: clearError } = await supabase.from("bundle_games").delete().eq("bundle_id", bundleId);
  if (clearError) throw new Error(clearError.message);
  const { error: gamesError } = await supabase.from("bundle_games").insert(gameIds.map((gameId) => ({ bundle_id: bundleId, game_id: gameId })));
  if (gamesError) throw new Error(gamesError.message);
  revalidatePath("/admin/bundles"); revalidatePath("/bundles"); revalidatePath("/");
  redirect("/admin/bundles");
}

export async function toggleBundle(formData: FormData) {
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const active = String(formData.get("active")) === "true";
  const { error } = await supabase.from("bundles").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bundles"); revalidatePath("/bundles"); revalidatePath("/");
}

export async function deleteBundle(formData: FormData) {
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  // First delete associated games mappings in bundle_games relation
  const { error: gamesError } = await supabase.from("bundle_games").delete().eq("bundle_id", id);
  if (gamesError) throw new Error(gamesError.message);
  
  // Then delete the bundle itself
  const { error } = await supabase.from("bundles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  
  revalidatePath("/admin/bundles"); 
  revalidatePath("/bundles"); 
  revalidatePath("/");
}

export async function saveMarqueeMessage(formData: FormData) {
  const supabase = await getAdminClient();
  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 3 || message.length > 160) throw new Error("Announcement must be between 3 and 160 characters");
  const payload = {
    message,
    icon_key: String(formData.get("icon_key") ?? "spark"),
    sort_order: optionalNumber(formData.get("sort_order")) ?? 0,
    active: true,
  };
  const { error } = await supabase.from("marquee_messages").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/storefront");
  revalidatePath("/");
}

export async function updateMarqueeMessage(formData: FormData) {
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const decision = String(formData.get("decision") ?? "");
  const query = decision === "delete"
    ? supabase.from("marquee_messages").delete().eq("id", id)
    : supabase.from("marquee_messages").update({ active: decision === "enable" }).eq("id", id);
  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/admin/storefront");
  revalidatePath("/");
}

export async function saveStoreCategory(formData: FormData) {
  const supabase = await getAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 40) throw new Error("Category name must be between 2 and 40 characters");
  const { error } = await supabase.from("store_categories").insert({
    name,
    icon_key: String(formData.get("icon_key") ?? "gamepad"),
    sort_order: optionalNumber(formData.get("sort_order")) ?? 0,
    active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/storefront");
  revalidatePath("/admin/games");
  revalidatePath("/");
  revalidatePath("/games");
}

export async function updateStoreCategory(formData: FormData) {
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const decision = String(formData.get("decision") ?? "");
  const query = decision === "delete"
    ? supabase.from("store_categories").delete().eq("id", id)
    : supabase.from("store_categories").update({ active: decision === "enable" }).eq("id", id);
  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/admin/storefront");
  revalidatePath("/admin/games");
  revalidatePath("/");
  revalidatePath("/games");
}

export async function sendStoreAnnouncement(formData: FormData) {
  const supabase = await getAdminClient();
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim() || "/games";
  if (title.length < 3 || title.length > 80 || message.length < 5 || message.length > 300) throw new Error("Enter a clear title and message");
  if (!link.startsWith("/")) throw new Error("Announcement link must be a Rakexura path");
  const { data: profiles, error: profileError } = await supabase.from("profiles").select("id, email");
  if (profileError) throw new Error(profileError.message);
  if (!profiles?.length) return { count: 0 };
  const { error } = await supabase.from("notifications").insert(profiles.map(({ id }) => ({ user_id: id, title, message, type: "promotion", link })));
  if (error) throw new Error(error.message);
  await Promise.all(
    profiles.map((p) => sendPushNotification(p.id, title, message, link))
  );

  // Call the transmission pipeline to fire off automated email updates
  for (const p of profiles) {
    if (p.email && p.email.includes("@")) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura.com";
      const textContent = `${message}\n\nRead more details here: ${siteUrl}${link}`;
      await sendEmail({
        to: p.email,
        subject: title,
        text: textContent,
      });
    }
  }

  revalidatePath("/admin/messages");
  return { count: profiles.length };
}

export async function adjustRewardPoints(formData: FormData) {
  const supabase = await getAdminClient();
  const userId = String(formData.get("user_id") ?? "");
  const points = Number(formData.get("points"));
  const reason = String(formData.get("reason") ?? "Admin reward").trim();
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !Number.isInteger(points) || points === 0 || Math.abs(points) > 10000) throw new Error("Invalid reward adjustment");
  const { data: current, error: readError } = await supabase.from("user_rewards").select("points").eq("user_id", userId).maybeSingle();
  if (readError) throw new Error(readError.message);
  const nextPoints = Math.min(10000, Math.max(0, Number(current?.points ?? 0) + points));
  const { error } = await supabase.from("user_rewards").upsert({ user_id: userId, points: nextPoints });
  if (error) throw new Error(error.message);
  const { error: transactionError } = await supabase.from("reward_transactions").insert({ user_id: userId, points: nextPoints - Number(current?.points ?? 0), reason: reason || "Admin reward" });
  if (transactionError) throw new Error(transactionError.message);
  revalidatePath("/admin/rewards");
  revalidatePath("/dashboard/rewards");
}

export async function approveMilestoneRequest(formData: FormData) {
  const supabase = await getAdminClient();
  const ticketId = Number(formData.get("ticket_id"));
  const promoCode = String(formData.get("promo_code") ?? "").trim().toUpperCase();
  const unlockAccess = formData.get("unlock_access") === "on" || formData.get("unlock_access") === "true";

  if (!ticketId || !promoCode) throw new Error("Ticket ID and Promo Code are required");
  if (!unlockAccess) throw new Error("You must enable the access unlock toggle to approve this request.");

  // Get the ticket and user details
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("user_id, subject, message")
    .eq("id", ticketId)
    .single();

  if (ticketError || !ticket) throw new Error("Ticket not found");

  // 1. Update ticket status to 'Approved' and append authorized code to message
  const { error: updateError } = await supabase
    .from("support_tickets")
    .update({
      status: "Approved",
      message: `${ticket.message}\n\n[Approved Code: ${promoCode}]`,
      updated_at: new Date().toISOString()
    })
    .eq("id", ticketId);
  if (updateError) throw new Error(updateError.message);

  // 2. Fetch customer profile to get email and display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", ticket.user_id)
    .maybeSingle();

  // 3. Send in-app notification
  await supabase.from("notifications").insert({
    user_id: ticket.user_id,
    title: "Voucher Approved!",
    message: `Your loyalty request has been approved! Use promo code: ${promoCode}`,
    type: "reward",
    link: "/dashboard/rewards"
  });
  await sendPushNotification(
    ticket.user_id,
    "Voucher Approved!",
    `Your loyalty request has been approved! Use promo code: ${promoCode}`,
    "/dashboard/rewards"
  );

  // 4. Send email
  if (profile?.email && profile.email.includes("@")) {
    const textContent = `Hi ${profile.display_name || "Customer"},\n\nYour loyalty reward request has been approved!\n\nUse promo code: ${promoCode}\n\nThank you for shopping with Rakexura Store!`;
    await sendEmail({
      to: profile.email,
      subject: "Your Milestone Voucher is Approved!",
      text: textContent
    });
  }

  revalidatePath("/admin/requests");
  revalidatePath("/dashboard/rewards");
  revalidatePath("/dashboard");
}

export async function sendSinglePushNotification(formData: FormData) {
  const supabase = await getAdminClient();
  const userId = String(formData.get("userId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim() || "/";

  if (!userId) throw new Error("Select a customer");
  if (!title || !message) throw new Error("Title and message are required");

  // Send push notification specifically to this user
  const result = await sendPushNotification(userId, title, message, link);
  if (!result.success) {
    throw new Error(result.error || "Failed to send push notification");
  }

  // Also insert an in-app notification in Supabase so the customer sees it there as well (keep in sync!)
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type: "promotion",
    link,
  });

  return { success: true, sentCount: result.sentCount ?? 0 };
}

export async function giftGameToCustomer(formData: FormData) {
  try {
    const supabase = await getAdminClient();
    const userId = String(formData.get("userId") ?? "");
    const gameId = Number(formData.get("gameId") ?? 0);
    const platform = String(formData.get("platform") ?? "Steam");

    if (!userId || !gameId) {
      return { success: false, error: "Customer and Game are required" };
    }

    // 1. Fetch game and profile details
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("title")
      .eq("id", gameId)
      .maybeSingle();
    if (gameError || !game) {
      return { success: false, error: `Game not found: ${gameError?.message || "Verify your connection."}` };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("display_name, whatsapp")
      .eq("id", userId)
      .maybeSingle();
    if (profileError || !profile) {
      return { success: false, error: `Customer profile not found: ${profileError?.message || "Verify profile exists."}` };
    }

    // 2. Build cart_items JSON payload
    const cart_items = [
      {
        type: "game",
        game_id: gameId,
        title: game.title,
        platform: platform,
        quantity: 1,
        unit_price: 0
      }
    ];

    // 3. Create the order at Rs. 0
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        game_id: gameId,
        variant_type: platform,
        customer_name: profile.display_name || "Gifted Player",
        customer_whatsapp: profile.whatsapp ? profile.whatsapp.replace(/\D/g, "") : "",
        payment_status: "Approved",
        order_status: "Pending", // Pending status to allow transition update
        total_price: 0,
        cart_items: cart_items,
        user_id: userId,
        payment_reference: "GIFTED"
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return { 
        success: false, 
        error: `Failed to create gifted order: ${orderError?.message || "Please verify that the admin insert policy has been applied in your Supabase SQL editor."}` 
      };
    }

    const orderRef = `RKX-GIFT-${order.id}`;

    // 4. Update status to 'Delivered' and set the reference
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        order_reference: orderRef,
        order_status: "Delivered"
      })
      .eq("id", order.id);

    if (updateError) {
      return { success: false, error: `Failed to deliver gifted order: ${updateError.message}` };
    }

    // Send push notification directly to the user's phone for lockscreen delivery!
    try {
      await sendPushNotification(
        userId,
        "Gift Received! 🎁",
        `You have received a giveaway gift from the owner: ${game.title}! Click to view.`,
        "/dashboard/orders"
      );
    } catch (pushError) {
      console.error("Failed to send gift push notification:", pushError);
    }

    revalidatePath("/admin/games");
    revalidatePath("/");
    revalidatePath("/games");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/library");

    return { success: true, orderRef };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "An unexpected server error occurred." };
  }
}

export async function sendPushEncouragement() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, reason: "Unauthorized" };

  // Check if we already sent the push encouragement notification
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("title", "Enable Device Notifications")
    .maybeSingle();

  if (existing) {
    return { success: true, skipped: true, reason: "Already notified once" };
  }

  // 1. Insert in-app website notification
  await supabase.from("notifications").insert({
    user_id: user.id,
    title: "Enable Device Notifications",
    message: "Don't miss live order updates! Go to settings to enable push notifications on your phone lock screen.",
    type: "reward",
    link: "/dashboard/settings"
  });

  // 2. Send email to user (if email available)
  if (user.email && user.email.includes("@")) {
    const textContent = `Hi,\n\nStay updated with instant game deliveries and order confirmations on Rakexura Store!\n\nPlease go to your Account Settings under /dashboard/settings to enable push notifications on your device.\n\nThank you,\nRakexura Support`;
    
    await sendEmail({
      to: user.email,
      subject: "Never Miss a Game Delivery – Enable Rakexura Notifications",
      text: textContent
    });
  }

  return { success: true };
}
