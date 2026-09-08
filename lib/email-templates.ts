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
    expiresInMinutes = 15,
    ipAddress,
  } = options;

  const formattedCode = String(otpCode).trim();
  const digits = formattedCode.split("");

  const digitBoxesHtml =
    digits.length === 6
      ? digits
          .map(
            (d) => `
            <td align="center" style="padding:0 4px;">
              <div style="width:42px;height:52px;line-height:52px;background-color:#ffffff;border:2px solid #e2e8f0;border-radius:8px;font-size:24px;font-weight:900;color:#0f172a;font-family:'Courier New',Consolas,Menlo,monospace;text-align:center;box-shadow:0 2px 5px rgba(0,0,0,0.04);">
                ${escapeHtml(d)}
              </div>
            </td>
          `
          )
          .join("")
      : `
        <td align="center">
          <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#0f172a;font-family:'Courier New',Consolas,Menlo,monospace;line-height:1;margin-left:10px;">
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
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f5f7;padding:40px 16px;">
      <tr>
        <td align="center">
          <!-- Clean White Card Container (Epic Games Style) -->
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 32px;box-shadow:0 12px 35px rgba(0,0,0,0.06);text-align:center;">
            <tr>
              <td align="center">
                <!-- Top Brand Header with Shield Badge -->
                <div style="margin-bottom:22px;text-align:center;">
                  <img src="${logoUrl}" alt="Rakexura Logo" width="46" height="54" style="display:block;margin:0 auto 12px auto;border:0;outline:none;" />
                  <div style="font-size:18px;font-weight:900;letter-spacing:2px;color:#0f172a;text-transform:uppercase;">
                    RAKEXURA STORE
                  </div>
                </div>

                <!-- Security Badge -->
                <div style="margin-bottom:22px;text-align:center;">
                  <span style="display:inline-block;padding:5px 12px;background-color:#0f172a;border:1px solid #1e293b;border-radius:4px;font-size:10px;font-weight:900;color:#ffffff;letter-spacing:1.8px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    SECURITY VERIFICATION CODE
                  </span>
                </div>

                <!-- Main Heading -->
                <h1 style="font-size:26px;font-weight:900;color:#0f172a;margin:0 0 10px 0;letter-spacing:-0.5px;line-height:1.2;">
                  Your Code is Here
                </h1>

                <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:8px;">
                  Hello ${escapeHtml(userName)}!
                </div>

                <p style="font-size:14px;line-height:1.6;color:#64748b;margin:0 auto 26px auto;max-width:440px;">
                  Please enter the verification code below to complete your ${escapeHtml(purpose)}. This code is valid for <strong>${expiresInMinutes} minutes</strong>.
                </p>

                <!-- OTP Code Display Card -->
                <div style="background-color:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:24px 16px;margin-bottom:26px;text-align:center;">
                  <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;">
                    YOUR 6-DIGIT VERIFICATION CODE
                  </div>
                  
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                    <tr>
                      ${digitBoxesHtml}
                    </tr>
                  </table>

                  <div style="font-size:11px;color:#94a3b8;margin-top:14px;">
                    Enter this code in your verification prompt
                  </div>
                </div>

                <!-- Security Warnings & Details Box -->
                <div style="background-color:#fffbeb;border:1px solid #fef3c7;border-radius:10px;padding:14px 18px;margin-bottom:26px;text-align:left;">
                  <div style="font-size:12px;font-weight:800;color:#92400e;margin-bottom:6px;">
                    &#9888;&#65039; Security Reminders:
                  </div>
                  <ul style="margin:0;padding-left:18px;font-size:12px;color:#78350f;line-height:1.6;">
                    <li>Never share this code with anyone. Rakexura staff will <strong>never</strong> ask for your verification code.</li>
                    <li>This code expires automatically in <strong>${expiresInMinutes} minutes</strong>.</li>
                    ${userEmail ? `<li>Sent specifically to <strong>${escapeHtml(userEmail)}</strong>.</li>` : ""}
                    ${ipAddress ? `<li>Requested from IP: <code style="font-family:monospace;font-size:11px;">${escapeHtml(ipAddress)}</code></li>` : ""}
                  </ul>
                </div>

                <p style="font-size:12px;color:#94a3b8;line-height:1.5;margin:0 0 26px 0;">
                  If you did not request this verification code, someone may have entered your email address by mistake. You can safely ignore this email.
                </p>

                <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px 0;" />

                <!-- Footer -->
                <div style="text-align:center;font-size:11px;line-height:1.6;color:#64748b;">
                  <div style="font-weight:800;color:#0f172a;margin-bottom:2px;">Rakexura Store Gaming Pvt Ltd</div>
                  <div style="font-size:10px;color:#94a3b8;margin-bottom:12px;">Authorized PC Game Reseller &middot; India</div>

                  <img src="${logoUrl}" alt="Rakexura Shield" width="22" height="26" style="display:block;margin:0 auto 10px auto;border:0;outline:none;opacity:0.8;" />

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

export function getSupabaseOtpEmailTemplateHtml(): string {
  const siteUrl = "https://rakexura-store.vercel.app";
  const logoUrl = "https://rakexura-store.vercel.app/images/rakexura-silver-badge.png";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Rakexura Verification Code</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f5f7;padding:40px 16px;">
      <tr>
        <td align="center">
          <!-- Clean White Card Container (Epic Games Style) -->
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 32px;box-shadow:0 12px 35px rgba(0,0,0,0.06);text-align:center;">
            <tr>
              <td align="center">
                <!-- Top Brand Header with Shield Badge -->
                <div style="margin-bottom:22px;text-align:center;">
                  <img src="${logoUrl}" alt="Rakexura Logo" width="46" height="54" style="display:block;margin:0 auto 12px auto;border:0;outline:none;" />
                  <div style="font-size:18px;font-weight:900;letter-spacing:2px;color:#0f172a;text-transform:uppercase;">
                    RAKEXURA STORE
                  </div>
                </div>

                <!-- Security Badge -->
                <div style="margin-bottom:22px;text-align:center;">
                  <span style="display:inline-block;padding:5px 12px;background-color:#0f172a;border:1px solid #1e293b;border-radius:4px;font-size:10px;font-weight:900;color:#ffffff;letter-spacing:1.8px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    SECURITY VERIFICATION CODE
                  </span>
                </div>

                <!-- Main Heading -->
                <h1 style="font-size:26px;font-weight:900;color:#0f172a;margin:0 0 10px 0;letter-spacing:-0.5px;line-height:1.2;">
                  Your Code is Here
                </h1>

                <p style="font-size:14px;line-height:1.6;color:#64748b;margin:0 auto 26px auto;max-width:440px;">
                  Please enter the verification code below to complete your sign in. This code is valid for <strong>15 minutes</strong>.
                </p>

                <!-- OTP Code Display Card -->
                <div style="background-color:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:24px 16px;margin-bottom:26px;text-align:center;">
                  <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">
                    YOUR 6-DIGIT VERIFICATION CODE
                  </div>
                  <div style="font-size:38px;font-weight:900;letter-spacing:12px;color:#0f172a;font-family:'Courier New',Consolas,Menlo,monospace;line-height:1;margin-left:12px;padding:6px 0;">
                    {{ .Token }}
                  </div>
                  <div style="font-size:11px;color:#94a3b8;margin-top:12px;">
                    Enter this code in your verification prompt
                  </div>
                </div>

                <!-- Security Warnings & Details Box -->
                <div style="background-color:#fffbeb;border:1px solid #fef3c7;border-radius:10px;padding:14px 18px;margin-bottom:26px;text-align:left;">
                  <div style="font-size:12px;font-weight:800;color:#92400e;margin-bottom:6px;">
                    &#9888;&#65039; Security Reminders:
                  </div>
                  <ul style="margin:0;padding-left:18px;font-size:12px;color:#78350f;line-height:1.6;">
                    <li>Never share this code with anyone. Rakexura staff will <strong>never</strong> ask for your code.</li>
                    <li>This code expires automatically in <strong>15 minutes</strong>.</li>
                  </ul>
                </div>

                <p style="font-size:12px;color:#94a3b8;line-height:1.5;margin:0 0 26px 0;">
                  If you did not request this verification code, someone may have entered your email address by mistake. You can safely ignore this email.
                </p>

                <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px 0;" />

                <!-- Footer -->
                <div style="text-align:center;font-size:11px;line-height:1.6;color:#64748b;">
                  <div style="font-weight:800;color:#0f172a;margin-bottom:2px;">Rakexura Store Gaming Pvt Ltd</div>
                  <div style="font-size:10px;color:#94a3b8;margin-bottom:12px;">Authorized PC Game Reseller &middot; India</div>

                  <img src="${logoUrl}" alt="Rakexura Shield" width="22" height="26" style="display:block;margin:0 auto 10px auto;border:0;outline:none;opacity:0.8;" />

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
  const {
    badgeText,
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
        valContent = `<a href="${escapeHtml(field.linkHref)}" style="color:#111111;text-decoration:underline;font-weight:700;word-break:break-all;">${valContent}</a>`;
      } else if (field.isMono) {
        valContent = `<div style="font-family:monospace,Consolas,Courier,monospace;font-size:12px;font-weight:700;color:#111111;background-color:#f7f2eb;padding:8px 12px;border-radius:8px;border:1px solid rgba(0,0,0,0.06);word-break:break-all;display:block;margin-top:4px;">${valContent}</div>`;
      }

      return `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:8px;background-color:#ffffff;border:1px solid rgba(0,0,0,0.04);border-radius:4px;width:100%;">
          <tr>
            <td style="padding:14px 16px;text-align:left;">
              <div style="font-size:11px;font-weight:800;color:#777777;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;line-height:1.2;">
                ${escapeHtml(field.label)}
              </div>
              <div style="font-size:14px;font-weight:700;color:#111111;word-break:break-word;line-height:1.45;">
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
      <body style="margin:0;padding:0;background-color:#faebd7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;-webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#faebd7;padding:48px 16px 64px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:440px;text-align:center;margin:0 auto;">
                <tr>
                  <td align="center">
                    
                    ${badgeText ? `
                      <div style="display:inline-block;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#777777;margin-bottom:12px;">
                        ${escapeHtml(badgeText)}
                      </div>
                    ` : ''}

                    <!-- Brand Title in Editorial Serif -->
                    <h1 style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:42px;font-weight:900;color:#111111;margin:0 0 16px 0;letter-spacing:-1px;line-height:1;">
                      Rakexura
                    </h1>

                    <!-- Subheading Title -->
                    <h2 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;color:#111111;margin:0 0 10px 0;letter-spacing:-0.4px;line-height:1.3;">
                      ${escapeHtml(title)}
                    </h2>

                    <!-- Intro copy -->
                    <p style="font-size:14px;line-height:1.6;color:#444444;margin:0 auto 26px auto;max-width:390px;">
                      ${escapeHtml(subtitle)}
                    </p>

                    <!-- Clean Field Cards -->
                    <div style="margin-bottom:26px;text-align:left;">
                      ${fieldCardsHtml}
                    </div>

                    <!-- Action Button (if provided) -->
                    ${
                      actionButton
                        ? `
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:36px;">
                        <tr>
                          <td align="center">
                            <a href="${escapeHtml(actionButton.url)}" target="_blank" style="display:inline-block;background-color:#111111;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:6px;text-align:center;letter-spacing:-0.2px;">
                              ${escapeHtml(actionButton.label)} &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>
                    `
                        : ""
                    }

                    <!-- Sign off -->
                    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#666666;margin-bottom:4px;">
                      Happy Gaming,
                    </div>
                    <div style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#111111;letter-spacing:-0.5px;margin-bottom:28px;">
                      The Rakexura Team
                    </div>

                    <div style="border-top:1px solid rgba(0,0,0,0.08);padding-top:20px;font-size:11px;line-height:1.6;color:#777777;">
                      <div style="font-weight:700;color:#111111;margin-bottom:2px;">Rakexura Store Gaming Pvt Ltd</div>
                      <div style="font-size:10px;color:#888888;margin-bottom:8px;">&copy; 2026 Rakexura Store &bull; ${escapeHtml(footerNote)}</div>
                      <div>
                        <a href="${siteUrl}/admin" style="color:#555555;text-decoration:underline;margin:0 6px;">Admin Panel</a> |
                        <a href="${siteUrl}/support" style="color:#555555;text-decoration:underline;margin:0 6px;">Support Desk</a>
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

export type WishlistSaleEmailOptions = {
  gameTitle: string;
  gameSlug?: string;
  gameImageUrl?: string | null;
  tagline?: string | null;
  salePrice: number | string;
  originalPrice?: number | string | null;
  discountPercentage?: number | string | null;
  saleTag?: string | null;
  offerEndsText?: string | null;
  platform?: string | null;
  wishlistUrl?: string | null;
  gameUrl?: string | null;
  userName?: string | null;
};

export function buildWishlistSaleEmailHtml(options: WishlistSaleEmailOptions): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app").replace(/\/$/, "");
  const logoUrl = `${siteUrl}/images/rakexura-silver-badge.png`;
  
  const {
    gameTitle,
    gameSlug,
    gameImageUrl,
    tagline = "Explore high-octane driving landscapes with hundreds of world-class cars in this acclaimed open-world blockbuster.",
    salePrice,
    originalPrice,
    discountPercentage,
    wishlistUrl,
    gameUrl,
  } = options;

  const effectiveWishlistUrl: string = wishlistUrl || `${siteUrl}/wishlist`;
  const effectiveGameUrl: string = gameUrl || (gameSlug ? `${siteUrl}/games/${gameSlug}` : effectiveWishlistUrl);

  let fullImageUrl: string | null = null;
  if (gameImageUrl) {
    fullImageUrl = gameImageUrl.startsWith("http://") || gameImageUrl.startsWith("https://")
      ? gameImageUrl
      : `${siteUrl}${gameImageUrl.startsWith("/") ? gameImageUrl : `/${gameImageUrl}`}`;
  }

  const discountVal = discountPercentage 
    ? Number(discountPercentage) 
    : (originalPrice && salePrice && Number(originalPrice) > Number(salePrice))
      ? Math.round(((Number(originalPrice) - Number(salePrice)) / Number(originalPrice)) * 100)
      : null;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(gameTitle)} is on sale!</title>
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;padding:36px 12px 64px 12px;">
      <tr>
        <td align="center">
          
          <!-- Steam-Style Centered Dark Theme Square Box (Sharp Edges, No Curves) -->
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#171d28;margin:0 auto;text-align:center;">
            
            <!-- 1. Header with Rakexura Logo & Store Title -->
            <tr>
              <td align="center" style="padding:28px 24px 16px 24px;">
                <img src="${logoUrl}" alt="Rakexura" width="34" height="40" style="display:block;margin:0 auto 8px auto;border:0;outline:none;" />
                <div style="font-size:14px;font-weight:900;letter-spacing:2px;color:#ffffff;text-transform:uppercase;">
                  RAKEXURA STORE
                </div>
              </td>
            </tr>

            <!-- 2. Steam-Style Wishlist Alert Heading -->
            <tr>
              <td align="center" style="padding:8px 24px 20px 24px;">
                <h1 style="margin:0;font-size:18px;font-weight:900;letter-spacing:0.5px;color:#ffffff;text-transform:uppercase;line-height:1.3;">
                  1 GAME YOU'VE WISHED FOR IS ON SALE!
                </h1>
              </td>
            </tr>

            <!-- 3. Artwork Key Art Banner (Sharp Rectangular, No Curves) -->
            ${fullImageUrl ? `
              <tr>
                <td style="padding:0 24px 16px 24px;">
                  <a href="${escapeHtml(effectiveGameUrl)}" target="_blank" style="display:block;text-decoration:none;">
                    <img src="${escapeHtml(fullImageUrl)}" alt="${escapeHtml(gameTitle)}" style="width:100%;max-width:492px;height:auto;display:block;border-radius:0;border:0;" />
                  </a>
                </td>
              </tr>
            ` : ''}

            <!-- 4. Subtle Small Price Row -->
            ${salePrice ? `
              <tr>
                <td style="padding:0 24px 16px 24px;">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                    <tr>
                      ${discountVal ? `
                        <td style="padding-right:8px;vertical-align:middle;">
                          <span style="background-color:#5c8829;color:#a4d007;font-size:13px;font-weight:900;padding:4px 8px;border-radius:0;display:inline-block;">
                            -${discountVal}%
                          </span>
                        </td>
                      ` : ''}
                      ${originalPrice ? `
                        <td style="padding-right:8px;vertical-align:middle;">
                          <span style="font-size:13px;color:#8991a6;text-decoration:line-through;font-weight:600;">
                            ₹${Number(originalPrice).toLocaleString("en-IN")}
                          </span>
                        </td>
                      ` : ''}
                      <td style="vertical-align:middle;">
                        <span style="font-size:15px;font-weight:900;color:#ffffff;">
                          ₹${Number(salePrice).toLocaleString("en-IN")}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            ` : ''}

            <!-- 5. Game Description -->
            ${tagline ? `
              <tr>
                <td style="padding:0 28px 24px 28px;">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#8f98a0;text-align:center;">
                    ${escapeHtml(tagline)}
                  </p>
                </td>
              </tr>
            ` : ''}

            <!-- 6. Steam-Style Action Button (Sharp Edges, No Curves) -->
            <tr>
              <td align="center" style="padding:0 24px 32px 24px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <a href="${escapeHtml(effectiveGameUrl)}" target="_blank" style="display:inline-block;width:100%;max-width:320px;background-color:#214b6b;background:linear-gradient(90deg,#225883,#1b3d5b);color:#ffffff;font-size:13px;font-weight:800;text-decoration:none;padding:14px 20px;border-radius:0;text-align:center;letter-spacing:0.5px;text-transform:uppercase;border:1px solid #3d7ea6;box-sizing:border-box;">
                        View Your Wishlist &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>

          <!-- 7. Outer White Footer (Steam Reference) -->
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;margin:24px auto 0 auto;text-align:left;font-size:11px;line-height:1.6;color:#6b7280;">
            <tr>
              <td style="padding:0 8px;">
                <p style="margin:0 0 6px 0;">
                  Specific pricing and discounts may be subject to change. Please check the Rakexura store page for details.
                </p>
                <p style="margin:0 0 16px 0;color:#9ca3af;">
                  You are receiving this email because <strong>${escapeHtml(gameTitle)}</strong> is on your Rakexura Wishlist.
                </p>
                <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
                  <a href="${siteUrl}/games" style="color:#4b5563;text-decoration:underline;margin-right:12px;font-weight:600;">Browse Store</a> &bull;
                  <a href="${escapeHtml(effectiveWishlistUrl)}" style="color:#4b5563;text-decoration:underline;margin:0 12px;font-weight:600;">My Wishlist</a> &bull;
                  <a href="${siteUrl}/support" style="color:#4b5563;text-decoration:underline;margin-left:12px;font-weight:600;">Support Desk</a>
                </div>
                <div style="margin-top:8px;font-size:10px;color:#9ca3af;">
                  &copy; 2026 Rakexura Store Gaming Pvt Ltd &bull; All rights reserved.
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

export type DeviceNotificationInviteEmailOptions = {
  userName?: string;
  settingsUrl?: string;
};

export function buildDeviceNotificationInviteEmailHtml(options: DeviceNotificationInviteEmailOptions = {}) {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app";
  const siteUrl = (rawSiteUrl.includes("localhost") || rawSiteUrl.includes("127.0.0.1"))
    ? "https://rakexura-store.vercel.app"
    : rawSiteUrl.replace(/\/$/, "");

  const logoUrl = `${siteUrl}/images/rakexura-silver-badge.png`;
  const settingsUrl = options.settingsUrl || `${siteUrl}/dashboard/settings`;
  const displayName = options.userName?.trim() || "Gamer";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Enable Device Notifications – Rakexura Store</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0b0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0d14;padding:36px 12px;">
      <tr>
        <td align="center">
          
          <!-- Outer Card Container -->
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#121622;border:1px solid #23293a;border-radius:16px;padding:36px 28px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,0.6);">
            <tr>
              <td align="center">
                
                <!-- Brand Badge & Header -->
                <div style="margin-bottom:20px;text-align:center;">
                  <img src="${logoUrl}" alt="Rakexura Shield" width="48" height="56" style="display:block;margin:0 auto 14px auto;border:0;outline:none;" />
                  <div style="font-size:20px;font-weight:900;color:#ffffff;letter-spacing:2px;text-transform:uppercase;line-height:1;">
                    RAKEXURA STORE
                  </div>
                  <div style="margin-top:10px;">
                    <span style="display:inline-block;background-color:rgba(139,92,246,0.15);color:#c084fc;font-size:10px;font-weight:800;padding:4px 12px;border-radius:12px;border:1px solid rgba(139,92,246,0.3);text-transform:uppercase;letter-spacing:1px;">
                      INSTANT STATUS RADAR
                    </span>
                  </div>
                </div>

                <hr style="border:none;border-top:1px solid #23293a;margin:16px 0 24px 0;" />

                <!-- Main Greeting & Headline -->
                <h1 style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1.3;margin:0 0 14px 0;">
                  Never Miss a Game Delivery!
                </h1>
                <p style="font-size:14px;line-height:1.65;color:#94a3b8;margin:0 auto 28px auto;max-width:440px;">
                  Hi <strong style="color:#ffffff;">${escapeHtml(displayName)}</strong>, stay updated with instant lock-screen alerts for your game deliveries, account activations, and flash sales.
                </p>

                <!-- Value Highlights Grid / List -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#181d2c;border:1px solid #262e42;border-radius:12px;padding:18px 20px;margin-bottom:30px;text-align:left;">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #232a3d;font-size:13px;line-height:1.5;color:#e2e8f0;">
                      <strong style="color:#facc15;">⚡ Instant Delivery Alerts:</strong> Get notified the moment your game credentials & keys are uploaded.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #232a3d;font-size:13px;line-height:1.5;color:#e2e8f0;">
                      <strong style="color:#38bdf8;">🏷️ Price Drops & Flash Sales:</strong> Be the first to grab high-discount game bundles before keys sell out.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;font-size:13px;line-height:1.5;color:#e2e8f0;">
                      <strong style="color:#4ade80;">🛡️ Account & Order Support:</strong> Real-time status updates directly on your phone or PC.
                    </td>
                  </tr>
                </table>

                <!-- Primary Call to Action Button -->
                <div style="margin-bottom:28px;">
                  <a href="${escapeHtml(settingsUrl)}" target="_blank" style="display:inline-block;background-color:#7c3aed;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:16px 36px;border-radius:10px;text-transform:uppercase;letter-spacing:0.6px;box-shadow:0 8px 25px rgba(124,58,237,0.4);border:1px solid #a78bfa;">
                    Enable Push Notifications &rarr;
                  </a>
                </div>

                <div style="font-size:12px;color:#64748b;line-height:1.5;margin-bottom:28px;">
                  Takes 5 seconds: Click the button above &rarr; Go to Settings &rarr; Click <strong>"Enable Notifications"</strong> and tap <strong>Allow</strong>.
                </div>

                <hr style="border:none;border-top:1px solid #23293a;margin:24px 0 20px 0;" />

                <!-- Clean Single Footer -->
                <div style="font-size:11px;line-height:1.6;color:#64748b;text-align:center;">
                  <div style="font-weight:700;color:#94a3b8;margin-bottom:4px;">Rakexura Store &bull; India's Trusted PC Game Store</div>
                  <div style="margin-bottom:10px;">
                    <a href="${siteUrl}/terms" style="color:#64748b;text-decoration:underline;margin:0 6px;">Terms</a> &bull;
                    <a href="${siteUrl}/privacy" style="color:#64748b;text-decoration:underline;margin:0 6px;">Privacy</a> &bull;
                    <a href="${siteUrl}/support" style="color:#64748b;text-decoration:underline;margin:0 6px;">Support Desk</a>
                  </div>
                  <div style="font-size:10px;color:#475569;">
                    &copy; 2026 Rakexura Store. All rights reserved.
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

export type CartRecoveryItem = {
  title: string;
  platform?: string | null;
  quantity?: number | null;
  imageUrl?: string | null;
  price?: number | string | null;
};

export type CartRecoveryEmailOptions = {
  customerName?: string | null;
  brandName?: string | null;
  items: CartRecoveryItem[];
  checkoutUrl?: string | null;
  storeUrl?: string | null;
  storeAddress?: string | null;
  unsubscribeUrl?: string | null;
};

export function buildCartRecoveryEmailHtml(options: CartRecoveryEmailOptions): string {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app";
  const siteUrl = (rawSiteUrl.includes("localhost") || rawSiteUrl.includes("127.0.0.1"))
    ? "https://rakexura-store.vercel.app"
    : rawSiteUrl.replace(/\/$/, "");

  const brandName = options.brandName?.trim() || "RAKEXURA STORE";
  const storeAddress = options.storeAddress?.trim() || "Mira Road, New Bharat, 401107 Mumbai MH, India";
  const checkoutUrl = options.checkoutUrl || `${siteUrl}/checkout`;
  const storeUrl = options.storeUrl || `${siteUrl}/games`;
  const unsubscribeUrl = options.unsubscribeUrl || `${siteUrl}/dashboard/settings`;
  const items = options.items && options.items.length > 0 ? options.items : [
    {
      title: "Selected PC Game",
      platform: "PC",
      quantity: 1,
      imageUrl: `${siteUrl}/images/rakexura-silver-badge.png`,
    }
  ];

  const itemsRowsHtml = items.map((item) => {
    let imgUrl = item.imageUrl || `${siteUrl}/images/rakexura-silver-badge.png`;
    if (imgUrl.startsWith("/")) {
      imgUrl = `${siteUrl}${imgUrl}`;
    }
    const qty = Number(item.quantity || 1);
    const platformDisplay = item.platform ? ` (${escapeHtml(item.platform)})` : "";
    const priceDisplay = item.price ? `₹${Number(item.price).toLocaleString("en-IN")}` : "";

    return `
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:20px;border-collapse:collapse;width:100%;">
        <tr>
          <td width="130" valign="top" style="width:130px;vertical-align:top;padding-right:16px;">
            <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.title)}" width="128" height="128" style="display:block;width:128px;height:128px;object-fit:cover;border-radius:2px;border:1px solid #e5e5e5;background-color:#f8f8f8;" />
          </td>
          <td valign="top" style="vertical-align:top;text-align:left;">
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#111111;line-height:1.4;margin-bottom:6px;">
              ${escapeHtml(item.title)}${platformDisplay}
            </div>
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#777777;margin-bottom:4px;">
              Quantity: ${qty}
            </div>
            ${priceDisplay ? `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;color:#111111;">${priceDisplay}</div>` : ""}
          </td>
        </tr>
      </table>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your cart is ready for checkout</title>
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;padding:24px 12px;width:100%;">
      <tr>
        <td align="center">
          
          <!-- Outer Card Container -->
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#ffffff;text-align:center;">
            <tr>
              <td>
                
                <!-- Centered Brand Header -->
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;color:#111111;text-transform:uppercase;text-align:center;margin-top:20px;margin-bottom:20px;">
                  ${escapeHtml(brandName)}
                </div>

                <!-- Main Bold Headline -->
                <h1 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:32px;font-weight:800;color:#111111;margin:0 0 28px 0;letter-spacing:-0.5px;line-height:1.2;text-align:center;">
                  Your cart is ready for<br />checkout
                </h1>

                <!-- Crisp Thin Divider Line -->
                <div style="border-top:1px solid #111111;margin:0 0 28px 0;width:100%;"></div>

                <!-- Section Heading -->
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#111111;text-align:left;margin-bottom:20px;">
                  Items left in shopping cart
                </div>

                <!-- Item(s) List -->
                ${itemsRowsHtml}

                <!-- Primary CTA: Solid Black Button -->
                <div style="text-align:center;margin:36px 0 16px 0;">
                  <a href="${escapeHtml(checkoutUrl)}" style="display:inline-block;background-color:#000000;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:6px;letter-spacing:0.3px;line-height:1;">
                    Continue checkout
                  </a>
                </div>

                <!-- Secondary Text Link: Visit our store -->
                <div style="text-align:center;margin:0 0 44px 0;">
                  <a href="${escapeHtml(storeUrl)}" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#333333;text-decoration:underline;">
                    Visit our store
                  </a>
                </div>

                <!-- Solid Black Full-Width Footer Block -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#000000;background:#000000;color:#ffffff;border-radius:0;width:100%;">
                  <tr>
                    <td align="center" style="padding:28px 20px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:#ffffff;">
                      <div style="font-weight:600;color:#ffffff;margin-bottom:6px;">
                        ${escapeHtml(brandName)}-${escapeHtml(storeAddress)}
                      </div>
                      <div style="color:#cccccc;margin-bottom:8px;">
                        No longer want to receive these emails? <a href="${escapeHtml(unsubscribeUrl)}" style="color:#ffffff;text-decoration:underline;">Unsubscribe</a>
                      </div>
                      <div style="color:#888888;font-size:10px;">
                        &copy; ${new Date().getFullYear()} ${escapeHtml(brandName)}
                      </div>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;
}


