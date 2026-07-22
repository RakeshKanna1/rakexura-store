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

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inItemsBlock) {
        formattedContent += `</div>`;
        inItemsBlock = false;
      }
      formattedContent += `<div style="height:12px;"></div>`;
      return;
    }

    // Order Reference highlight (e.g. RKX-2607-000058)
    if (/RKX-\d{4}-\d+/i.test(trimmed)) {
      const match = trimmed.match(/RKX-\d{4}-\d+/i)?.[0];
      const headingText = trimmed.replace(match || "", "").trim();
      formattedContent += `
        <div style="background:linear-gradient(135deg, rgba(139,92,246,0.15), rgba(124,58,237,0.08));border:1px solid rgba(139,92,246,0.35);border-radius:10px;padding:16px;margin-bottom:20px;text-align:center;">
          ${headingText ? `<div style="color:#aeb5c6;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">${escapeHtml(headingText)}</div>` : ''}
          <div style="display:inline-block;background:#8b5cf6;color:#ffffff;padding:6px 16px;border-radius:20px;font-family:monospace,Consolas,Courier,monospace;font-size:16px;font-weight:900;letter-spacing:1px;box-shadow:0 0 12px rgba(139,92,246,0.4);">${escapeHtml(match || "")}</div>
        </div>
      `;
      return;
    }

    // Items block start
    if (trimmed.toLowerCase().startsWith("items:") || trimmed.toLowerCase().startsWith("items purchased:")) {
      inItemsBlock = true;
      formattedContent += `
        <div style="margin-top:16px;margin-bottom:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;">
          <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#b9a4ff;margin-bottom:10px;">🛒 Purchased Items</div>
      `;
      return;
    }

    // Bullet items
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const itemText = trimmed.substring(2);
      formattedContent += `
        <div style="padding:6px 0;font-size:13px;font-weight:600;color:#ffffff;border-bottom:1px solid rgba(255,255,255,0.04);">
          ⚡ ${escapeHtml(itemText)}
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
        valHtml = `<a href="mailto:${escapeHtml(val)}" style="color:#c4b5fd;text-decoration:underline;font-weight:bold;">${escapeHtml(val)}</a>`;
      } else if (key.toLowerCase().includes("whatsapp") || key.toLowerCase().includes("phone")) {
        const cleanPhone = val.replace(/\D/g, "");
        valHtml = `<a href="https://wa.me/${cleanPhone}" style="color:#00d68f;text-decoration:none;font-weight:bold;background:rgba(0,214,143,0.1);padding:2px 8px;border-radius:4px;border:1px solid rgba(0,214,143,0.2);">📱 +${escapeHtml(val)}</a>`;
      } else if (key.toLowerCase().includes("amount") || key.toLowerCase().includes("price") || key.toLowerCase().includes("total")) {
        valHtml = `<span style="color:#facc15;font-weight:900;font-size:15px;">${escapeHtml(val)}</span>`;
      }

      formattedContent += `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:4px 0;">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#8991a6;font-weight:700;" align="left" width="40%">${escapeHtml(key)}</td>
            <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#ffffff;font-weight:600;" align="right" width="60%">${valHtml}</td>
          </tr>
        </table>
      `;
      return;
    }

    formattedContent += `<p style="margin:8px 0;font-size:13px;line-height:1.6;color:#d4d4d8;">${escapeHtml(trimmed)}</p>`;
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
      <body style="margin:0;padding:0;background-color:#05040a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#05040a;padding:40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background:#0e0a1f;border:1px solid rgba(139,92,246,0.3);border-radius:16px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.6);">
                
                <!-- Gradient Top Header -->
                <tr>
                  <td style="background:linear-gradient(135deg, #1b1236, #0e0a1f);padding:32px 24px;text-align:center;border-bottom:1px solid rgba(139,92,246,0.2);">
                    <div style="display:inline-block;padding:6px 14px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:20px;font-size:10px;font-weight:900;color:#c4b5fd;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">
                      ⚡ RAKEXURA STORE
                    </div>
                    <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">
                      RAKEXURA
                    </h1>
                    <div style="font-size:11px;color:#8991a6;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">
                      PREMIUM PC GAME STORE
                    </div>
                  </td>
                </tr>

                <!-- Email Body Content -->
                <tr>
                  <td style="padding:32px 24px;">
                    ${formattedContent}

                    <!-- Call to Action Button -->
                    <div style="margin-top:32px;text-align:center;">
                      <a href="${siteUrl}/admin/orders" style="display:inline-block;background:linear-gradient(135deg, #8b5cf6, #7c3aed);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:900;font-size:13px;letter-spacing:0.5px;box-shadow:0 0 20px rgba(139,92,246,0.4);">
                        🚀 Open Admin Dashboard
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#080612;padding:24px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);color:#646b7b;font-size:11px;line-height:1.6;">
                    <p style="margin:0;font-weight:700;color:#a4abbc;">Secure assisted game delivery by Rakexura Store</p>
                    <p style="margin:6px 0 0;">Need activation help or instant support? Contact us on WhatsApp.</p>
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

export async function sendEmail({ to, subject, text, html }: SendEmailInput): Promise<EmailResult> {
  const from = process.env.EMAIL_FROM ?? "Rakexura Store <onboarding@resend.dev>";

  if (!to) {
    return { ok: false, skipped: true, reason: "Email recipient is not configured" };
  }

  // 1. Try generic SMTP credentials if present and nodemailer is available
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || "465");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // 2. Otherwise, check Resend API key to use Resend's SMTP
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
