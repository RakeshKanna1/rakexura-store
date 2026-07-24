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

export type StoreEmailOptions = {
  title: string;
  message: string;
  link?: string;
  imageUrl?: string | null;
  price?: number | string | null;
  originalPrice?: number | string | null;
  discountPercentage?: number | string | null;
  discountTag?: string | null;
  platforms?: string | null;
};

export function buildProfessionalEmailHtml(options: StoreEmailOptions) {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app";
  const siteUrl = rawSiteUrl.replace(/\/$/, "");
  const { title, message, link, imageUrl, price, originalPrice, discountPercentage, discountTag, platforms } = options;
  
  const targetUrl = link?.startsWith("http") ? link : `${siteUrl}${link?.startsWith("/") ? link : `/${link || ""}`}`;

  // Direct absolute logo URL for reliable delivery across mobile & web clients
  const logoUrl = `${siteUrl}/images/rakexura-silver-badge.png`;

  // Process game image absolute URL
  let fullImageUrl: string | null = null;
  if (imageUrl) {
    fullImageUrl = imageUrl.startsWith("http://") || imageUrl.startsWith("https://") 
      ? imageUrl 
      : `${siteUrl}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;-webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f5f8;padding:36px 12px;">
          <tr>
            <td align="center">
              
              <!-- Main White Card Container -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#ffffff;border-radius:14px;border:1px solid #e5e7eb;padding:36px 32px;text-align:left;box-shadow:0 10px 25px rgba(0,0,0,0.04);">
                <tr>
                  <td>
                    
                    <!-- Header Logo & Store Badge -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:24px;border-bottom:1px solid #f3f4f6;padding-bottom:18px;">
                      <tr>
                        <td align="left">
                          <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding-right:14px;vertical-align:middle;">
                                <img src="${logoUrl}" alt="Rakexura" width="38" height="46" style="display:block;border:0;outline:none;max-width:38px;" />
                              </td>
                              <td style="vertical-align:middle;">
                                <div style="font-size:20px;font-weight:900;color:#0f172a;letter-spacing:1.5px;text-transform:uppercase;line-height:1;">RAKEXURA</div>
                                <div style="font-size:10px;font-weight:800;color:#7c3aed;letter-spacing:1px;text-transform:uppercase;margin-top:4px;">OFFICIAL STORE ANNOUNCEMENT</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Headline Title -->
                    <h1 style="font-size:23px;font-weight:900;color:#0f172a;letter-spacing:-0.3px;line-height:1.35;margin:0 0 20px 0;padding:0;">
                      ${escapeHtml(title)}
                    </h1>

                    <!-- Real Game Banner Image (if available) -->
                    ${fullImageUrl ? `
                      <div style="margin-bottom:22px;overflow:hidden;border-radius:10px;border:1px solid #e2e8f0;background-color:#f8fafc;">
                        <img src="${escapeHtml(fullImageUrl)}" alt="${escapeHtml(title)}" width="516" style="width:100%;max-width:516px;height:auto;display:block;border:0;" />
                      </div>
                    ` : ''}

                    <!-- Real Game Price & Platform Bar (if available) -->
                    ${(price || originalPrice || platforms || discountTag) ? `
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border-radius:10px;padding:14px 18px;margin-bottom:24px;border:1px solid #e2e8f0;">
                        <tr>
                          <td align="left" style="vertical-align:middle;">
                            ${platforms ? `
                              <span style="display:inline-block;background-color:#ede9fe;color:#6d28d9;font-weight:800;padding:3px 10px;border-radius:5px;font-size:11px;margin-right:8px;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(platforms)}</span>
                            ` : ''}
                            <span style="color:#64748b;font-size:12px;font-weight:700;">
                              ${discountTag ? escapeHtml(discountTag) : 'Available live on Rakexura'}
                            </span>
                          </td>
                          <td align="right" style="vertical-align:middle;white-space:nowrap;">
                            ${discountPercentage ? `
                              <span style="background-color:#dcfce7;color:#15803d;font-size:12px;font-weight:900;padding:3px 8px;border-radius:4px;margin-right:8px;">-${discountPercentage}%</span>
                            ` : ''}
                            ${originalPrice ? `<span style="font-size:13px;color:#94a3b8;text-decoration:line-through;margin-right:8px;">₹${Number(originalPrice).toLocaleString("en-IN")}</span>` : ''}
                            ${price ? `<span style="font-size:18px;font-weight:900;color:#0f172a;">₹${Number(price).toLocaleString("en-IN")}</span>` : ''}
                          </td>
                        </tr>
                      </table>
                    ` : ''}

                    <!-- Message Body -->
                    <div style="font-size:15px;line-height:1.75;color:#334155;margin-bottom:32px;">
                      ${escapeHtml(message).replace(/\n/g, '<br />')}
                    </div>

                    <!-- Call To Action Button -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <a href="${escapeHtml(targetUrl)}" target="_blank" style="display:inline-block;background-color:#7c3aed;color:#ffffff;font-size:15px;font-weight:900;text-decoration:none;padding:15px 44px;border-radius:8px;box-shadow:0 4px 14px rgba(124,58,237,0.35);letter-spacing:0.3px;">
                            View Game on Rakexura
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Footer Disclaimer -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;margin-top:24px;text-align:left;">
                <tr>
                  <td style="font-size:12px;line-height:1.6;color:#94a3b8;">
                    <p style="margin:0 0 8px 0;">Specific pricing, stock, and platform options are subject to change. Please check the Rakexura Store page for live details.</p>
                    <p style="margin:0 0 16px 0;">You are receiving this notification email because you registered an account at Rakexura Store.</p>
                    <div style="border-top:1px solid #e2e8f0;padding-top:16px;font-size:11px;color:#94a3b8;">
                      <strong style="color:#64748b;text-transform:uppercase;letter-spacing:1px;">RAKEXURA STORE</strong> &bull; 
                      <a href="${siteUrl}/games" style="color:#64748b;text-decoration:underline;margin-left:4px;">Browse Store</a> &bull; 
                      <a href="${siteUrl}/support" style="color:#64748b;text-decoration:underline;margin-left:4px;">Support Desk</a>
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
  const brevoApiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS;
  if (brevoApiKey) {
    const brevoLogin = process.env.BREVO_SMTP_USER || process.env.SMTP_USER || "b30b46001@smtp-brevo.com";
    const senderEmail = process.env.EMAIL_FROM || "Rakexura Store <cheappcgamesrake@gmail.com>";

    if (nodemailer) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
          port: Number(process.env.SMTP_PORT || "587"),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: brevoLogin,
            pass: brevoApiKey,
          },
        });

        await transporter.sendMail({
          from: senderEmail,
          to: recipient,
          subject,
          text,
          html: html ?? textToHtml(text),
          attachments: getInlineAttachments(),
        });

        console.log(`[Brevo SMTP] Customer email successfully delivered to ${recipient}`);
        return { ok: true };
      } catch (smtpErr) {
        console.warn("[Brevo SMTP] Dispatch failed, trying fallbacks:", smtpErr);
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
