"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";
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

async function writeAuditLog(action: string, affectedEntity: string, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() || null;
    const userAgent = headersList.get("user-agent") || null;
    
    const id = formData.get("id") || formData.get("ticket_id") || formData.get("userId") || formData.get("gameId") || null;
    const details: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      if (key !== "credentials" && key !== "password" && key !== "token") {
        details[key] = typeof value === "string" && value.length > 500 ? value.substring(0, 500) + "..." : value;
      }
    });

    await supabase.from("audit_logs").insert({
      admin_id: user.id,
      action,
      affected_entity: affectedEntity,
      entity_id: id ? String(id) : null,
      ip_address: ip,
      user_agent: userAgent,
      details,
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
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
  const customerName = order.customer_name || "Valued Customer";
  const fallbackTotal = items.reduce((sum, item) => sum + Number(item.price ?? 0) * item.quantity, 0);
  const total = Number(order.total_price ?? fallbackTotal).toLocaleString("en-IN");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app";

  const statusUpper = status.toUpperCase();
  let statusBadgeColor = "#70e000"; // NVIDIA neon green accent default
  if (statusUpper === "DELIVERED" || statusUpper === "COMPLETED") {
    statusBadgeColor = "#70e000";
  } else if (statusUpper === "REJECTED") {
    statusBadgeColor = "#ff4d4d";
  } else if (statusUpper === "VERIFIED" || statusUpper === "PROCESSING") {
    statusBadgeColor = "#facc15";
  }

  const itemRows = items.map((item) => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
      <td style="padding: 12px 8px; text-align: left; color: #ffffff; font-size: 13px; font-weight:700;">
        ⚡ ${item.title}
        <span style="display:block; font-size: 11px; color: #8991a6; font-weight: 500; margin-top:2px;">${item.platform || "PC Game"}</span>
      </td>
      <td style="padding: 12px 8px; text-align: center; color: #e4e4e7; font-size: 13px; font-weight:600;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right; color: #facc15; font-size: 13px; font-weight: 900;">Rs. ${(Number(item.price ?? 0) * item.quantity).toLocaleString("en-IN")}</td>
    </tr>
  `).join("");

  let actionText = "";
  if (statusUpper === "DELIVERED" || statusUpper === "COMPLETED") {
    actionText = `
      <div style="margin: 24px 0; padding: 20px; background: rgba(112, 224, 0, 0.08); border: 1px solid rgba(112, 224, 0, 0.3); border-radius: 10px; text-align: center;">
        <p style="margin: 0; color: #70e000; font-weight: 900; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">YOUR GAME IS READY IN YOUR LIBRARY!</p>
        <p style="margin: 8px 0 0; color: #e4e4e7; font-size: 13px; line-height: 1.6;">Open My Library in your customer dashboard to access your game activation details.</p>
      </div>
    `;
  } else if (statusUpper === "VERIFIED" || statusUpper === "PROCESSING") {
    actionText = `
      <div style="margin: 24px 0; padding: 20px; background: rgba(250, 204, 21, 0.08); border: 1px solid rgba(250, 204, 21, 0.3); border-radius: 10px; text-align: center;">
        <p style="margin: 0; color: #facc15; font-weight: 900; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">PAYMENT VERIFIED · PREPARING DELIVERY</p>
        <p style="margin: 8px 0 0; color: #e4e4e7; font-size: 13px; line-height: 1.6;">Our team is configuring your game access now. You will receive another notification when delivery is complete.</p>
      </div>
    `;
  } else if (statusUpper === "REJECTED") {
    actionText = `
      <div style="margin: 24px 0; padding: 20px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; text-align: center;">
        <p style="margin: 0; color: #ff4d4d; font-weight: 900; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">PAYMENT VERIFICATION NEEDED</p>
        <p style="margin: 8px 0 0; color: #e4e4e7; font-size: 13px; line-height: 1.6;">We could not verify your payment screenshot. Please contact support or upload a clearer receipt screenshot.</p>
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
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background-color:#0b0914;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#e4e4e7;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0914;padding:32px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;">
                
                <!-- BRAND LOGO HEADER -->
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <div style="background:#141029;border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:14px 28px;display:inline-block;box-shadow:0 8px 24px rgba(0,0,0,0.5);text-align:center;">
                      <span style="display:inline-block;padding:3px 10px;background:rgba(139,92,246,0.2);border-radius:4px;font-size:9px;font-weight:900;color:#c4b5fd;letter-spacing:2px;text-transform:uppercase;">⚡ RAKEXURA STORE</span>
                      <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">RAKEXURA</div>
                    </div>
                  </td>
                </tr>

                <!-- CARD 1: MAIN ORDER STATUS CARD (NVIDIA STYLE) -->
                <tr>
                  <td style="background:#141029;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:28px 24px;box-shadow:0 12px 36px rgba(0,0,0,0.6);">
                    <div style="text-align:center;margin-bottom:14px;">
                      <div style="font-size:18px;font-weight:900;color:${statusBadgeColor};letter-spacing:1px;text-transform:uppercase;">
                        ORDER ${statusUpper}
                      </div>
                      <div style="font-size:12px;color:#8991a6;font-weight:700;margin-top:4px;">Order Ref: ${reference}</div>
                    </div>

                    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:16px 0 20px 0;" />

                    <p style="margin:0 0 12px;font-size:15px;color:#ffffff;font-weight:bold;line-height:1.6;">Hi ${customerName},</p>
                    <p style="margin:0;font-size:13.5px;line-height:1.7;color:#d4d4d8;">${statusDesc}</p>

                    ${actionText}

                    <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#8991a6;margin:24px 0 10px 0;">🛒 ORDER DETAILS</div>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:10px;overflow:hidden;">
                      <thead>
                        <tr style="background:rgba(139,92,246,0.15);border-bottom:1px solid rgba(139,92,246,0.25);">
                          <th align="left" style="padding:10px 12px;font-size:10px;font-weight:900;color:#c4b5fd;text-transform:uppercase;letter-spacing:1px;" width="50%">Item</th>
                          <th align="center" style="padding:10px 12px;font-size:10px;font-weight:900;color:#c4b5fd;text-transform:uppercase;letter-spacing:1px;" width="25%">Qty</th>
                          <th align="right" style="padding:10px 12px;font-size:10px;font-weight:900;color:#c4b5fd;text-transform:uppercase;letter-spacing:1px;" width="25%">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemRows}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="2" style="padding:14px 12px 10px 12px;font-size:12px;color:#8991a6;font-weight:800;text-transform:uppercase;">TOTAL PAID</td>
                          <td style="padding:14px 12px 10px 12px;font-size:16px;color:#facc15;font-weight:900;text-align:right;">Rs. ${total}</td>
                        </tr>
                      </tfoot>
                    </table>

                    <div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;color:#8991a6;">
                      Thanks,<br />
                      <strong style="color:#ffffff;">Rakexura Customer Service</strong>
                    </div>
                  </td>
                </tr>

                <!-- CARD 2: GET PLAYING / HERO ACTION CARD (NVIDIA STYLE) -->
                <tr>
                  <td style="padding-top:16px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg, #1e173b, #120e24);border:1px solid rgba(139,92,246,0.3);border-radius:14px;padding:24px 20px;text-align:center;box-shadow:0 12px 36px rgba(0,0,0,0.5);">
                      <tr>
                        <td align="center">
                          <div style="font-size:15px;font-weight:900;color:#70e000;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">🎮 GET PLAYING</div>
                          <div style="font-size:12px;color:#a4abbc;font-weight:600;margin-bottom:16px;">Start Gaming with Your Library of PC Games</div>
                          <a href="${siteUrl}/dashboard/orders" style="display:inline-block;background:#70e000;color:#000000;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:900;font-size:12px;letter-spacing:1px;text-transform:uppercase;box-shadow:0 0 20px rgba(112,224,0,0.4);">
                            PLAY NOW
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CARD 3: QUICK NAVIGATION LINKS CARD (NVIDIA STYLE) -->
                <tr>
                  <td style="padding-top:16px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#141029;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px 20px;box-shadow:0 8px 24px rgba(0,0,0,0.4);">
                      <tr>
                        <td>
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center" width="25%" style="padding:4px;">
                                <a href="${siteUrl}/dashboard" style="color:#70e000;text-decoration:none;font-size:12px;font-weight:800;display:block;">
                                  👤 Account
                                </a>
                              </td>
                              <td align="center" width="25%" style="padding:4px;">
                                <a href="${siteUrl}/games" style="color:#70e000;text-decoration:none;font-size:12px;font-weight:800;display:block;">
                                  🎮 Catalog
                                </a>
                              </td>
                              <td align="center" width="25%" style="padding:4px;">
                                <a href="https://wa.me/918317416695" style="color:#70e000;text-decoration:none;font-size:12px;font-weight:800;display:block;">
                                  💬 Support
                                </a>
                              </td>
                              <td align="center" width="25%" style="padding:4px;">
                                <a href="${siteUrl}/track" style="color:#70e000;text-decoration:none;font-size:12px;font-weight:800;display:block;">
                                  ⚙️ Tracking
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CARD 4: FOOTER & LEGAL NOTICE (NVIDIA STYLE) -->
                <tr>
                  <td style="padding-top:24px;text-align:center;color:#71717a;font-size:11px;line-height:1.6;">
                    <p style="margin:0 0 6px 0;">You are receiving this email as an alert or update to your Rakexura Store service.</p>
                    <p style="margin:0 0 10px 0;">E-commerce services are provided by Rakexura Store, authorized PC game reseller.</p>
                    <div>
                      <a href="${siteUrl}/terms" style="color:#a1a1aa;text-decoration:none;margin:0 6px;">Terms of Use</a> |
                      <a href="${siteUrl}/privacy" style="color:#a1a1aa;text-decoration:none;margin:0 6px;">Privacy Policy</a> |
                      <a href="${siteUrl}/support" style="color:#a1a1aa;text-decoration:none;margin:0 6px;">Contact Us</a>
                    </div>
                    <p style="margin:10px 0 0 0;">&copy; 2026 Rakexura Store. All rights reserved.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
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
  await writeAuditLog("UPDATE_ORDER_STATUS", "orders", formData);
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
      const itemLines = items
        .map((item) => `${item.title}${item.platform ? ` (${item.platform})` : ""} x${item.quantity}`)
        .join(", ");
      const fallbackTotal = items.reduce((sum, item) => sum + Number(item.price ?? 0) * item.quantity, 0);
      const total = Number(order.total_price ?? fallbackTotal).toLocaleString("en-IN");
      
      let awardPoints = 100;
      const gameIds = items.map((i) => i.gameId).filter(Boolean) as number[];
      if (gameIds.length > 0) {
        const { data: dbGames } = await supabase
          .from("games")
          .select("is_subscription")
          .in("id", gameIds);
        if (dbGames?.some((g) => g.is_subscription)) {
          awardPoints = 200;
        }
      }

      notifMessage = `Your game has been successfully added to your library. +${awardPoints} Rank Points added to your profile! Invoice: ${itemLines} - Total Paid: Rs. ${total}`;
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

  const shouldSendEmail = ["Verified", "Processing", "Delivered", "Completed", "Rejected"].includes(status);

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

  return {
    status,
    message: `Order ${reference} marked as ${status}.`,
    customerEmailSent: emailSent,
    customerEmailError: emailError,
  };
}

export async function saveAccountAccess(formData: FormData) {
  await writeAuditLog("SAVE_ACCOUNT_ACCESS", "orders", formData);
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
  revalidateTag("deliveries");
  return { success: true };
}

export async function moderateReview(formData: FormData) {
  await writeAuditLog("MODERATE_REVIEW", "reviews", formData);
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const decision = String(formData.get("decision"));
  const { data: review } = await supabase.from("reviews").select("game_id, media_urls").eq("id", id).maybeSingle();
  const query = decision === "delete" ? supabase.from("reviews").delete().eq("id", id) : supabase.from("reviews").update({ approved: decision === "approve" }).eq("id", id);
  const { error } = await query;
  if (error) throw new Error(error.message);
  if (decision === "delete" && review && Array.isArray(review.media_urls) && review.media_urls.length) await supabase.storage.from("review-media").remove(review.media_urls);
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidateTag("reviews");
  revalidateTag("approved-reviews");
  if (review?.game_id) {
    revalidateTag(`game-reviews-${review.game_id}`);
  }
}

export async function updateRequestStatus(formData: FormData) {
  await writeAuditLog("UPDATE_REQUEST_STATUS", "game_requests", formData);
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
  await writeAuditLog("TOGGLE_COUPON", "coupons", formData);
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const active = String(formData.get("active")) === "true";
  const { error } = await supabase.from("coupons").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/coupons");
}

export async function archiveGame(formData: FormData) {
  await writeAuditLog("ARCHIVE_GAME", "games", formData);
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const archived = String(formData.get("archived")) === "true";
  const { error } = await supabase.from("games").update({ archived }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/games");
  revalidatePath("/games");
  revalidateTag("games");
  revalidateTag(`game-${id}`);
}

function optionalNumber(value: FormDataEntryValue | null) {
  if (value === null || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function saveGame(formData: FormData) {
  await writeAuditLog("SAVE_GAME", "games", formData);
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
    activation_slots: optionalNumber(formData.get("activation_slots")),
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
  revalidateTag("games");
  if (rawId) {
    revalidateTag(`game-${rawId}`);
  }
  redirect("/admin/games");
}

export async function saveCoupon(formData: FormData) {
  await writeAuditLog("SAVE_COUPON", "coupons", formData);
  const supabase = await getAdminClient();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discountType = String(formData.get("discount_type") ?? "percentage");
  const discountValue = optionalNumber(formData.get("discount_value"));
  if (!/^[A-Z0-9_-]{3,24}$/.test(code) || !discountValue || discountValue <= 0) throw new Error("Enter a valid coupon code and discount");
  if (!["percentage", "flat"].includes(discountType)) throw new Error("Invalid discount type");
  const payload = { 
    code, 
    discount_type: discountType, 
    discount_value: discountValue, 
    minimum_order: optionalNumber(formData.get("minimum_order")) ?? 0, 
    usage_limit: optionalNumber(formData.get("usage_limit")), 
    per_user_limit: optionalNumber(formData.get("per_user_limit")) ?? 1,
    expires_at: String(formData.get("expires_at") ?? "") || null 
  };
  const rawId = String(formData.get("id") ?? "");
  const query = rawId ? supabase.from("coupons").update(payload).eq("id", Number(rawId)) : supabase.from("coupons").insert({ ...payload, active: true });
  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function moderateProof(formData: FormData) {
  await writeAuditLog("MODERATE_PROOF", "customer_proofs", formData);
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const decision = String(formData.get("decision") ?? "");
  const query = decision === "delete" ? supabase.from("customer_proofs").delete().eq("id", id) : supabase.from("customer_proofs").update({ approved: decision === "approve" }).eq("id", id);
  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/admin/media");
  revalidatePath("/");
  revalidateTag("proofs");
}

export async function saveBundle(formData: FormData) {
  await writeAuditLog("SAVE_BUNDLE", "bundles", formData);
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
  revalidateTag("bundles");
  if (rawId) {
    revalidateTag(`bundle-${rawId}`);
  }
  redirect("/admin/bundles");
}

export async function toggleBundle(formData: FormData) {
  await writeAuditLog("TOGGLE_BUNDLE", "bundles", formData);
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const active = String(formData.get("active")) === "true";
  const { error } = await supabase.from("bundles").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bundles"); revalidatePath("/bundles"); revalidatePath("/");
  revalidateTag("bundles");
  revalidateTag(`bundle-${id}`);
}

export async function deleteBundle(formData: FormData) {
  await writeAuditLog("DELETE_BUNDLE", "bundles", formData);
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
  revalidateTag("bundles");
  revalidateTag(`bundle-${id}`);
}

export async function saveMarqueeMessage(formData: FormData) {
  await writeAuditLog("SAVE_MARQUEE_MESSAGE", "marquee_messages", formData);
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
  revalidateTag("marquee");
  revalidateTag("offers");
}

export async function updateMarqueeMessage(formData: FormData) {
  await writeAuditLog("UPDATE_MARQUEE_MESSAGE", "marquee_messages", formData);
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
  revalidateTag("marquee");
  revalidateTag("offers");
}

export async function saveStoreCategory(formData: FormData) {
  await writeAuditLog("SAVE_STORE_CATEGORY", "store_categories", formData);
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
  revalidateTag("categories");
}

export async function updateStoreCategory(formData: FormData) {
  await writeAuditLog("UPDATE_STORE_CATEGORY", "store_categories", formData);
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
  revalidateTag("categories");
}

export async function sendStoreAnnouncement(formData: FormData) {
  await writeAuditLog("SEND_ANNOUNCEMENT", "announcements", formData);
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
  await writeAuditLog("ADJUST_POINTS", "user_rewards", formData);
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
  await writeAuditLog("APPROVE_MILESTONE", "support_tickets", formData);
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

  // 1. Update ticket status to 'resolved' and append authorized code to message
  const { error: updateError } = await supabase
    .from("support_tickets")
    .update({
      status: "resolved",
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
  await writeAuditLog("SEND_PUSH_NOTIFICATION", "profiles", formData);
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
  await writeAuditLog("GIFT_GAME", "customer_library", formData);
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
  await writeAuditLog("SEND_PUSH_ENCOURAGEMENT", "notifications", new FormData());
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

export async function saveFlashSale(formData: FormData) {
  await writeAuditLog("SAVE_FLASH_SALE", "flash_sales", formData);
  const supabase = await getAdminClient();
  const rawId = String(formData.get("id") ?? "");
  const game_id = Number(formData.get("game_id"));
  const sale_price = Number(formData.get("sale_price"));
  const starts_at = String(formData.get("starts_at") ?? "");
  const ends_at = String(formData.get("ends_at") ?? "");
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (!game_id || isNaN(game_id)) throw new Error("Game is required");
  if (isNaN(sale_price) || sale_price < 0) throw new Error("Enter a valid sale price");
  if (!starts_at || !ends_at) throw new Error("Starts at and Ends at times are required");

  const payload = {
    game_id,
    sale_price,
    starts_at: new Date(starts_at).toISOString(),
    ends_at: new Date(ends_at).toISOString(),
    active,
  };

  const query = rawId 
    ? supabase.from("flash_sales").update(payload).eq("id", Number(rawId)) 
    : supabase.from("flash_sales").insert(payload);

  const { error } = await query;
  if (error) throw new Error(error.message);

  // Send push notification if set to active
  if (active) {
    try {
      const { data: game } = await supabase.from("games").select("title").eq("id", game_id).maybeSingle();
      const gameTitle = game?.title || "A hot title";
      const title = "🔥 Flash Sale Alert!";
      const message = `${gameTitle} is now on Flash Sale for only Rs. ${sale_price}! Get it before the timer ends.`;
      const link = `/games/${game_id}`;
      
      const { data: profiles } = await supabase.from("profiles").select("id");
      if (profiles && profiles.length > 0) {
        await supabase.from("notifications").insert(
          profiles.map(({ id }) => ({
            user_id: id,
            title,
            message,
            type: "promotion",
            link
          }))
        );
        
        Promise.allSettled(
          profiles.map(({ id }) => sendPushNotification(id, title, message, link))
        ).catch((err) => console.error("Push delivery error:", err));
      }
    } catch (err) {
      console.error("Failed to send flash sale push updates:", err);
    }
  }

  revalidatePath("/admin/flash-sales");
  revalidatePath("/");
  revalidateTag("games");
  redirect("/admin/flash-sales");
}

export async function toggleFlashSale(formData: FormData) {
  await writeAuditLog("TOGGLE_FLASH_SALE", "flash_sales", formData);
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const active = String(formData.get("active")) === "true";

  const { error } = await supabase
    .from("flash_sales")
    .update({ active })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Send push notification if toggled to active
  if (active) {
    try {
      const { data: sale } = await supabase
        .from("flash_sales")
        .select("game_id, sale_price, games(title)")
        .eq("id", id)
        .maybeSingle();
        
      if (sale) {
        const gameTitle = (sale.games as unknown as { title?: string })?.title || "A hot title";
        const title = "🔥 Flash Sale Alert!";
        const message = `${gameTitle} is now on Flash Sale for only Rs. ${sale.sale_price}! Get it before the timer ends.`;
        const link = `/games/${sale.game_id}`;
        
        const { data: profiles } = await supabase.from("profiles").select("id");
        if (profiles && profiles.length > 0) {
          await supabase.from("notifications").insert(
            profiles.map(({ id }) => ({
              user_id: id,
              title,
              message,
              type: "promotion",
              link
            }))
          );
          
          Promise.allSettled(
            profiles.map(({ id }) => sendPushNotification(id, title, message, link))
          ).catch((err) => console.error("Push delivery error:", err));
        }
      }
    } catch (err) {
      console.error("Failed to send toggle flash sale push updates:", err);
    }
  }

  revalidatePath("/admin/flash-sales");
  revalidatePath("/");
  revalidateTag("games");
}

export async function deleteFlashSale(formData: FormData) {
  await writeAuditLog("DELETE_FLASH_SALE", "flash_sales", formData);
  const supabase = await getAdminClient();
  const id = idFrom(formData);

  const { error } = await supabase
    .from("flash_sales")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/flash-sales");
  revalidatePath("/");
  revalidateTag("games");
}

export async function saveCampaign(formData: FormData) {
  await writeAuditLog("SAVE_CAMPAIGN", "campaigns", formData);
  const supabase = await getAdminClient();
  const rawId = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const slug = String(formData.get("slug") ?? "").toLowerCase().trim();
  const starts_at = String(formData.get("starts_at") ?? "");
  const ends_at = String(formData.get("ends_at") ?? "");
  const theme_color = String(formData.get("theme_color") ?? "#facc15");
  const banner_image = String(formData.get("banner_image") ?? "");
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (!name) throw new Error("Name is required");
  if (!slug) throw new Error("Slug is required");
  if (!starts_at || !ends_at) throw new Error("Starts at and Ends at times are required");

  const payload = {
    name,
    slug,
    starts_at: new Date(starts_at).toISOString(),
    ends_at: new Date(ends_at).toISOString(),
    theme_color,
    banner_image: banner_image || null,
    active,
  };

  const query = rawId 
    ? supabase.from("campaigns").update(payload).eq("id", Number(rawId)) 
    : supabase.from("campaigns").insert(payload);

  const { error } = await query;
  if (error) throw new Error(error.message);

  revalidatePath("/admin/campaigns");
  revalidatePath(`/sale/${slug}`);
  revalidatePath("/");
  revalidateTag("campaigns");
}

export async function toggleCampaign(formData: FormData) {
  await writeAuditLog("TOGGLE_CAMPAIGN", "campaigns", formData);
  const supabase = await getAdminClient();
  const id = idFrom(formData);
  const active = String(formData.get("active")) === "true";

  const { error } = await supabase
    .from("campaigns")
    .update({ active })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/campaigns");
  revalidatePath("/");
  revalidateTag("campaigns");
}

export async function deleteCampaign(formData: FormData) {
  await writeAuditLog("DELETE_CAMPAIGN", "campaigns", formData);
  const supabase = await getAdminClient();
  const id = idFrom(formData);

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/campaigns");
  revalidatePath("/");
  revalidateTag("campaigns");
}

export async function saveCampaignGame(formData: FormData) {
  await writeAuditLog("SAVE_CAMPAIGN_GAME", "campaign_games", formData);
  const supabase = await getAdminClient();
  const rawId = String(formData.get("id") ?? "");
  const campaign_id = Number(formData.get("campaign_id"));
  const game_id = Number(formData.get("game_id"));
  const campaign_price = Number(formData.get("campaign_price"));
  const stock_limit = formData.get("stock_limit") ? Number(formData.get("stock_limit")) : null;

  if (!campaign_id) throw new Error("Campaign is required");
  if (!game_id) throw new Error("Game is required");
  if (isNaN(campaign_price) || campaign_price < 0) throw new Error("Enter a valid campaign price");

  const payload = {
    campaign_id,
    game_id,
    campaign_price,
    stock_limit,
  };

  const query = rawId 
    ? supabase.from("campaign_games").update(payload).eq("id", Number(rawId)) 
    : supabase.from("campaign_games").insert(payload);

  const { error } = await query;
  if (error) throw new Error(error.message);

  revalidatePath("/admin/campaign-games");
  revalidatePath("/");
  revalidateTag("games");
  revalidateTag("campaigns");
}

export async function toggleCampaignGame() {
  revalidatePath("/admin/campaign-games");
}

export async function deleteCampaignGame(formData: FormData) {
  await writeAuditLog("DELETE_CAMPAIGN_GAME", "campaign_games", formData);
  const supabase = await getAdminClient();
  const id = idFrom(formData);

  const { error } = await supabase
    .from("campaign_games")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/campaign-games");
  revalidatePath("/");
  revalidateTag("games");
  revalidateTag("campaigns");
}

export async function deleteCustomerAccount(formData: FormData) {
  await writeAuditLog("DELETE_CUSTOMER_ACCOUNT", "profiles", formData);
  const supabase = await getAdminClient();
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) throw new Error("Invalid customer ID");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role === "admin") {
    throw new Error("Administrator profiles cannot be deleted");
  }

  // Clean up all related records to avoid foreign key blocks
  await Promise.allSettled([
    supabase.from("visitor_logs").delete().eq("user_id", userId),
    supabase.from("notifications").delete().eq("user_id", userId),
    supabase.from("cart_items").delete().eq("user_id", userId),
    supabase.from("cart_bundles").delete().eq("user_id", userId),
    supabase.from("wishlist").delete().eq("user_id", userId),
    supabase.from("support_tickets").delete().eq("user_id", userId),
    supabase.from("game_requests").delete().eq("user_id", userId),
    supabase.from("reviews").delete().eq("user_id", userId),
    supabase.from("user_milestones").delete().eq("user_id", userId),
    supabase.from("points_history").delete().eq("user_id", userId),
    supabase.from("reward_claims").delete().eq("user_id", userId),
    supabase.from("web_push_subscriptions").delete().eq("user_id", userId),
  ]);

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    try {
      const { createClient: createAdmin } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cwvfgxdhearouclomjeq.supabase.co";
      const adminAuthClient = createAdmin(supabaseUrl, serviceKey);
      await adminAuthClient.auth.admin.deleteUser(userId);
    } catch {
      // Fallback to profile deletion if auth admin service role is unavailable
    }
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/customers");
  revalidatePath("/admin");
}

export async function updateSupportTicketStatus(formData: FormData) {
  await writeAuditLog("UPDATE_SUPPORT_TICKET_STATUS", "support_tickets", formData);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const ticketId = Number(formData.get("ticket_id"));
  const newStatus = String(formData.get("status") ?? "").trim().toLowerCase();

  if (!ticketId || !newStatus) throw new Error("Ticket ID and status are required");

  const { data: ticket, error: fetchErr } = await supabase
    .from("support_tickets")
    .select("id, user_id, subject, status")
    .eq("id", ticketId)
    .single();

  if (fetchErr || !ticket) throw new Error("Support ticket not found");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";
  if (!isAdmin) {
    throw new Error("Only Rakexura staff members can modify ticket status.");
  }

  const { error: updateErr } = await supabase
    .from("support_tickets")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (updateErr) throw new Error(updateErr.message);

  // Send intimation notifications to customer when resolved or closed
  if ((newStatus === "resolved" || newStatus === "closed" || newStatus === "approved") && isAdmin) {
    const notifTitle = newStatus === "resolved" ? "Support Ticket Resolved!" : newStatus === "closed" ? "Support Ticket Closed" : "Support Ticket Approved!";
    const notifMsg = `Your support ticket #${ticket.id} ("${ticket.subject}") has been marked as ${newStatus} by Rakexura Support.`;
    const notifLink = `/dashboard/support/${ticket.id}`;

    // 1. In-App Notification
    await supabase.from("notifications").insert({
      user_id: ticket.user_id,
      title: notifTitle,
      message: notifMsg,
      type: "support",
      link: notifLink,
    });

    // 2. Web Push Notification
    void sendPushNotification(ticket.user_id, notifTitle, notifMsg, notifLink);

    // 3. Email Intimation
    const { data: customerProfile } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", ticket.user_id)
      .maybeSingle();

    if (customerProfile?.email && customerProfile.email.includes("@")) {
      void sendEmail({
        to: customerProfile.email,
        subject: `[Rakexura Support] Ticket #${ticket.id} Resolved`,
        text: `Hi ${customerProfile.display_name || "Customer"},\n\nYour support ticket #${ticket.id} ("${ticket.subject}") has been resolved by Rakexura Staff.\n\nYou can view the ticket details and full conversation at:\n${process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app"}/dashboard/support/${ticket.id}\n\nThank you for choosing Rakexura Store!`,
      });
    }
  }

  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath("/dashboard/support");
  revalidatePath("/admin/support");
}
