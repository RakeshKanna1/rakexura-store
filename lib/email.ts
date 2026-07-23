import "server-only";
// @ts-expect-error - nodemailer types are not locally installed in devDependencies
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

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

function getInlineAttachments() {
  const attachments = [];
  try {
    const badgePath = path.join(process.cwd(), "public", "images", "rakexura-silver-badge.png");
    if (fs.existsSync(badgePath)) {
      attachments.push({
        filename: "rakexura-silver-badge.png",
        path: badgePath,
        cid: "rakexuraSilverBadge",
      });
    }
  } catch (err) {
    console.warn("Could not load logo attachments:", err);
  }
  return attachments;
}

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

    if (/RKX-\d{4}-\d+/i.test(trimmed)) {
      const match = trimmed.match(/RKX-\d{4}-\d+/i)?.[0];
      if (match) detectedRef = match;
      const headingText = trimmed.replace(match || "", "").trim();
      formattedContent += `
        <div style="background-color:#f8f9fa;border:1px solid #e5e5e5;border-radius:8px;padding:14px;margin-bottom:16px;text-align:center;">
          ${headingText ? `<div style="color:#727272;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${escapeHtml(headingText)}</div>` : ''}
          <div style="display:inline-block;background-color:#000000;color:#ffffff;padding:5px 16px;border-radius:6px;font-family:monospace,Consolas,Courier,monospace;font-size:15px;font-weight:900;letter-spacing:1px;">${escapeHtml(match || "")}</div>
        </div>
      `;
      return;
    }

    if (trimmed.toLowerCase().startsWith("items:") || trimmed.toLowerCase().startsWith("items purchased:")) {
      inItemsBlock = true;
      formattedContent += `
        <div style="margin-top:14px;margin-bottom:14px;background-color:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;padding:14px;">
          <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#727272;margin-bottom:8px;">PURCHASED ITEMS</div>
      `;
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const itemText = trimmed.substring(2);
      formattedContent += `
        <div style="padding:6px 0;font-size:13px;font-weight:600;color:#121212;border-bottom:1px solid #eee;">
          &bull; ${escapeHtml(itemText)}
        </div>
      `;
      return;
    }

    if (trimmed.includes(":") && !trimmed.startsWith("http")) {
      const parts = trimmed.split(":");
      const key = parts[0].trim();
      const val = parts.slice(1).join(":").trim();

      let valHtml = escapeHtml(val);
      if (key.toLowerCase().includes("email") && val.includes("@")) {
        valHtml = `<a href="mailto:${escapeHtml(val)}" style="color:#0066cc;text-decoration:underline;font-weight:bold;">${escapeHtml(val)}</a>`;
      } else if (key.toLowerCase().includes("whatsapp") || key.toLowerCase().includes("phone")) {
        const cleanPhone = val.replace(/\D/g, "");
        valHtml = `<a href="https://wa.me/${cleanPhone}" style="color:#0066cc;text-decoration:none;font-weight:bold;">+${escapeHtml(val)}</a>`;
      } else if (key.toLowerCase().includes("amount") || key.toLowerCase().includes("price") || key.toLowerCase().includes("total")) {
        valHtml = `<span style="color:#000000;font-weight:900;font-size:15px;">${escapeHtml(val)}</span>`;
      }

      formattedContent += `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:3px 0;">
          <tr>
            <td style="padding:6px 0;border-bottom:1px solid #eee;font-size:13px;color:#727272;font-weight:700;" align="left" width="40%">${escapeHtml(key)}</td>
            <td style="padding:6px 0;border-bottom:1px solid #eee;font-size:13px;color:#121212;font-weight:600;" align="right" width="60%">${valHtml}</td>
          </tr>
        </table>
      `;
      return;
    }

    formattedContent += `<p style="margin:6px 0;font-size:13px;line-height:1.6;color:#333333;">${escapeHtml(trimmed)}</p>`;
  });

  if (inItemsBlock) {
    formattedContent += `</div>`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#121212;-webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;padding:32px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:28px 24px;text-align:center;">
                <tr>
                  <td align="center">
                    <img src="cid:rakexuraSilverBadge" alt="Rakexura Shield Badge" width="46" height="55" style="display:block;margin:0 auto 16px auto;border:0;" />
                    <div style="font-size:18px;font-weight:900;color:#000000;letter-spacing:1px;text-transform:uppercase;">
                      RAKEXURA STORE
                    </div>
                    ${detectedRef ? `<div style="font-size:12px;color:#727272;font-weight:700;margin-top:4px;">Order Ref: ${detectedRef}</div>` : ''}
                    
                    <hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0 20px 0;" />

                    <div style="font-size:14px;line-height:1.7;color:#333333;text-align:left;">
                      ${formattedContent}
                    </div>

                    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:12px;color:#727272;text-align:left;">
                      Thanks,<br />
                      <strong style="color:#000000;">Rakexura Customer Support</strong>
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
  const ownerEmail = (process.env.OWNER_EMAIL || "12k21rakeshkannam@gmail.com").toLowerCase().trim();

  if (!to) {
    return { ok: false, skipped: true, reason: "Email recipient is not configured" };
  }

  const recipient = to.toLowerCase().trim();
  const isOwner = recipient === ownerEmail;

  // =========================================================================
  // STRICT RULE 1: OWNER EMAILS -> USE RESEND API (OR GMAIL DIRECT SMTP) ONLY!
  // OWNER EMAILS MUST NEVER USE BREVO API!
  // =========================================================================
  if (isOwner) {
    // 1a. Try Resend API first for Owner emails
    if (process.env.RESEND_API_KEY) {
      try {
        const apiKey = process.env.RESEND_API_KEY;
        const response = await fetchWithTimeout("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Rakexura Store <onboarding@resend.dev>",
            to: recipient,
            subject,
            text,
            html: html ?? textToHtml(text),
          }),
        });

        if (response.ok) {
          console.log(`[Resend API] Owner email successfully delivered to ${recipient}`);
          return { ok: true };
        }
        const errText = await response.text();
        console.warn(`[Resend API] Owner email failed (${response.status}): ${errText}`);
      } catch (err) {
        console.warn("[Resend API] Error sending owner email:", err);
      }
    }

    // 1b. Fallback for Owner: Gmail Direct SMTP (if configured)
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || "465");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (nodemailer && smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });

        await transporter.sendMail({
          from: `Rakexura Admin Alert <${smtpUser}>`,
          to: recipient,
          subject,
          text,
          html: html ?? textToHtml(text),
          attachments: getInlineAttachments(),
        });

        console.log(`[Gmail Direct SMTP] Owner email successfully delivered to ${recipient}`);
        return { ok: true };
      } catch (smtpErr) {
        console.warn("[Gmail Direct SMTP] Owner email failed:", smtpErr);
      }
    }

    return { ok: false, skipped: true, reason: "Owner email dispatch failed (Resend API & Gmail Direct SMTP failed)" };
  }

  // =========================================================================
  // STRICT RULE 2: CUSTOMER EMAILS -> BREVO SMTP / BREVO API FIRST, THEN FALLBACKS
  // =========================================================================
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    const senderEmail = process.env.SMTP_USER || "cheappcgamesrake@gmail.com";

    if (nodemailer) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp-relay.brevo.com",
          port: 587,
          secure: false,
          auth: {
            user: senderEmail,
            pass: brevoApiKey,
          },
        });

        await transporter.sendMail({
          from: `Rakexura Store <${senderEmail}>`,
          to: recipient,
          subject,
          text,
          html: html ?? textToHtml(text),
          attachments: getInlineAttachments(),
        });

        console.log(`[Brevo SMTP] Customer email successfully delivered to ${recipient}`);
        return { ok: true };
      } catch (smtpErr) {
        console.warn("[Brevo SMTP] Dispatch failed, trying Gmail Direct SMTP fallback:", smtpErr);
      }
    }
  }

  // Fallback for Customer: Gmail Direct SMTP
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || "465");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (nodemailer && smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `Rakexura Store <${smtpUser}>`,
        to: recipient,
        subject,
        text,
        html: html ?? textToHtml(text),
        attachments: getInlineAttachments(),
      });

      console.log(`[Gmail Direct SMTP] Customer email successfully delivered to ${recipient}`);
      return { ok: true };
    } catch (smtpErr) {
      console.warn("[Gmail Direct SMTP] Customer email failed:", smtpErr);
    }
  }

  // Final Fallback for Customer: Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const response = await fetchWithTimeout("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Rakexura Store <onboarding@resend.dev>",
          to: recipient,
          subject,
          text,
          html: html ?? textToHtml(text),
        }),
      });

      if (response.ok) {
        console.log(`[Resend Fallback] Customer email delivered to ${recipient}`);
        return { ok: true };
      }
    } catch (err) {
      console.error("[Resend Fallback] Dispatch failed:", err);
    }
  }

  return { ok: false, skipped: true, reason: "No active email transport completed successfully" };
}
