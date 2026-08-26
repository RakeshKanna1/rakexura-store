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
  const {
    otpCode,
    expiresInMinutes = 15,
  } = options;

  const formattedCode = String(otpCode).trim();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Rakexura Verification Code</title>
  </head>
  <body style="margin:0;padding:0;background-color:#faebd7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#faebd7;padding:48px 16px 64px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:460px;text-align:center;margin:0 auto;">
            <tr>
              <td align="center">
                <!-- Brand Title in Editorial Serif -->
                <h1 style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:42px;font-weight:900;color:#111111;margin:0 0 16px 0;letter-spacing:-1px;line-height:1;">
                  Rakexura
                </h1>

                <!-- Subheading -->
                <h2 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;color:#111111;margin:0 0 22px 0;letter-spacing:-0.2px;line-height:1.3;">
                  Let's get you signed in
                </h2>

                <!-- Intro copy -->
                <p style="font-size:14px;line-height:1.65;color:#333333;margin:0 auto 28px auto;max-width:390px;">
                  We use this easy login code so you don't have to remember or type in yet another long password.
                </p>

                <!-- Code prompt label -->
                <div style="font-size:13px;font-weight:600;color:#111111;margin-bottom:10px;text-align:left;max-width:420px;padding-left:4px;">
                  Your login code is:
                </div>

                <!-- Clean white code pill container -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:420px;margin:0 auto;background-color:#ffffff;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,0.03);border:1px solid rgba(0,0,0,0.04);">
                  <tr>
                    <td align="center" style="padding:22px 24px;">
                      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:34px;font-weight:700;letter-spacing:14px;color:#111111;line-height:1;margin-left:14px;">
                        ${escapeHtml(formattedCode)}
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Note below pill -->
                <div style="font-size:12px;color:#666666;margin-top:12px;margin-bottom:44px;">
                  Please note this code is only valid for ${expiresInMinutes} minutes.
                </div>

                <!-- Questions / Support -->
                <div style="font-size:16px;font-weight:600;color:#111111;margin-bottom:8px;">
                  Have questions or trouble logging in?
                </div>
                <div style="font-size:13px;color:#333333;margin-bottom:52px;line-height:1.5;">
                  Just reply to this email or contact <a href="mailto:support@rakexura.store" style="color:#4f46e5;text-decoration:underline;">support@rakexura.store</a>
                </div>

                <!-- Sign off -->
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#666666;margin-bottom:4px;">
                  Happy Gaming,
                </div>
                <div style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#111111;letter-spacing:-0.5px;">
                  The Rakexura Team
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
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Rakexura Verification Code</title>
  </head>
  <body style="margin:0;padding:0;background-color:#faebd7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#faebd7;padding:48px 16px 64px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:460px;text-align:center;margin:0 auto;">
            <tr>
              <td align="center">
                <!-- Brand Title in Editorial Serif -->
                <h1 style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:42px;font-weight:900;color:#111111;margin:0 0 16px 0;letter-spacing:-1px;line-height:1;">
                  Rakexura
                </h1>

                <!-- Subheading -->
                <h2 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;color:#111111;margin:0 0 22px 0;letter-spacing:-0.2px;line-height:1.3;">
                  Let's get you signed in
                </h2>

                <!-- Intro copy -->
                <p style="font-size:14px;line-height:1.65;color:#333333;margin:0 auto 28px auto;max-width:390px;">
                  We use this easy login code so you don't have to remember or type in yet another long password.
                </p>

                <!-- Code prompt label -->
                <div style="font-size:13px;font-weight:600;color:#111111;margin-bottom:10px;text-align:left;max-width:420px;padding-left:4px;">
                  Your login code is:
                </div>

                <!-- Clean white code pill container -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:420px;margin:0 auto;background-color:#ffffff;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,0.03);border:1px solid rgba(0,0,0,0.04);">
                  <tr>
                    <td align="center" style="padding:22px 24px;">
                      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:34px;font-weight:700;letter-spacing:14px;color:#111111;line-height:1;margin-left:14px;">
                        {{ .Token }}
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Note below pill -->
                <div style="font-size:12px;color:#666666;margin-top:12px;margin-bottom:44px;">
                  Please note this code is only valid for 15 minutes.
                </div>

                <!-- Questions / Support -->
                <div style="font-size:16px;font-weight:600;color:#111111;margin-bottom:8px;">
                  Have questions or trouble logging in?
                </div>
                <div style="font-size:13px;color:#333333;margin-bottom:52px;line-height:1.5;">
                  Just reply to this email or contact <a href="mailto:support@rakexura.store" style="color:#4f46e5;text-decoration:underline;">support@rakexura.store</a>
                </div>

                <!-- Sign off -->
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#666666;margin-bottom:4px;">
                  Happy Gaming,
                </div>
                <div style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#111111;letter-spacing:-0.5px;">
                  The Rakexura Team
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
