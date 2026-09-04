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
                <div style="font-size:13px;font-weight:600;color:#333333;margin-bottom:12px;text-align:center;">
                  Your login code is:
                </div>

                <!-- Clean white code pill container (Bulletproof for Gmail, Outlook, Apple Mail) -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:380px;margin:0 auto;border-collapse:separate;">
                  <tr>
                    <td align="center" bgcolor="#ffffff" style="background-color:#ffffff;background:#ffffff;padding:22px 20px;border-radius:12px;border:1.5px solid #e2e8f0;box-shadow:0 4px 16px rgba(0,0,0,0.06);text-align:center;font-family:'Courier New',Consolas,Menlo,'Lucida Console',monospace;font-size:38px;font-weight:900;color:#111111;line-height:1;letter-spacing:8px;">
                      <span style="font-family:'Courier New',Consolas,Menlo,'Lucida Console',monospace;font-size:38px;font-weight:900;color:#111111;letter-spacing:8px;line-height:1;display:inline-block;margin-left:8px;">
                        ${escapeHtml(formattedCode)}
                      </span>
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
                <div style="font-size:13px;font-weight:600;color:#333333;margin-bottom:12px;text-align:center;">
                  Your login code is:
                </div>

                <!-- Clean white code pill container (Bulletproof for Gmail, Outlook, Apple Mail) -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:380px;margin:0 auto;border-collapse:separate;">
                  <tr>
                    <td align="center" bgcolor="#ffffff" style="background-color:#ffffff;background:#ffffff;padding:22px 20px;border-radius:12px;border:1.5px solid #e2e8f0;box-shadow:0 4px 16px rgba(0,0,0,0.06);text-align:center;font-family:'Courier New',Consolas,Menlo,'Lucida Console',monospace;font-size:38px;font-weight:900;color:#111111;line-height:1;letter-spacing:8px;">
                      <span style="font-family:'Courier New',Consolas,Menlo,'Lucida Console',monospace;font-size:38px;font-weight:900;color:#111111;letter-spacing:8px;line-height:1;display:inline-block;margin-left:8px;">
                        {{ .Token }}
                      </span>
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

