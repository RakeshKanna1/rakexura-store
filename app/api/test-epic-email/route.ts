import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app";
    const logoUrl = `${siteUrl}/images/rakexura-silver-badge.png`;
    const orderRef = "F5171346876";
    const customerName = "Rakel";
    const customerEmail = "arise111woo@gmail.com";
    const dateStr = "July 22, 2026";
    const total = 880;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#121212;-webkit-font-smoothing:antialiased;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;padding:40px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;text-align:center;">

                  <!-- Top Epic Brand Shield Logo -->
                  <tr>
                    <td align="center" style="padding-bottom:30px;">
                      <img src="${logoUrl}" alt="Rakexura Logo" width="46" height="55" style="display:block;margin:0 auto;border:0;" />
                    </td>
                  </tr>

                  <!-- Thank You Headline -->
                  <tr>
                    <td align="center" style="padding-bottom:20px;">
                      <h1 style="margin:0;font-size:38px;font-weight:900;color:#000000;letter-spacing:-0.5px;line-height:1.1;">
                        Thank You.
                      </h1>
                    </td>
                  </tr>

                  <!-- Greeting Subhead -->
                  <tr>
                    <td align="center" style="padding-bottom:30px;font-size:14px;color:#333333;line-height:1.5;">
                      <strong style="font-size:15px;color:#000000;display:block;margin-bottom:4px;">Hi ${customerName}!</strong>
                      Thank you for your purchase!
                    </td>
                  </tr>

                  <!-- INVOICE ID SECTION -->
                  <tr>
                    <td align="center" style="padding-bottom:35px;">
                      <div style="font-size:14px;font-weight:900;color:#000000;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">
                        INVOICE ID:
                      </div>
                      <div style="font-size:32px;font-weight:900;color:#000000;letter-spacing:1px;font-family:Consolas,monospace;">
                        ${orderRef}
                      </div>
                    </td>
                  </tr>

                  <!-- YOUR ORDER INFORMATION -->
                  <tr>
                    <td align="left" style="padding-bottom:28px;">
                      <div style="font-size:11px;font-weight:900;color:#727272;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e5e5e5;margin-bottom:16px;">
                        YOUR ORDER INFORMATION:
                      </div>
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;color:#121212;">
                        <tr>
                          <td width="50%" style="padding:6px 0;vertical-align:top;">
                            <strong style="display:block;color:#000000;">Order ID:</strong>
                            <span style="color:#555555;font-family:monospace;">F2607221151555100</span>
                          </td>
                          <td width="50%" style="padding:6px 0;vertical-align:top;">
                            <strong style="display:block;color:#000000;">Bill To:</strong>
                            <span style="color:#0066cc;">cheappcgamesrake@gmail.com</span>
                          </td>
                        </tr>
                        <tr>
                          <td width="50%" style="padding:6px 0;vertical-align:top;">
                            <strong style="display:block;color:#000000;">Order Date:</strong>
                            <span style="color:#555555;">${dateStr}</span>
                          </td>
                          <td width="50%" style="padding:6px 0;vertical-align:top;">
                            <strong style="display:block;color:#000000;">Source:</strong>
                            <span style="color:#555555;">Epic Games Store</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- HERE'S WHAT YOU ORDERED -->
                  <tr>
                    <td align="left" style="padding-bottom:30px;">
                      <div style="font-size:11px;font-weight:900;color:#727272;letter-spacing:1.5px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e5e5e5;margin-bottom:16px;">
                        HERE'S WHAT YOU ORDERED:
                      </div>

                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;">
                        <thead>
                          <tr style="background:#f2f2f2;">
                            <th align="left" style="padding:10px 12px;font-size:11px;font-weight:900;color:#000000;text-transform:uppercase;" width="50%">Description</th>
                            <th align="left" style="padding:10px 12px;font-size:11px;font-weight:900;color:#000000;text-transform:uppercase;" width="25%">Publisher</th>
                            <th align="right" style="padding:10px 12px;font-size:11px;font-weight:900;color:#000000;text-transform:uppercase;" width="25%">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style="border-bottom:1px solid #e5e5e5;">
                            <td style="padding:14px 12px;font-size:13px;font-weight:700;color:#121212;">Luto</td>
                            <td style="padding:14px 12px;font-size:12px;color:#555555;">Broken Bird Games</td>
                            <td align="right" style="padding:14px 12px;font-size:13px;font-weight:700;color:#121212;">₹880.00 INR</td>
                          </tr>
                        </tbody>
                      </table>

                      <!-- TOTAL ROW -->
                      <div style="border-top:1px solid #e5e5e5;margin-top:16px;padding-top:14px;text-align:right;">
                        <span style="font-size:12px;font-weight:900;color:#727272;letter-spacing:1px;text-transform:uppercase;margin-right:16px;">TOTAL:</span>
                        <span style="font-size:16px;font-weight:900;color:#000000;">₹880.00 INR</span>
                      </div>
                    </td>
                  </tr>

                  <!-- RECORD KEEPING & ACTION LINKS -->
                  <tr>
                    <td align="center" style="padding:24px 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;font-size:12px;color:#555555;">
                      <p style="margin:0 0 12px 0;">Please keep a copy of this receipt for your records.</p>
                      <div style="line-height:1.8;">
                        <div>
                          <a href="${siteUrl}/track-order?order=${orderRef}" style="color:#0066cc;text-decoration:underline;font-weight:700;">View your purchase history</a>
                        </div>
                        <div>
                          <a href="${siteUrl}/dashboard" style="color:#0066cc;text-decoration:underline;font-weight:700;">View your Epic Rewards balance</a>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- POLICY & LEGAL FOOTER -->
                  <tr>
                    <td align="center" style="padding-top:28px;font-size:11px;color:#727272;line-height:1.6;">
                      <p style="margin:0 0 16px 0;">
                        PC games and apps purchased on the Epic Games Store are eligible for a refund within 14 days of purchase (or 14 days after release for pre-purchases) if they have less than 2 hours of runtime, unless otherwise stated on their product page.
                      </p>
                      <div style="font-weight:700;color:#000000;margin-bottom:4px;">Epic Games Commerce GmbH</div>
                      <div style="margin-bottom:20px;">D4 Platz 10 6039 Root, Switzerland</div>

                      <!-- Bottom Epic Shield Logo -->
                      <div style="margin-bottom:20px;">
                        <img src="${logoUrl}" alt="Rakexura Logo" width="34" height="41" style="display:block;margin:0 auto;border:0;" />
                      </div>

                      <div style="font-size:10px;color:#999999;">
                        © 2026 Epic Games, Inc. All rights reserved. Epic, Epic Games, the Epic Games logo, Unreal, Unreal Engine, the Unreal Engine logo, Epic Games Store, and the Epic Games Store logo are trademarks or registered trademarks of Epic Games, Inc. in the USA and elsewhere.
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

    const result = await sendEmail({
      to: customerEmail,
      subject: `Thank you for your purchase! - Invoice ${orderRef}`,
      text: `Thank you for your purchase! Order ID: ${orderRef}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
