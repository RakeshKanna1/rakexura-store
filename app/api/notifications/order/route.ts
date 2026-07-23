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
  const customerName = order.customerName || "Customer";
  const customerEmail = order.customerEmail || "Not provided";
  const customerWhatsApp = order.customerWhatsApp || "Not provided";
  const total = orderTotal(order);
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const actionUrl = isAdmin
    ? `${siteUrl}/admin/orders`
    : `${siteUrl}/track-order?order=${encodeURIComponent(orderRef)}&phone=${encodeURIComponent(customerWhatsApp.replace(/\D/g, ""))}`;

  const lineItemsHtml = (order.items && order.items.length > 0)
    ? order.items.map((item) => {
        const title = item.title || "PC Game";
        const platform = item.platform || "Rakexura Games";
        const qty = item.quantity || 1;
        const itemPrice = Number(item.price || 0);
        const itemTotal = itemPrice * qty;
        const priceDisplay = `₹${itemTotal.toLocaleString('en-IN')}.00 INR`;

        return `
          <tr style="border-bottom:1px solid #e5e5e5;">
            <td style="padding:14px 12px;font-size:13px;font-weight:700;color:#121212;font-family:'Outfit','Plus Jakarta Sans',sans-serif;" width="50%">
              ${title}
            </td>
            <td style="padding:14px 12px;font-size:12px;color:#555555;font-family:'Plus Jakarta Sans',sans-serif;" width="25%">
              ${platform} ${qty > 1 ? `(Qty: ${qty})` : ''}
            </td>
            <td align="right" style="padding:14px 12px;font-size:13px;font-weight:700;color:#121212;font-family:'Outfit',monospace;" width="25%">
              ${priceDisplay}
            </td>
          </tr>
        `;
      }).join("")
    : `
      <tr style="border-bottom:1px solid #e5e5e5;">
        <td style="padding:14px 12px;font-size:13px;font-weight:700;color:#121212;font-family:'Outfit',sans-serif;">PC Game Order Item</td>
        <td style="padding:14px 12px;font-size:12px;color:#555555;font-family:'Plus Jakarta Sans',sans-serif;">Rakexura Games</td>
        <td align="right" style="padding:14px 12px;font-size:13px;font-weight:700;color:#121212;font-family:'Outfit',monospace;">₹${total.toLocaleString('en-IN')}.00 INR</td>
      </tr>
    `;

  if (isAdmin) {
    // =========================================================================
    // OWNER ADMIN ALERT EMAIL TEMPLATE (NO "Thank You.")
    // =========================================================================
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet" />
          <style>
            body, table, td, p, a, h1, div, span, strong {
              font-family: 'Outfit', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            }
          </style>
        </head>
        <body style="margin:0;padding:0;background-color:#ffffff;font-family:'Outfit','Plus Jakarta Sans',-apple-system,sans-serif;color:#121212;-webkit-font-smoothing:antialiased;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;padding:40px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;text-align:center;">

                  <!-- Top RX Metallic Silver Shield Badge Only -->
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <img src="cid:rakexuraSilverBadge" alt="Rakexura Shield Badge" width="46" height="55" style="display:block;margin:0 auto;border:0;" />
                    </td>
                  </tr>

                  <!-- Owner Admin Headline: NEW ORDER RECEIVED! -->
                  <tr>
                    <td align="center" style="padding-bottom:16px;">
                      <h1 style="margin:0;font-size:36px;font-weight:900;color:#000000;letter-spacing:-0.5px;line-height:1.1;font-family:'Outfit',sans-serif;">
                        New Order Received!
                      </h1>
                    </td>
                  </tr>

                  <!-- Subhead -->
                  <tr>
                    <td align="center" style="padding-bottom:28px;font-size:14px;color:#333333;line-height:1.5;font-family:'Plus Jakarta Sans',sans-serif;">
                      A new order payment proof has been uploaded by <strong style="color:#000000;">${customerName}</strong>. Please verify and fulfill from the admin panel.
                    </td>
                  </tr>

                  <!-- ORDER REFERENCE ID BLOCK -->
                  <tr>
                    <td align="center" style="padding-bottom:30px;">
                      <div style="font-size:12px;font-weight:900;color:#727272;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;font-family:'Outfit',sans-serif;">
                        ORDER REFERENCE:
                      </div>
                      <div style="font-size:28px;font-weight:900;color:#000000;letter-spacing:1px;font-family:'Outfit',Consolas,monospace;">
                        ${orderRef}
                      </div>
                    </td>
                  </tr>

                  <!-- CUSTOMER INFORMATION -->
                  <tr>
                    <td align="left" style="padding-bottom:24px;">
                      <div style="font-size:11px;font-weight:900;color:#727272;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e5e5e5;margin-bottom:16px;font-family:'Outfit',sans-serif;">
                        CUSTOMER INFORMATION:
                      </div>
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;color:#121212;font-family:'Plus Jakarta Sans',sans-serif;">
                        <tr>
                          <td width="50%" style="padding:6px 0;vertical-align:top;">
                            <strong style="display:block;color:#000000;font-family:'Outfit',sans-serif;">Customer Name:</strong>
                            <span style="color:#555555;">${customerName}</span>
                          </td>
                          <td width="50%" style="padding:6px 0;vertical-align:top;">
                            <strong style="display:block;color:#000000;font-family:'Outfit',sans-serif;">Customer Email:</strong>
                            <a href="mailto:${customerEmail}" style="color:#0066cc;text-decoration:none;font-weight:700;">${customerEmail}</a>
                          </td>
                        </tr>
                        <tr>
                          <td width="50%" style="padding:6px 0;vertical-align:top;">
                            <strong style="display:block;color:#000000;font-family:'Outfit',sans-serif;">WhatsApp Phone:</strong>
                            <a href="https://wa.me/${customerWhatsApp.replace(/\D/g, "")}" style="color:#0066cc;text-decoration:none;font-weight:700;">${customerWhatsApp}</a>
                          </td>
                          <td width="50%" style="padding:6px 0;vertical-align:top;">
                            <strong style="display:block;color:#000000;font-family:'Outfit',sans-serif;">Order Date:</strong>
                            <span style="color:#555555;">${dateStr}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- ORDERED ITEMS TABLE -->
                  <tr>
                    <td align="left" style="padding-bottom:28px;">
                      <div style="font-size:11px;font-weight:900;color:#727272;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e5e5e5;margin-bottom:16px;font-family:'Outfit',sans-serif;">
                        ORDERED ITEMS:
                      </div>

                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;">
                        <thead>
                          <tr style="background:#f2f2f2;">
                            <th align="left" style="padding:10px 12px;font-size:11px;font-weight:900;color:#000000;text-transform:uppercase;font-family:'Outfit',sans-serif;" width="50%">Description</th>
                            <th align="left" style="padding:10px 12px;font-size:11px;font-weight:900;color:#000000;text-transform:uppercase;font-family:'Outfit',sans-serif;" width="25%">Publisher</th>
                            <th align="right" style="padding:10px 12px;font-size:11px;font-weight:900;color:#000000;text-transform:uppercase;font-family:'Outfit',sans-serif;" width="25%">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${lineItemsHtml}
                        </tbody>
                      </table>

                      <div style="border-top:1px solid #e5e5e5;margin-top:16px;padding-top:14px;text-align:right;">
                        <span style="font-size:12px;font-weight:900;color:#727272;letter-spacing:1px;text-transform:uppercase;margin-right:16px;font-family:'Outfit',sans-serif;">TOTAL COLLECTED:</span>
                        <span style="font-size:18px;font-weight:900;color:#000000;font-family:'Outfit',monospace;">₹${total.toLocaleString('en-IN')}.00 INR</span>
                      </div>
                    </td>
                  </tr>

                  <!-- ADMIN ACTION BUTTON CTA -->
                  <tr>
                    <td align="center" style="padding:24px 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;">
                      <div style="margin-bottom:12px;">
                        <a href="${actionUrl}" style="display:inline-block;background-color:#000000;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-family:'Outfit',sans-serif;">
                          Open Admin Dashboard &rarr;
                        </a>
                      </div>
                      <p style="margin:0;font-size:12px;color:#727272;font-family:'Plus Jakarta Sans',sans-serif;">Click to verify payment proof and release activation keys.</p>
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td align="center" style="padding-top:24px;font-size:11px;color:#727272;line-height:1.6;font-family:'Plus Jakarta Sans',sans-serif;">
                      <div style="font-weight:700;color:#000000;margin-bottom:4px;font-family:'Outfit',sans-serif;">Rakexura Store Admin Operations</div>
                      <div style="margin-bottom:16px;">Automated Admin Notification System</div>

                      <div style="margin-bottom:16px;">
                        <img src="cid:rakexuraSilverBadge" alt="Rakexura Shield Badge" width="34" height="41" style="display:block;margin:0 auto;border:0;" />
                      </div>

                      <div style="font-size:10px;color:#999999;">
                        © 2026 Rakexura Store. All rights reserved. Confidential internal notification for store owner only.
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

  // =========================================================================
  // CUSTOMER RECEIPT EMAIL TEMPLATE (WITH "Thank You.")
  // =========================================================================
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <!-- Google Fonts: Outfit & Plus Jakarta Sans -->
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet" />
        <style>
          body, table, td, p, a, h1, div, span, strong {
            font-family: 'Outfit', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background-color:#ffffff;font-family:'Outfit','Plus Jakarta Sans',-apple-system,sans-serif;color:#121212;-webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;padding:40px 15px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;text-align:center;">

                <!-- Top RX Metallic Silver Shield Badge Only -->
                <tr>
                  <td align="center" style="padding-bottom:30px;">
                    <img src="cid:rakexuraSilverBadge" alt="Rakexura Shield Badge" width="46" height="55" style="display:block;margin:0 auto;border:0;" />
                  </td>
                </tr>

                <!-- Thank You Headline -->
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <h1 style="margin:0;font-size:38px;font-weight:900;color:#000000;letter-spacing:-0.5px;line-height:1.1;font-family:'Outfit',sans-serif;">
                      Thank You.
                    </h1>
                  </td>
                </tr>

                <!-- Greeting Subhead -->
                <tr>
                  <td align="center" style="padding-bottom:30px;font-size:14px;color:#333333;line-height:1.5;font-family:'Plus Jakarta Sans',sans-serif;">
                    <strong style="font-size:15px;color:#000000;display:block;margin-bottom:4px;font-family:'Outfit',sans-serif;">Hi ${customerName}!</strong>
                    Thank you for your purchase!
                  </td>
                </tr>

                <!-- INVOICE ID SECTION -->
                <tr>
                  <td align="center" style="padding-bottom:35px;">
                    <div style="font-size:14px;font-weight:900;color:#000000;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;font-family:'Outfit',sans-serif;">
                      INVOICE ID:
                    </div>
                    <div style="font-size:32px;font-weight:900;color:#000000;letter-spacing:1px;font-family:'Outfit',Consolas,monospace;">
                      ${orderRef}
                    </div>
                  </td>
                </tr>

                <!-- YOUR ORDER INFORMATION -->
                <tr>
                  <td align="left" style="padding-bottom:28px;">
                    <div style="font-size:11px;font-weight:900;color:#727272;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e5e5e5;margin-bottom:16px;font-family:'Outfit',sans-serif;">
                      YOUR ORDER INFORMATION:
                    </div>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;color:#121212;font-family:'Plus Jakarta Sans',sans-serif;">
                      <tr>
                        <td width="50%" style="padding:6px 0;vertical-align:top;">
                          <strong style="display:block;color:#000000;font-family:'Outfit',sans-serif;">Order ID:</strong>
                          <span style="color:#555555;font-family:'Outfit',monospace;">${orderRef}</span>
                        </td>
                        <td width="50%" style="padding:6px 0;vertical-align:top;">
                          <strong style="display:block;color:#000000;font-family:'Outfit',sans-serif;">Bill To:</strong>
                          <span style="color:#0066cc;">${customerEmail || customerWhatsApp || "Valued Customer"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding:6px 0;vertical-align:top;">
                          <strong style="display:block;color:#000000;font-family:'Outfit',sans-serif;">Order Date:</strong>
                          <span style="color:#555555;">${dateStr}</span>
                        </td>
                        <td width="50%" style="padding:6px 0;vertical-align:top;">
                          <strong style="display:block;color:#000000;font-family:'Outfit',sans-serif;">Source:</strong>
                          <span style="color:#555555;">Rakexura Store</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- HERE'S WHAT YOU ORDERED -->
                <tr>
                  <td align="left" style="padding-bottom:30px;">
                    <div style="font-size:11px;font-weight:900;color:#727272;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e5e5e5;margin-bottom:16px;font-family:'Outfit',sans-serif;">
                      HERE'S WHAT YOU ORDERED:
                    </div>

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;">
                      <thead>
                        <tr style="background:#f2f2f2;">
                          <th align="left" style="padding:10px 12px;font-size:11px;font-weight:900;color:#000000;text-transform:uppercase;font-family:'Outfit',sans-serif;" width="50%">Description</th>
                          <th align="left" style="padding:10px 12px;font-size:11px;font-weight:900;color:#000000;text-transform:uppercase;font-family:'Outfit',sans-serif;" width="25%">Publisher</th>
                          <th align="right" style="padding:10px 12px;font-size:11px;font-weight:900;color:#000000;text-transform:uppercase;font-family:'Outfit',sans-serif;" width="25%">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${lineItemsHtml}
                      </tbody>
                    </table>

                    ${total === 0 ? `
                    <!-- Discounts Row -->
                    <div style="border-top:1px solid #e5e5e5;margin-top:16px;padding-top:12px;">
                      <div style="font-size:11px;font-weight:900;color:#727272;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;font-family:'Outfit',sans-serif;">Discounts:</div>
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;">
                        <tr>
                          <td style="color:#555555;font-family:'Plus Jakarta Sans',sans-serif;" width="75%">Sale Discount / Free Reward Coupon</td>
                          <td align="right" style="color:#000000;font-weight:700;font-family:'Outfit',monospace;" width="25%">- ₹880.00 INR</td>
                        </tr>
                      </table>
                    </div>
                    ` : ''}

                    <!-- TOTAL ROW -->
                    <div style="border-top:1px solid #e5e5e5;margin-top:16px;padding-top:14px;text-align:right;">
                      <span style="font-size:12px;font-weight:900;color:#727272;letter-spacing:1px;text-transform:uppercase;margin-right:16px;font-family:'Outfit',sans-serif;">TOTAL:</span>
                      <span style="font-size:16px;font-weight:900;color:#000000;font-family:'Outfit',monospace;">₹${total.toLocaleString('en-IN')}.00 INR</span>
                    </div>
                  </td>
                </tr>

                <!-- RECORD KEEPING & ACTION LINKS -->
                <tr>
                  <td align="center" style="padding:24px 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;font-size:12px;color:#555555;font-family:'Plus Jakarta Sans',sans-serif;">
                    <p style="margin:0 0 12px 0;">Please keep a copy of this receipt for your records.</p>
                    <div style="line-height:1.8;">
                      <div>
                        <a href="${actionUrl}" style="color:#0066cc;text-decoration:underline;font-weight:700;">View your purchase history</a>
                      </div>
                      <div>
                        <a href="${siteUrl}/dashboard" style="color:#0066cc;text-decoration:underline;font-weight:700;">View your Rakexura Rewards balance</a>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- POLICY & LEGAL FOOTER -->
                <tr>
                  <td align="center" style="padding-top:28px;font-size:11px;color:#727272;line-height:1.6;font-family:'Plus Jakarta Sans',sans-serif;">
                    <p style="margin:0 0 16px 0;">
                      PC games and apps purchased on Rakexura Store are eligible for instant delivery upon payment verification. If you have any activation questions, please contact our support team.
                    </p>
                    <div style="font-weight:700;color:#000000;margin-bottom:4px;font-family:'Outfit',sans-serif;">Rakexura Store Gaming Pvt Ltd</div>
                    <div style="margin-bottom:20px;">Authorized PC Game Reseller · India</div>

                    <!-- Bottom RX Metallic Silver Shield Badge Only -->
                    <div style="margin-bottom:20px;">
                      <img src="cid:rakexuraSilverBadge" alt="Rakexura Shield Badge" width="34" height="41" style="display:block;margin:0 auto;border:0;" />
                    </div>

                    <div style="font-size:10px;color:#999999;">
                      © 2026 Rakexura Store. All rights reserved. Rakexura, Epic Games, Steam, and their respective logos are trademarks or registered trademarks of their respective owners.
                    </div>
                    <div style="margin-top:14px;font-size:11px;">
                      <a href="${siteUrl}/terms" style="color:#0066cc;text-decoration:none;margin:0 8px;">Terms of Service</a> |
                      <a href="${siteUrl}/privacy" style="color:#0066cc;text-decoration:none;margin:0 8px;">Privacy Policy</a> |
                      <a href="${siteUrl}/support" style="color:#0066cc;text-decoration:none;margin:0 8px;">Need Help?</a>
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
