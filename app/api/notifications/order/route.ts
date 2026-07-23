import { rateLimiter } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { runBackgroundJob } from "@/lib/security/queue";

export const runtime = "nodejs";

type OrderNoticeItem = {
  title?: string;
  platform?: string;
  quantity?: number;
  price?: number;
};

type OrderNotice = {
  reference?: string;
  customerName?: string;
  customerWhatsApp?: string;
  customerEmail?: string;
  total?: number;
  items?: OrderNoticeItem[];
  userId?: string;
};

function price(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-IN");
}

function orderTotal(order: OrderNotice) {
  const directTotal = Number(order.total ?? 0);
  if (directTotal > 0) return directTotal;

  return (order.items ?? []).reduce((sum, item) => {
    const quantity = Number(item.quantity ?? 1);
    const itemPrice = Number(item.price ?? 0);
    return sum + quantity * itemPrice;
  }, 0);
}

function makeOwnerMessage(order: OrderNotice) {
  const items = order.items?.length
    ? order.items.map((item) => {
        const title = item.title ?? "Game";
        const platform = item.platform ? ` (${item.platform})` : "";
        const quantity = item.quantity ?? 1;
        const itemPrice = Number(item.price ?? 0);
        return `- ${title}${platform} x${quantity}${itemPrice ? ` - Rs. ${price(itemPrice)}` : ""}`;
      })
    : ["- Order item"];

  return [
    `New Rakexura order ${order.reference ?? ""}`.trim(),
    `Customer: ${order.customerName ?? "Customer"}`,
    order.customerEmail ? `Email: ${order.customerEmail}` : "",
    order.customerWhatsApp ? `WhatsApp: ${order.customerWhatsApp}` : "",
    `Amount: Rs. ${price(orderTotal(order))}`,
    "",
    "Items:",
    ...items,
    "",
    "Payment proof uploaded. Please verify and deliver from the admin panel.",
  ]
    .filter(Boolean)
    .join("\n");
}

function makeCustomerInvoiceMessage(order: OrderNotice) {
  const items = order.items?.length
    ? order.items.map((item) => {
        const title = item.title ?? "Game";
        const platform = item.platform ? ` (${item.platform})` : "";
        const quantity = item.quantity ?? 1;
        const itemPrice = Number(item.price ?? 0);
        return `- ${title}${platform} x${quantity}${itemPrice ? ` - Rs. ${price(itemPrice)}` : ""}`;
      })
    : ["- Order item"];

  return [
    `Thank you for your order at Rakexura Store!`,
    "",
    `Order Reference: ${order.reference ?? ""}`.trim(),
    `Customer Name: ${order.customerName ?? "Customer"}`,
    `Amount Paid: Rs. ${price(orderTotal(order))}`,
    "",
    "Items Purchased:",
    ...items,
    "",
    "Your payment proof has been received and is under review. Our team will verify it shortly and send your activation details via WhatsApp.",
    "If you have any questions, feel free to contact us on WhatsApp.",
  ]
    .filter(Boolean)
    .join("\n");
}

function makeEpicReceiptHtml({ order, isAdmin }: { order: OrderNotice; isAdmin: boolean }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app";
  const orderRef = order.reference || "RKX-PENDING";
  const customerName = order.customerName || "Valued Customer";
  const customerEmail = order.customerEmail || "";
  const customerWhatsApp = order.customerWhatsApp || "";
  const total = orderTotal(order);
  const dateStr = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const lineItemsHtml = (order.items && order.items.length > 0)
    ? order.items.map((item, idx) => {
        const title = item.title || "PC Game";
        const platform = item.platform || "Steam";
        const qty = item.quantity || 1;
        const itemPrice = Number(item.price || 0);
        const itemTotal = itemPrice * qty;
        const priceDisplay = itemTotal === 0 ? '<span style="color:#00d68f;font-weight:900;">FREE</span>' : `₹${itemTotal.toLocaleString('en-IN')}`;
        
        return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.06);background:${idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'};">
            <td style="padding:12px 14px;font-size:13px;font-weight:800;color:#ffffff;" width="50%">
              ⚡ ${title}
            </td>
            <td align="center" style="padding:12px 14px;font-size:11px;font-weight:800;color:#a4abbc;text-transform:uppercase;" width="25%">
              ${platform} · Qty: ${qty}
            </td>
            <td align="right" style="padding:12px 14px;font-size:13px;font-weight:900;color:#ffffff;" width="25%">
              ${priceDisplay}
            </td>
          </tr>
        `;
      }).join("")
    : `
      <tr>
        <td colspan="3" style="padding:16px;font-size:13px;color:#ffffff;text-align:center;">
          PC Game Order Item
        </td>
      </tr>
    `;

  const actionUrl = isAdmin
    ? `${siteUrl}/admin/orders`
    : `${siteUrl}/track-order?order=${encodeURIComponent(orderRef)}&phone=${encodeURIComponent(customerWhatsApp.replace(/\D/g, ""))}`;
  
  const actionLabel = isAdmin ? "🚀 Open Admin Dashboard" : "🔑 View Account Details & Track Order";
  const badgeTitle = isAdmin ? "NEW STORE ORDER" : "ORDER CONFIRMATION";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background-color:#07050e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#e4e4e7;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#07050e;padding:32px 8px;">
          <tr>
            <td align="center">
              <!-- Epic Main Receipt Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#0e0a1f;border:1px solid rgba(139,92,246,0.3);border-radius:16px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.75);">
                
                <!-- Header Banner -->
                <tr>
                  <td style="background:linear-gradient(135deg, #1b1236, #0e0a1f);padding:32px 24px;border-bottom:1px solid rgba(139,92,246,0.2);text-align:center;">
                    <span style="display:inline-block;padding:5px 14px;background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);border-radius:20px;font-size:10px;font-weight:900;color:#c4b5fd;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">
                      ⚡ ${badgeTitle}
                    </span>
                    <h1 style="margin:0;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">
                      RAKEXURA STORE
                    </h1>
                    <div style="font-size:11px;color:#8991a6;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">
                      PREMIUM PC GAME STORE
                    </div>
                  </td>
                </tr>

                <!-- Reference Header Box -->
                <tr>
                  <td style="padding:28px 24px 12px 24px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg, rgba(139,92,246,0.15), rgba(124,58,237,0.08));border:1px solid rgba(139,92,246,0.35);border-radius:12px;padding:16px 20px;">
                      <tr>
                        <td align="left" style="vertical-align:middle;">
                          <span style="color:#aeb5c6;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;display:block;margin-bottom:4px;">
                            ORDER REFERENCE
                          </span>
                          <span style="font-family:monospace,Consolas,Courier,monospace;font-size:19px;font-weight:900;color:#facc15;letter-spacing:1px;">
                            ${orderRef}
                          </span>
                        </td>
                        <td align="right" style="vertical-align:middle;">
                          <span style="display:inline-block;background:#00d68f;color:#000000;padding:5px 12px;border-radius:6px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;">
                            ${total === 0 ? "FREE ORDER" : "PAID RECEIPT"}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Billed To Details Table -->
                <tr>
                  <td style="padding:16px 24px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;color:#8991a6;font-weight:700;" align="left" width="40%">Customer Billed To</td>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#ffffff;font-weight:800;" align="right" width="60%">${customerName}</td>
                      </tr>
                      ${customerEmail ? `
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;color:#8991a6;font-weight:700;" align="left" width="40%">Email Address</td>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#c4b5fd;font-weight:700;" align="right" width="60%">
                          <a href="mailto:${customerEmail}" style="color:#c4b5fd;text-decoration:none;">${customerEmail}</a>
                        </td>
                      </tr>` : ''}
                      ${customerWhatsApp ? `
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;color:#8991a6;font-weight:700;" align="left" width="40%">WhatsApp Contact</td>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#00d68f;font-weight:700;" align="right" width="60%">
                          <a href="https://wa.me/${customerWhatsApp.replace(/\D/g, "")}" style="color:#00d68f;text-decoration:none;">📱 +${customerWhatsApp}</a>
                        </td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;color:#8991a6;font-weight:700;" align="left" width="40%">Date & Time</td>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;color:#ffffff;font-weight:600;" align="right" width="60%">${dateStr} IST</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Epic Line Items Table -->
                <tr>
                  <td style="padding:16px 24px;">
                    <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:#b9a4ff;margin-bottom:10px;">
                      🛒 PURCHASED ITEMS
                    </div>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:10px;overflow:hidden;">
                      <thead>
                        <tr style="background:rgba(139,92,246,0.15);border-bottom:1px solid rgba(139,92,246,0.25);">
                          <th align="left" style="padding:10px 14px;font-size:10px;font-weight:900;color:#c4b5fd;text-transform:uppercase;letter-spacing:1px;" width="50%">Item</th>
                          <th align="center" style="padding:10px 14px;font-size:10px;font-weight:900;color:#c4b5fd;text-transform:uppercase;letter-spacing:1px;" width="25%">Platform / Qty</th>
                          <th align="right" style="padding:10px 14px;font-size:10px;font-weight:900;color:#c4b5fd;text-transform:uppercase;letter-spacing:1px;" width="25%">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${lineItemsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Total Paid Box -->
                <tr>
                  <td style="padding:12px 24px 28px 24px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="right">
                          <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="min-width:200px;">
                            <tr>
                              <td style="padding:8px 0;font-size:13px;color:#8991a6;font-weight:800;" align="left">TOTAL PAID:</td>
                              <td style="padding:8px 0;font-size:20px;color:#facc15;font-weight:900;text-align:right;" align="right">
                                ${total === 0 ? '<span style="color:#00d68f;font-weight:900;">₹0 (FREE)</span>' : `₹${total.toLocaleString('en-IN')}`}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Action Button CTA -->
                    <div style="margin-top:28px;text-align:center;">
                      <a href="${actionUrl}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:900;font-size:13px;letter-spacing:0.5px;box-shadow:0 4px 20px rgba(139,92,246,0.4);">
                        ${actionLabel} &rarr;
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#080612;padding:24px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);color:#646b7b;font-size:11px;line-height:1.6;">
                    <p style="margin:0;font-weight:700;color:#a4abbc;">Rakexura Store · Official Purchase Receipt</p>
                    <p style="margin:4px 0 0;">Need activation help or instant support? Contact us on WhatsApp.</p>
                    <div style="margin-top:12px;">
                      <a href="${siteUrl}" style="color:#8b5cf6;text-decoration:none;font-weight:bold;margin:0 8px;">Website</a> •
                      <a href="https://wa.me/918317416695" style="color:#00d68f;text-decoration:none;font-weight:bold;margin:0 8px;">WhatsApp Support</a>
                    </div>
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

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const rateLimitKey = "rate-limit:notifications-order:" + ip;
    const limitRes = await rateLimiter.limit(rateLimitKey, 5, 60);
    if (!limitRes.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limitRes.reset - Math.floor(Date.now() / 1000))) } }
      );
    }

    const order = (await request.json().catch(() => ({}))) as OrderNotice;
    const message = makeOwnerMessage(order);

    runBackgroundJob(async () => {
      // 1. Send notification email to the owner with Epic Games style HTML receipt
      // 1. Send notification email to the owner with Epic Games style HTML receipt
      const ownerEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL || "12k21rakeshkannam@gmail.com";
      try {
        await sendEmail({
          to: ownerEmail,
          subject: `New Rakexura order ${order.reference ?? ""}`.trim(),
          text: message,
          html: makeEpicReceiptHtml({ order, isAdmin: true }),
        });
      } catch (err) {
        console.error("Failed to send owner notification email:", err);
      }

      // 2. Send invoice email to the customer with Epic Games style HTML receipt
      if (order.customerEmail) {
        try {
          const customerMessage = makeCustomerInvoiceMessage(order);
          await sendEmail({
            to: order.customerEmail,
            subject: `Rakexura Store Receipt - Order ${order.reference ?? ""}`.trim(),
            text: customerMessage,
            html: makeEpicReceiptHtml({ order, isAdmin: false }),
          });
        } catch (custEmailError) {
          console.error("Failed to send invoice email to customer:", custEmailError);
        }
      }

      // 2.5 Also send push notification and database notification as customer invoice fallback
      if (order.userId) {
        try {
          const supabase = await createClient();
          const customerMessage = makeCustomerInvoiceMessage(order);
          const title = `Order Placed: ${order.reference ?? ""}`;
          
          await supabase.from("notifications").insert({
            user_id: order.userId,
            title: title,
            message: customerMessage,
            type: "order",
            link: "/dashboard/orders",
          });

          await sendPushNotification(order.userId, title, customerMessage, "/dashboard/orders");
        } catch (custPushError) {
          console.error("Failed to send customer push invoice:", custPushError);
        }
      }

      // 3. Send WhatsApp (SMS) notifications
      try {
        const ownerWhatsApp = process.env.OWNER_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
        if (ownerWhatsApp) {
          const itemsList = order.items?.map(i => `${i.title} (${i.platform || 'Steam'}) x${i.quantity ?? 1}`).join(', ') || 'Game';
          const text = `🛒 *New Rakexura Order Received!*\n\n` +
            `• *Reference:* ${order.reference ?? "N/A"}\n` +
            `• *Customer:* ${order.customerName ?? "Customer"}\n` +
            `• *WhatsApp:* ${order.customerWhatsApp ?? "N/A"}\n` +
            `• *Email:* ${order.customerEmail ?? "N/A"}\n` +
            `• *Total:* Rs. ${price(orderTotal(order))}\n` +
            `• *Items:* ${itemsList}\n\n` +
            `Please verify the payment proof and deliver from the admin dashboard.`;
          await sendWhatsAppText(ownerWhatsApp, text);
        }
      } catch (waOwnerError) {
        console.error("Failed to send WhatsApp notification to owner:", waOwnerError);
      }

      try {
        if (order.customerWhatsApp) {
          const text = `Hello ${order.customerName ?? 'Customer'},\n\n` +
            `Thank you for ordering with *Rakexura Store*! 🎮\n\n` +
            `• *Order Reference:* ${order.reference ?? "N/A"}\n` +
            `• *Total Amount:* Rs. ${price(orderTotal(order))}\n\n` +
            `We have received your payment proof. Our team is verifying it right now. Once verified, your activation details will be delivered directly here!\n\n` +
            `Have a great day!`;
          await sendWhatsAppText(order.customerWhatsApp, text);
        }
      } catch (waCustError) {
        console.error("Failed to send WhatsApp notification to customer:", waCustError);
      }

      // 4. Send database in-app & push notification to admins
      try {
        const supabase = await createClient();
        const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
        if (admins && admins.length > 0) {
          const adminNotifs = admins.map((admin) => ({
            user_id: admin.id,
            title: `New Order Placed`,
            message: `Order ${order.reference ?? ""} placed by ${order.customerName ?? "Customer"} for Rs. ${Number(orderTotal(order)).toLocaleString("en-IN")}.`,
            type: "order",
            link: `/admin/orders`,
          }));
          await supabase.from("notifications").insert(adminNotifs);
          await Promise.all(
            adminNotifs.map((n) => sendPushNotification(n.user_id, n.title, n.message, n.link))
          );
        }
      } catch (dbError) {
        console.error("Failed to insert admin order notification into Supabase:", dbError);
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ok: true
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in order notification route:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: "ORDER_NOTIFICATION_FAILED"
        }
      },
      { status: 500 }
    );
  }
}
