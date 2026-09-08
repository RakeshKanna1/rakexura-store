export type OrderNoticeItem = {
  title?: string;
  platform?: string;
  quantity?: number;
  price?: number;
};

export type OrderNotice = {
  reference?: string;
  customerName?: string;
  customerWhatsApp?: string;
  customerEmail?: string;
  total?: number;
  items?: OrderNoticeItem[];
  userId?: string;
};

export function price(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-IN");
}

export function orderTotal(order: OrderNotice) {
  const directTotal = Number(order.total ?? 0);
  if (directTotal > 0) return directTotal;

  return (order.items ?? []).reduce((sum, item) => {
    const quantity = Number(item.quantity ?? 1);
    const itemPrice = Number(item.price ?? 0);
    return sum + quantity * itemPrice;
  }, 0);
}

export function makeCustomerInvoiceMessage(order: OrderNotice) {
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
    "Your official invoice receipt is attached. If you have any questions, feel free to contact us on WhatsApp.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function makeEpicReceiptHtml({ order, isAdmin }: { order: OrderNotice; isAdmin: boolean }) {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app";
  const siteUrl = (rawSiteUrl.includes("localhost") || rawSiteUrl.includes("127.0.0.1"))
    ? "https://rakexura-store.vercel.app"
    : rawSiteUrl.replace(/\/$/, "");
  const logoUrl = `${siteUrl}/images/rakexura-silver-badge.png`;
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
            <td style="padding:14px 12px;font-size:13px;font-weight:700;color:#121212;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" width="50%">
              ${title}
            </td>
            <td style="padding:14px 12px;font-size:12px;color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" width="25%">
              ${platform} ${qty > 1 ? `(Qty: ${qty})` : ''}
            </td>
            <td align="right" style="padding:14px 12px;font-size:13px;font-weight:700;color:#121212;font-family:ui-monospace,Consolas,monospace;" width="25%">
              ${priceDisplay}
            </td>
          </tr>
        `;
      }).join("")
    : `
      <tr style="border-bottom:1px solid #e5e5e5;">
        <td style="padding:14px 12px;font-size:13px;font-weight:700;color:#121212;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">PC Game Order Item</td>
        <td style="padding:14px 12px;font-size:12px;color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Rakexura Games</td>
        <td align="right" style="padding:14px 12px;font-size:13px;font-weight:700;color:#121212;font-family:ui-monospace,Consolas,monospace;">₹${total.toLocaleString('en-IN')}.00 INR</td>
      </tr>
    `;

  if (isAdmin) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body, table, td, p, a, h1, div, span, strong {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            }
          </style>
        </head>
        <body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#121212;-webkit-font-smoothing:antialiased;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;padding:40px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;text-align:center;">
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <img src="${logoUrl}" alt="Rakexura Shield Badge" width="46" height="55" style="display:block;margin:0 auto;border:0;outline:none;" />
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <h1 style="margin:0;font-size:32px;font-weight:900;color:#000000;letter-spacing:-0.5px;line-height:1.2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                        NEW ORDER RECEIVED!
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td align="left" style="padding-bottom:28px;">
                      <div style="font-size:11px;font-weight:900;color:#727272;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e5e5e5;margin-bottom:16px;font-family:'Outfit',sans-serif;">
                        ORDER & BUYER DETAILS:
                      </div>
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="table-layout:fixed;width:100%;font-size:13px;color:#121212;font-family:'Outfit',sans-serif;">
                        <tr>
                          <td width="50%" style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">
                            <strong style="display:block;color:#000000;font-family:'Outfit',sans-serif;">Order ID:</strong>
                            <span style="color:#555555;font-family:ui-monospace,Consolas,monospace;">${orderRef}</span>
                          </td>
                          <td width="50%" style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">
                            <strong style="display:block;color:#000000;font-family:'Outfit',sans-serif;">Customer Name:</strong>
                            <span style="color:#000000;font-weight:700;">${customerName}</span>
                          </td>
                        </tr>
                        <tr>
                          <td width="50%" style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">
                            <strong style="display:block;color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Customer Email:</strong>
                            <a href="mailto:${customerEmail}" style="color:#0066cc;text-decoration:none;font-weight:700;word-break:break-all;">${customerEmail}</a>
                          </td>
                          <td width="50%" style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">
                            <strong style="display:block;color:#000000;font-family:'Outfit',sans-serif;">Order Date:</strong>
                            <span style="color:#555555;">${dateStr}</span>
                          </td>
                        </tr>
                        <tr>
                          <td width="50%" style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">
                            <strong style="display:block;color:#000000;font-family:'Outfit',sans-serif;">WhatsApp Phone:</strong>
                            <a href="https://wa.me/${customerWhatsApp.replace(/\D/g, "")}" style="color:#0066cc;text-decoration:none;font-weight:700;">${customerWhatsApp}</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
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
                  <tr>
                    <td align="center" style="padding:24px 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;">
                      <div style="margin-bottom:12px;">
                        <a href="${actionUrl}" style="display:inline-block;background-color:#000000;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-family:'Outfit',sans-serif;">
                          Open Admin Dashboard &rarr;
                        </a>
                      </div>
                      <p style="margin:0;font-size:12px;color:#727272;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Click to verify payment proof and release activation keys.</p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top:24px;font-size:11px;color:#727272;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      <div style="font-weight:700;color:#000000;margin-bottom:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Rakexura Store Admin Operations</div>
                      <div style="margin-bottom:16px;">Automated Admin Notification System</div>
                      <div style="margin-bottom:16px;">
                        <img src="${logoUrl}" alt="Rakexura Shield Badge" width="34" height="41" style="display:block;margin:0 auto;border:0;outline:none;" />
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

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body, table, td, p, a, h1, div, span, strong {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#121212;-webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;padding:40px 15px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;text-align:center;">
                <tr>
                  <td align="center" style="padding-bottom:30px;">
                    <img src="${logoUrl}" alt="Rakexura Shield Badge" width="46" height="55" style="display:block;margin:0 auto;border:0;outline:none;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <h1 style="margin:0;font-size:38px;font-weight:900;color:#000000;letter-spacing:-0.5px;line-height:1.1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      Thank You.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:30px;font-size:14px;color:#333333;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                    <strong style="font-size:15px;color:#000000;display:block;margin-bottom:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Hi ${customerName}!</strong>
                    Thank you for your purchase!
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:35px;">
                    <div style="font-size:14px;font-weight:900;color:#000000;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      INVOICE ID:
                    </div>
                    <div style="font-size:32px;font-weight:900;color:#000000;letter-spacing:1px;font-family:ui-monospace,Consolas,monospace;">
                      ${orderRef}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding-bottom:28px;">
                    <div style="font-size:11px;font-weight:900;color:#727272;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e5e5e5;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      YOUR ORDER INFORMATION:
                    </div>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="table-layout:fixed;width:100%;font-size:13px;color:#121212;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      <tr>
                        <td width="50%" style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">
                          <strong style="display:block;color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Order ID:</strong>
                          <span style="color:#555555;font-family:ui-monospace,Consolas,monospace;">${orderRef}</span>
                        </td>
                        <td width="50%" style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">
                          <strong style="display:block;color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Bill To:</strong>
                          <span style="color:#0066cc;word-break:break-all;">${customerEmail || customerWhatsApp || "Valued Customer"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">
                          <strong style="display:block;color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Order Date:</strong>
                          <span style="color:#555555;">${dateStr}</span>
                        </td>
                        <td width="50%" style="padding:6px 0;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">
                          <strong style="display:block;color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Source:</strong>
                          <span style="color:#555555;">Rakexura Store</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding-bottom:30px;">
                    <div style="font-size:11px;font-weight:900;color:#727272;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e5e5e5;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      HERE'S WHAT YOU ORDERED:
                    </div>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;">
                      <thead>
                        <tr style="background:#f2f2f2;">
                          <th align="left" style="padding:10px 12px;font-size:11px;font-weight:900;color:#000000;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" width="50%">Description</th>
                          <th align="left" style="padding:10px 12px;font-size:11px;font-weight:900;color:#000000;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" width="25%">Publisher</th>
                          <th align="right" style="padding:10px 12px;font-size:11px;font-weight:900;color:#000000;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" width="25%">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${lineItemsHtml}
                      </tbody>
                    </table>
                    ${total === 0 ? `
                    <div style="border-top:1px solid #e5e5e5;margin-top:16px;padding-top:12px;">
                      <div style="font-size:11px;font-weight:900;color:#727272;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Discounts:</div>
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;">
                        <tr>
                          <td style="color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" width="75%">Sale Discount / Free Reward Coupon</td>
                          <td align="right" style="color:#000000;font-weight:700;font-family:ui-monospace,Consolas,monospace;" width="25%">- ₹880.00 INR</td>
                        </tr>
                      </table>
                    </div>
                    ` : ''}
                    <div style="border-top:1px solid #e5e5e5;margin-top:16px;padding-top:14px;text-align:right;">
                      <span style="font-size:12px;font-weight:900;color:#727272;letter-spacing:1px;text-transform:uppercase;margin-right:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">TOTAL:</span>
                      <span style="font-size:16px;font-weight:900;color:#000000;font-family:ui-monospace,Consolas,monospace;">₹${total.toLocaleString('en-IN')}.00 INR</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:24px 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;font-size:12px;color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
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
                <tr>
                  <td align="center" style="padding-top:28px;font-size:11px;color:#727272;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                    <p style="margin:0 0 16px 0;">
                      PC games and apps purchased on Rakexura Store are eligible for instant delivery upon payment verification. If you have any activation questions, please contact our support team.
                    </p>
                    <div style="font-weight:700;color:#000000;margin-bottom:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Rakexura Store Gaming Pvt Ltd</div>
                    <div style="margin-bottom:20px;">Authorized PC Game Reseller · India</div>
                    <div style="margin-bottom:20px;">
                      <img src="${logoUrl}" alt="Rakexura Shield Badge" width="34" height="41" style="display:block;margin:0 auto;border:0;outline:none;" />
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
