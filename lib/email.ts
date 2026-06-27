import "server-only";
// @ts-expect-error - nodemailer types are not locally installed in devDependencies
import nodemailer from "nodemailer";

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
  return `
    <div style="margin:0;background:#070708;padding:48px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7">
      <div style="max-width:580px;margin:auto;border:1px solid rgba(255,255,255,0.08);border-radius:12px;background:#0f0f11;padding:40px;box-shadow:0 10px 30px rgba(0,0,0,0.4);">
        <header style="border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:20px;text-align:center;">
          <h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:.03em;color:#ffffff;">RAKEXURA</h1>
          <span style="font-size:11px;color:#8b5cf6;font-weight:800;letter-spacing:.1em;text-transform:uppercase;">PC Game Store</span>
        </header>
        <div style="padding:24px 0;font-size:14px;line-height:1.8;color:#e4e4e7;">
          ${escapeHtml(text).replace(/\n/g, "<br />")}
        </div>
        <footer style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;text-align:center;color:#646b7b;font-size:11px;line-height:1.6;">
          <p style="margin:0;">Secure assisted game delivery by Rakexura Store.</p>
          <p style="margin:4px 0 0;">Need activation help or support? Chat on WhatsApp.</p>
        </footer>
      </div>
    </div>
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
      const response = await fetch("https://api.resend.com/emails", {
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
