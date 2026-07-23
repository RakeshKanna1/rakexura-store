import "server-only";
// @ts-expect-error - nodemailer types are not locally installed in devDependencies
import nodemailer from "nodemailer";

import { fetchWithTimeout } from "@/lib/security/request";

type SendEmailInput = {
  to?: string | null;
  subject: string;
  text: string;
  html?: string | null;
};

export type EmailResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function textToHtml(text: string) {
  const lines = text.split("\n");
  let formattedContent = "";
  let inItemsBlock = false;
  let detectedRef = "";

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inItemsBlock) {
        formattedContent += `</div>`;
        inItemsBlock = false;
      }
      formattedContent += `<div style="height:10px;"></div>`;
      return;
    }

    // Order Reference highlight (e.g. RKX-2607-000058)
    if (/RKX-\d{4}-\d+/i.test(trimmed)) {
      const match = trimmed.match(/RKX-\d{4}-\d+/i)?.[0];
      if (match) detectedRef = match;
      const headingText = trimmed.replace(match || "", "").trim();
      formattedContent += `
        <div style="background:linear-gradient(135deg, rgba(112,224,0,0.12), rgba(139,92,246,0.08));border:1px solid rgba(112,224,0,0.3);border-radius:10px;padding:14px;margin-bottom:16px;text-align:center;">
          ${headingText ? `<div style="color:#aeb5c6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${escapeHtml(headingText)}</div>` : ''}
          <div style="display:inline-block;background:#70e000;color:#000000;padding:5px 16px;border-radius:6px;font-family:monospace,Consolas,Courier,monospace;font-size:15px;font-weight:900;letter-spacing:1px;box-shadow:0 0 12px rgba(112,224,0,0.3);">${escapeHtml(match || "")}</div>
        </div>
      `;
      return;
    }

    // Items block start
    if (trimmed.toLowerCase().startsWith("items:") || trimmed.toLowerCase().startsWith("items purchased:")) {
      inItemsBlock = true;
      formattedContent += `
        <div style="margin-top:14px;margin-bottom:14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;">
          <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#70e000;margin-bottom:8px;">PURCHASED ITEMS</div>
      `;
      return;
    }

    // Bullet items
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const itemText = trimmed.substring(2);
      formattedContent += `
        <div style="padding:6px 0;font-size:13px;font-weight:600;color:#ffffff;border-bottom:1px solid rgba(255,255,255,0.04);">
          &bull; ${escapeHtml(itemText)}
        </div>
      `;
      return;
    }

    // Key-Value pairs (e.g. Customer: John, Email: test@gmail.com, Amount: Rs. 200)
    if (trimmed.includes(":") && !trimmed.startsWith("http")) {
      const parts = trimmed.split(":");
      const key = parts[0].trim();
      const val = parts.slice(1).join(":").trim();

      let valHtml = escapeHtml(val);
      if (key.toLowerCase().includes("email") && val.includes("@")) {
        valHtml = `<a href="mailto:${escapeHtml(val)}" style="color:#70e000;text-decoration:underline;font-weight:bold;">${escapeHtml(val)}</a>`;
      } else if (key.toLowerCase().includes("whatsapp") || key.toLowerCase().includes("phone")) {
        const cleanPhone = val.replace(/\D/g, "");
        valHtml = `<a href="https://wa.me/${cleanPhone}" style="color:#00d68f;text-decoration:none;font-weight:bold;background:rgba(0,214,143,0.1);padding:2px 8px;border-radius:4px;border:1px solid rgba(0,214,143,0.2);">+${escapeHtml(val)}</a>`;
      } else if (key.toLowerCase().includes("amount") || key.toLowerCase().includes("price") || key.toLowerCase().includes("total")) {
        valHtml = `<span style="color:#facc15;font-weight:900;font-size:15px;">${escapeHtml(val)}</span>`;
      }

      formattedContent += `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:3px 0;">
          <tr>
            <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#8991a6;font-weight:700;" align="left" width="40%">${escapeHtml(key)}</td>
            <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#ffffff;font-weight:600;" align="right" width="60%">${valHtml}</td>
          </tr>
        </table>
      `;
      return;
    }

    formattedContent += `<p style="margin:6px 0;font-size:13px;line-height:1.6;color:#d4d4d8;">${escapeHtml(trimmed)}</p>`;
  });

  if (inItemsBlock) {
    formattedContent += `</div>`;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app";

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
                      <span style="display:inline-block;padding:3px 10px;background:rgba(139,92,246,0.2);border-radius:4px;font-size:9px;font-weight:900;color:#c4b5fd;letter-spacing:2px;text-transform:uppercase;">RAKEXURA STORE</span>
                      <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">RAKEXURA</div>
                    </div>
                  </td>
                </tr>

                <!-- CARD 1: PRIMARY STATUS & CONTENT CARD (NVIDIA STYLE) -->
                <tr>
                  <td style="background:#141029;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:28px 24px;box-shadow:0 12px 36px rgba(0,0,0,0.6);">
                    <div style="text-align:center;margin-bottom:16px;">
                      <div style="font-size:18px;font-weight:900;color:#70e000;letter-spacing:1px;text-transform:uppercase;">
                        RAKEXURA OFFICIAL UPDATE
                      </div>
                      ${detectedRef ? `<div style="font-size:12px;color:#8991a6;font-weight:700;margin-top:4px;">Order Ref: ${detectedRef}</div>` : ''}
                    </div>

                    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:16px 0 20px 0;" />

                    <div style="font-size:14px;line-height:1.7;color:#d4d4d8;">
                      ${formattedContent}
                    </div>

                    <div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;color:#8991a6;">
                      Thanks,<br />
                      <strong style="color:#ffffff;">Rakexura Customer Support</strong>
                    </div>
                  </td>
                </tr>

                <!-- CARD 2: GET PLAYING / HERO ACTION CARD (NVIDIA STYLE) -->
                <tr>
                  <td style="padding-top:16px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg, #1e173b, #120e24);border:1px solid rgba(139,92,246,0.3);border-radius:14px;padding:24px 20px;text-align:center;box-shadow:0 12px 36px rgba(0,0,0,0.5);">
                      <tr>
                        <td align="center">
                          <div style="font-size:15px;font-weight:900;color:#70e000;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">GET PLAYING</div>
                          <div style="font-size:12px;color:#a4abbc;font-weight:600;margin-bottom:16px;">Start Gaming with Your Library of PC Games</div>
                          <a href="${siteUrl}" style="display:inline-block;background:#70e000;color:#000000;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:900;font-size:12px;letter-spacing:1px;text-transform:uppercase;box-shadow:0 0 20px rgba(112,224,0,0.4);">
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
                                  Account
                                </a>
                              </td>
                              <td align="center" width="25%" style="padding:4px;">
                                <a href="${siteUrl}/games" style="color:#70e000;text-decoration:none;font-size:12px;font-weight:800;display:block;">
                                  Catalog
                                </a>
                              </td>
                              <td align="center" width="25%" style="padding:4px;">
                                <a href="https://wa.me/918317416695" style="color:#70e000;text-decoration:none;font-size:12px;font-weight:800;display:block;">
                                  Support
                                </a>
                              </td>
                              <td align="center" width="25%" style="padding:4px;">
                                <a href="${siteUrl}/track" style="color:#70e000;text-decoration:none;font-size:12px;font-weight:800;display:block;">
                                  Tracking
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

export async function sendEmail({ to, subject, text, html }: SendEmailInput): Promise<EmailResult> {
  const from = process.env.EMAIL_FROM ?? "Rakexura Store <cheappcgamesrake@gmail.com>";

  if (!to) {
    return { ok: false, skipped: true, reason: "Email recipient is not configured" };
  }

  // 1. Try Brevo API / SMTP if BREVO_API_KEY is present
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    const match = from.match(/^(.*?)\s*<([^>]+)>$/);
    const senderName = match ? match[1].trim() || "Rakexura Store" : "Rakexura Store";
    const senderEmail = match ? match[2].trim() : from.trim();

    // First try Brevo HTTP REST API v3
    try {
      const response = await fetchWithTimeout("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html ?? textToHtml(text),
          textContent: text,
        }),
      });

      if (response.ok) {
        return { ok: true };
      }

      const errorText = await response.text();
      console.warn("Brevo API returned non-OK status, trying Brevo SMTP fallback:", errorText);
    } catch (error) {
      console.warn("Brevo HTTP API failed, trying Brevo SMTP fallback:", error);
    }

    // Fallback to Brevo Nodemailer SMTP (especially for xsmtpsib- keys)
    if (nodemailer) {
      try {
        const smtpUser = process.env.SMTP_USER || process.env.OWNER_EMAIL || senderEmail;
        const smtpTransporter = nodemailer.createTransport({
          host: "smtp-relay.brevo.com",
          port: 587,
          secure: false,
          auth: {
            user: smtpUser,
            pass: brevoApiKey,
          },
        });

        await smtpTransporter.sendMail({
          from,
          to,
          subject,
          text,
          html: html ?? textToHtml(text),
        });

        return { ok: true };
      } catch (smtpErr) {
        console.error("Brevo SMTP Nodemailer dispatch failed:", smtpErr);
      }
    }
  }

  // 2. Try generic SMTP credentials if present and nodemailer is available
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || "465");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // 3. Check Resend API key
  const apiKey = process.env.RESEND_API_KEY;

  let transporter = null;

  if (nodemailer) {
    if (smtpHost && smtpUser && smtpPass) {
      try {
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
      } catch (err) {
        console.warn("Failed to create nodemailer SMTP transporter:", err);
      }
    } else if (apiKey) {
      try {
        transporter = nodemailer.createTransport({
          host: "smtp.resend.com",
          port: 465,
          secure: true,
          auth: {
            user: "resend",
            pass: apiKey,
          },
        });
      } catch (err) {
        console.warn("Failed to create nodemailer Resend SMTP transporter:", err);
      }
    }
  }

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: html ?? textToHtml(text),
      });
      return { ok: true };
    } catch (err) {
      console.error("Nodemailer dispatch failed, falling back to API:", err);
    }
  }

  // Failsafe: Fallback to Resend HTTP API if Nodemailer SMTP fails or is unavailable
  if (apiKey) {
    try {
      const response = await fetchWithTimeout("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          text,
          html: html ?? textToHtml(text),
        }),
      });

      if (!response.ok) {
        return { ok: false, error: await response.text() };
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Email send failed",
      };
    }
  }

  return { ok: false, skipped: true, reason: "No email SMTP or API configuration found" };
}
