function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export type OtpEmailOptions = {
  otpCode: string;
  userName?: string;
  userEmail?: string;
  purpose?: string;
  expiresInMinutes?: number;
  ipAddress?: string;
};

export function buildOtpVerificationEmailHtml(options: OtpEmailOptions) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app").replace(/\/$/, "");
  const logoUrl = `${siteUrl}/images/rakexura-silver-badge.png`;
  const {
    otpCode,
    userName = "Gamer",
    userEmail,
    purpose = "account verification",
    expiresInMinutes = 10,
    ipAddress,
  } = options;

  const formattedCode = String(otpCode).trim();
  const digits = formattedCode.split("");

  const digitBoxesHtml = digits.length === 6
    ? digits
        .map(
          (d) => `
            <td align="center" style="padding:0 4px;">
              <div style="width:42px;height:50px;line-height:50px;background-color:#ffffff;border:2px solid #e2e8f0;border-radius:8px;font-size:24px;font-weight:900;color:#0f172a;font-family:monospace,Consolas,Courier,monospace;text-align:center;box-shadow:0 2px 5px rgba(0,0,0,0.04);">
                ${escapeHtml(d)}
              </div>
            </td>
          `
        )
        .join("")
    : `
        <td align="center">
          <div style="font-size:32px;font-weight:900;letter-spacing:10px;color:#0f172a;font-family:monospace,Consolas,Courier,monospace;">
            ${escapeHtml(formattedCode)}
          </div>
        </td>
      `;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Rakexura Verification Code</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f5f7;padding:36px 12px;">
      <tr>
        <td align="center">
          <!-- Clean White Card Container -->
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 32px;box-shadow:0 12px 35px rgba(0,0,0,0.06);text-align:center;">
            <tr>
              <td align="center">
                <!-- Top Brand Header with Shield Badge -->
                <div style="margin-bottom:24px;text-align:center;">
                  <img src="${logoUrl}" alt="Rakexura Logo" width="46" height="54" style="display:block;margin:0 auto 12px auto;border:0;outline:none;" />
                  <div style="font-size:18px;font-weight:900;letter-spacing:2px;color:#0f172a;text-transform:uppercase;">
                    RAKEXURA STORE
                  </div>
                </div>

                <!-- Security Pill Badge -->
                <div style="display:inline-block;background-color:#fefce8;border:1px solid #fef08a;padding:6px 16px;border-radius:999px;margin-bottom:20px;">
                  <span style="font-size:11px;font-weight:900;color:#854d0e;text-transform:uppercase;letter-spacing:1px;">
                    🛡️ ONE-TIME SECURITY CODE
                  </span>
                </div>

                <!-- Main Heading -->
                <h1 style="font-size:26px;font-weight:900;color:#0f172a;margin:0 0 12px 0;letter-spacing:-0.5px;line-height:1.2;">
                  Verify Your Account
                </h1>

                <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:8px;">
                  Hello ${escapeHtml(userName)}!
                </div>

                <p style="font-size:14px;line-height:1.6;color:#64748b;margin:0 auto 28px auto;max-width:440px;">
                  Please enter the verification code below to complete your ${escapeHtml(purpose)}. This code is valid for <strong>${expiresInMinutes} minutes</strong>.
                </p>

                <!-- OTP Code Display Card -->
                <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px 16px;margin-bottom:28px;text-align:center;">
                  <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;">
                    YOUR 6-DIGIT VERIFICATION CODE
                  </div>
                  
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                    <tr>
                      ${digitBoxesHtml}
                    </tr>
                  </table>

                  <div style="font-size:11px;color:#94a3b8;margin-top:14px;">
                    Click and hold code to copy
                  </div>
                </div>

                <!-- Security Warnings & Details Box -->
                <div style="background-color:#fffbeb;border:1px solid #fef3c7;border-radius:10px;padding:16px 18px;margin-bottom:28px;text-align:left;">
                  <div style="font-size:12px;font-weight:800;color:#92400e;margin-bottom:6px;">
                    ⚠️ Security Reminders:
                  </div>
                  <ul style="margin:0;padding-left:18px;font-size:12px;color:#78350f;line-height:1.6;">
                    <li>Never share this code with anyone. Rakexura staff will <strong>never</strong> ask for your verification code.</li>
                    <li>This code expires automatically in <strong>${expiresInMinutes} minutes</strong>.</li>
                    ${userEmail ? `<li>Sent specifically to <strong>${escapeHtml(userEmail)}</strong>.</li>` : ''}
                    ${ipAddress ? `<li>Requested from IP: <code style="font-family:monospace;font-size:11px;">${escapeHtml(ipAddress)}</code></li>` : ''}
                  </ul>
                </div>

                <p style="font-size:12px;color:#94a3b8;line-height:1.5;margin:0 0 28px 0;">
                  If you did not request this verification code, someone may have entered your email address by mistake. You can safely ignore this email or update your password.
                </p>

                <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px 0;" />

                <!-- Footer -->
                <div style="text-align:center;font-size:11px;line-height:1.6;color:#64748b;">
                  <div style="font-weight:800;color:#0f172a;margin-bottom:2px;">Rakexura Store Gaming Pvt Ltd</div>
                  <div style="font-size:10px;color:#94a3b8;margin-bottom:12px;">Authorized PC Game Reseller &middot; India</div>

                  <img src="${logoUrl}" alt="Rakexura Shield" width="22" height="26" style="display:block;margin:0 auto 10px auto;border:0;outline:none;opacity:0.8;" />

                  <div style="font-size:10px;color:#94a3b8;margin-bottom:8px;">&copy; 2026 Rakexura Store. All rights reserved.</div>

                  <div>
                    <a href="${siteUrl}/terms" style="color:#64748b;text-decoration:underline;margin:0 6px;">Terms of Service</a> |
                    <a href="${siteUrl}/privacy" style="color:#64748b;text-decoration:underline;margin:0 6px;">Privacy Policy</a> |
                    <a href="${siteUrl}/support" style="color:#64748b;text-decoration:underline;margin:0 6px;">Help Center</a>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function getSupabaseOtpEmailTemplateHtml(): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app").replace(/\/$/, "");
  const logoUrl = `${siteUrl}/images/rakexura-silver-badge.png`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Rakexura Verification Code</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f5f7;padding:36px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 32px;box-shadow:0 12px 35px rgba(0,0,0,0.06);text-align:center;">
            <tr>
              <td align="center">
                <div style="margin-bottom:24px;text-align:center;">
                  <img src="${logoUrl}" alt="Rakexura Logo" width="46" height="54" style="display:block;margin:0 auto 12px auto;border:0;outline:none;" />
                  <div style="font-size:18px;font-weight:900;letter-spacing:2px;color:#0f172a;text-transform:uppercase;">
                    RAKEXURA STORE
                  </div>
                </div>

                <div style="display:inline-block;background-color:#fefce8;border:1px solid #fef08a;padding:6px 16px;border-radius:999px;margin-bottom:20px;">
                  <span style="font-size:11px;font-weight:900;color:#854d0e;text-transform:uppercase;letter-spacing:1px;">
                    🛡️ ONE-TIME SECURITY CODE
                  </span>
                </div>

                <h1 style="font-size:26px;font-weight:900;color:#0f172a;margin:0 0 12px 0;letter-spacing:-0.5px;line-height:1.2;">
                  Verify Your Account
                </h1>

                <p style="font-size:14px;line-height:1.6;color:#64748b;margin:0 auto 28px auto;max-width:440px;">
                  Please enter the verification code below to complete your login or registration. This code is valid for <strong>10 minutes</strong>.
                </p>

                <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px 16px;margin-bottom:28px;text-align:center;">
                  <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">
                    YOUR 6-DIGIT VERIFICATION CODE
                  </div>
                  <div style="font-size:36px;font-weight:900;letter-spacing:12px;color:#0f172a;font-family:monospace,Consolas,Courier,monospace;padding:10px 0;">
                    {{ .Token }}
                  </div>
                  <div style="font-size:11px;color:#94a3b8;margin-top:10px;">
                    Copy and paste this code in your verification prompt
                  </div>
                </div>

                <div style="background-color:#fffbeb;border:1px solid #fef3c7;border-radius:10px;padding:16px 18px;margin-bottom:28px;text-align:left;">
                  <div style="font-size:12px;font-weight:800;color:#92400e;margin-bottom:6px;">
                    ⚠️ Security Reminders:
                  </div>
                  <ul style="margin:0;padding-left:18px;font-size:12px;color:#78350f;line-height:1.6;">
                    <li>Never share this code with anyone. Rakexura staff will never ask for your code.</li>
                    <li>This code expires in <strong>10 minutes</strong>.</li>
                  </ul>
                </div>

                <p style="font-size:12px;color:#94a3b8;line-height:1.5;margin:0 0 28px 0;">
                  If you did not request this code, you can safely ignore this email.
                </p>

                <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px 0;" />

                <div style="text-align:center;font-size:11px;line-height:1.6;color:#64748b;">
                  <div style="font-weight:800;color:#0f172a;margin-bottom:2px;">Rakexura Store Gaming Pvt Ltd</div>
                  <div style="font-size:10px;color:#94a3b8;margin-bottom:8px;">&copy; 2026 Rakexura Store. All rights reserved.</div>
                  <div>
                    <a href="${siteUrl}/terms" style="color:#64748b;text-decoration:underline;margin:0 6px;">Terms</a> |
                    <a href="${siteUrl}/privacy" style="color:#64748b;text-decoration:underline;margin:0 6px;">Privacy</a> |
                    <a href="${siteUrl}/support" style="color:#64748b;text-decoration:underline;margin:0 6px;">Support</a>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export type AdminAlertField = {
  label: string;
  value: string;
  isLink?: boolean;
  linkHref?: string;
  isMono?: boolean;
};

export type AdminAlertEmailOptions = {
  badgeText?: string;
  title: string;
  subtitle?: string;
  fields: AdminAlertField[];
  actionButton?: {
    label: string;
    url: string;
  };
  footerNote?: string;
};

export function buildAdminAlertEmailHtml(options: AdminAlertEmailOptions) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app").replace(/\/$/, "");
  const logoUrl = `${siteUrl}/images/rakexura-silver-badge.png`;
  const {
    badgeText = "STORE ALERT",
    title,
    subtitle = "Automated notification from Rakexura Store",
    fields,
    actionButton,
    footerNote = "Automated Admin Notification • Internal Confidential",
  } = options;

  const fieldCardsHtml = fields
    .map((field) => {
      let valContent = escapeHtml(field.value);

      if (field.isLink && field.linkHref) {
        valContent = `<a href="${escapeHtml(field.linkHref)}" style="color:#0284c7;text-decoration:underline;font-weight:700;word-break:break-all;">${valContent}</a>`;
      } else if (field.isMono) {
        valContent = `<div style="font-family:monospace,Consolas,Courier,monospace;font-size:12px;font-weight:700;color:#0f172a;background-color:#ffffff;padding:8px 12px;border-radius:6px;border:1px solid #e2e8f0;word-break:break-all;display:block;margin-top:4px;">${valContent}</div>`;
      }

      return `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:10px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;width:100%;">
          <tr>
            <td style="padding:14px 16px;text-align:left;">
              <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;line-height:1.2;">
                ${escapeHtml(field.label)}
              </div>
              <div style="font-size:14px;font-weight:700;color:#0f172a;word-break:break-word;line-height:1.4;">
                ${valContent}
              </div>
            </td>
          </tr>
        </table>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f5f7;padding:36px 12px;">
          <tr>
            <td align="center">
              
              <!-- Clean White Card Container (Epic Games / Apple Style) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 32px;text-align:center;box-shadow:0 12px 35px rgba(0,0,0,0.06);">
                <tr>
                  <td align="center">
                    
                    <!-- Top Brand Header with Shield Badge -->
                    <div style="margin-bottom:20px;text-align:center;">
                      <img src="${logoUrl}" alt="Rakexura Shield" width="46" height="54" style="display:block;margin:0 auto 12px auto;border:0;outline:none;" />
                      <div style="font-size:18px;font-weight:900;letter-spacing:2px;color:#0f172a;text-transform:uppercase;">
                        RAKEXURA STORE
                      </div>
                    </div>

                    <!-- Category Pill Badge -->
                    <div style="margin-bottom:18px;">
                      <span style="display:inline-block;padding:5px 14px;background-color:#f1f5f9;border:1px solid #cbd5e1;border-radius:999px;font-size:11px;font-weight:900;color:#475569;letter-spacing:1.2px;text-transform:uppercase;">
                        ${escapeHtml(badgeText)}
                      </span>
                    </div>

                    <!-- Title & Subtitle -->
                    <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;line-height:1.25;">
                      ${escapeHtml(title)}
                    </h1>
                    <p style="margin:0 0 24px 0;font-size:14px;color:#64748b;line-height:1.5;">
                      ${escapeHtml(subtitle)}
                    </p>

                    <!-- Stacked Clean Field Tiles -->
                    <div style="margin-bottom:24px;">
                      ${fieldCardsHtml}
                    </div>

                    <!-- Epic Solid Action Button (if provided) -->
                    ${
                      actionButton
                        ? `
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
                        <tr>
                          <td align="center">
                            <a href="${escapeHtml(actionButton.url)}" target="_blank" style="display:inline-block;width:90%;max-width:320px;background-color:#18181b;color:#ffffff;font-size:13px;font-weight:900;text-decoration:none;padding:15px 24px;border-radius:10px;text-transform:uppercase;letter-spacing:0.8px;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,0.12);">
                              ${escapeHtml(actionButton.label)} &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>
                    `
                        : ""
                    }

                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 20px 0;" />

                    <!-- Footer Details -->
                    <div style="text-align:center;font-size:11px;line-height:1.6;color:#64748b;">
                      <div style="font-weight:800;color:#0f172a;margin-bottom:2px;">Rakexura Store Gaming Pvt Ltd</div>
                      <div style="font-size:10px;color:#94a3b8;margin-bottom:8px;">&copy; 2026 Rakexura Store &bull; ${escapeHtml(footerNote)}</div>
                      <div>
                        <a href="${siteUrl}/admin" style="color:#64748b;text-decoration:underline;margin:0 6px;">Admin Panel</a> |
                        <a href="${siteUrl}/support" style="color:#64748b;text-decoration:underline;margin:0 6px;">Support Desk</a>
                      </div>
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
