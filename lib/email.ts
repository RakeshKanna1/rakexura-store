import "server-only";
// @ts-expect-error - nodemailer types are not locally installed in devDependencies
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

import { fetchWithTimeout } from "@/lib/security/request";
import { OWNER_EMAIL } from "@/lib/config";

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
        valHtml = `<a href="mailto:${escapeHtml(val)}" style="color:#0066cc;text-decoration:underline;font-weight:bold;word-break:break-all;">${escapeHtml(val)}</a>`;
      } else if (key.toLowerCase().includes("whatsapp") || key.toLowerCase().includes("phone")) {
        const cleanPhone = val.replace(/\D/g, "");
        valHtml = `<a href="https://wa.me/${cleanPhone}" style="color:#0066cc;text-decoration:none;font-weight:bold;">+${escapeHtml(val)}</a>`;
      } else if (key.toLowerCase().includes("amount") || key.toLowerCase().includes("price") || key.toLowerCase().includes("total")) {
        valHtml = `<span style="color:#000000;font-weight:900;font-size:15px;">${escapeHtml(val)}</span>`;
      }

      formattedContent += `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:3px 0;table-layout:fixed;width:100%;">
          <tr>
            <td style="padding:6px 0;border-bottom:1px solid #eee;font-size:13px;color:#727272;font-weight:700;vertical-align:top;" align="left" width="38%">${escapeHtml(key)}</td>
            <td style="padding:6px 0;border-bottom:1px solid #eee;font-size:13px;color:#121212;font-weight:600;word-break:break-word;overflow-wrap:anywhere;vertical-align:top;" align="right" width="62%">${valHtml}</td>
          </tr>
        </table>
      `;
      return;
    }

    if (trimmed.includes("/dashboard/settings")) {
      const linkBase = (process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app").replace(/\/$/, "");
      const resolvedLinkBase = (linkBase.includes("localhost") || linkBase.includes("127.0.0.1")) ? "https://rakexura-store.vercel.app" : linkBase;
      formattedContent += `
        <div style="margin:20px 0;text-align:center;">
          <a href="${resolvedLinkBase}/dashboard/settings" target="_blank" style="display:inline-block;background-color:#7c3aed;color:#ffffff;font-weight:800;font-size:13px;padding:12px 24px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;text-transform:uppercase;">
            Open Settings &amp; Enable Notifications &rarr;
          </a>
        </div>
      `;
      return;
    }

    formattedContent += `<p style="margin:6px 0;font-size:13px;line-height:1.6;color:#333333;">${escapeHtml(trimmed)}</p>`;
  });

  if (inItemsBlock) {
    formattedContent += `</div>`;
  }

  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app";
  const siteUrl = (rawSiteUrl.includes("localhost") || rawSiteUrl.includes("127.0.0.1"))
    ? "https://rakexura-store.vercel.app"
    : rawSiteUrl.replace(/\/$/, "");
  const logoUrl = `${siteUrl}/images/rakexura-silver-badge.png`;
  const hasSignOff = /thank\s*you|thanks|rakexura\s*support/i.test(text);

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
                    <img src="${logoUrl}" alt="Rakexura Shield" width="44" height="52" style="display:block;margin:0 auto 14px auto;border:0;outline:none;" />
                    <div style="font-size:18px;font-weight:900;color:#000000;letter-spacing:1px;text-transform:uppercase;">
                      RAKEXURA STORE
                    </div>
                    ${detectedRef ? `<div style="font-size:12px;color:#727272;font-weight:700;margin-top:4px;">Order Ref: ${detectedRef}</div>` : ''}
                    
                    <hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0 20px 0;" />

                    <div style="font-size:14px;line-height:1.7;color:#333333;text-align:left;">
                      ${formattedContent}
                    </div>

                    ${!hasSignOff ? `
                      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:12px;color:#727272;text-align:left;">
                        Thanks,<br />
                        <strong style="color:#000000;">Rakexura Customer Support</strong>
                      </div>
                    ` : ''}
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

import {
  type AdminAlertField,
  type AdminAlertEmailOptions,
  buildAdminAlertEmailHtml,
  type WishlistSaleEmailOptions,
  buildWishlistSaleEmailHtml,
  type DeviceNotificationInviteEmailOptions,
  buildDeviceNotificationInviteEmailHtml,
  type CartRecoveryItem,
  type CartRecoveryEmailOptions,
  buildCartRecoveryEmailHtml,
} from "./email-templates";

export {
  type AdminAlertField,
  type AdminAlertEmailOptions,
  buildAdminAlertEmailHtml,
  type WishlistSaleEmailOptions,
  buildWishlistSaleEmailHtml,
  type DeviceNotificationInviteEmailOptions,
  buildDeviceNotificationInviteEmailHtml,
  type CartRecoveryItem,
  type CartRecoveryEmailOptions,
  buildCartRecoveryEmailHtml,
};

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

  // Direct absolute badge image URL for reliable delivery across email clients
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
      <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f5f7;padding:32px 10px;">
          <tr>
            <td align="center">
              
              <!-- NVIDIA & Epic Games Inspired Main White Card Container -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:32px 24px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.06);">
                <tr>
                  <td align="center">
                    
                    <!-- Clean Centered Brand Header with Badge Image -->
                    <div style="padding-bottom:20px;border-bottom:1px solid #f1f5f9;margin-bottom:24px;text-align:center;">
                      <img src="${logoUrl}" alt="Rakexura Shield" width="44" height="52" style="display:block;margin:0 auto 12px auto;border:0;outline:none;max-width:44px;height:auto;" />
                      <div style="font-size:22px;font-weight:900;color:#0f172a;letter-spacing:2px;text-transform:uppercase;line-height:1;">
                        RAKEXURA STORE
                      </div>
                      <div style="margin-top:10px;">
                        <span style="display:inline-block;background-color:#f1f5f9;color:#6d28d9;font-size:10px;font-weight:900;padding:5px 14px;border-radius:12px;border:1px solid #ddd6fe;text-transform:uppercase;letter-spacing:1.2px;">
                          ${discountTag ? escapeHtml(discountTag.toUpperCase()) : 'SPECIAL GAME DEAL'}
                        </span>
                      </div>
                    </div>

                    <!-- Headline Title -->
                    <h1 style="font-size:24px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;line-height:1.35;margin:0 0 22px 0;padding:0;text-align:center;">
                      ${escapeHtml(title)}
                    </h1>

                    <!-- Real Game Banner Image (if available) -->
                    ${fullImageUrl ? `
                      <div style="margin-bottom:24px;text-align:center;">
                        <img src="${escapeHtml(fullImageUrl)}" alt="${escapeHtml(title)}" style="width:100%;max-width:520px;height:auto;border-radius:12px;border:1px solid #e2e8f0;display:block;margin:0 auto;box-shadow:0 4px 16px rgba(0,0,0,0.08);" />
                      </div>
                    ` : ''}

                    <!-- NVIDIA / Epic Games Style Price & Platform Card -->
                    ${(price || originalPrice || platforms || discountTag) ? `
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border-radius:12px;padding:18px 16px;margin-bottom:26px;border:1px solid #e2e8f0;text-align:center;">
                        ${platforms ? `
                          <tr>
                            <td align="center" style="padding-bottom:12px;">
                              <span style="display:inline-block;background-color:#ede9fe;color:#5b21b6;font-weight:900;padding:6px 14px;border-radius:6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;border:1px solid #ddd6fe;">${escapeHtml(platforms)}</span>
                            </td>
                          </tr>
                        ` : ''}
                        <tr>
                          <td align="center" style="padding-bottom:8px;">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                              <tr>
                                ${discountPercentage ? `
                                  <td style="padding-right:10px;vertical-align:middle;">
                                    <span style="background-color:#00df6c;color:#000000;font-size:13px;font-weight:900;padding:4px 10px;border-radius:6px;display:inline-block;">-${discountPercentage}%</span>
                                  </td>
                                ` : ''}
                                ${originalPrice ? `
                                  <td style="padding-right:10px;vertical-align:middle;">
                                    <span style="font-size:14px;color:#94a3b8;text-decoration:line-through;font-weight:600;">₹${Number(originalPrice).toLocaleString("en-IN")}</span>
                                  </td>
                                ` : ''}
                                ${price ? `
                                  <td style="vertical-align:middle;">
                                    <span style="font-size:24px;font-weight:900;color:#0f172a;">₹${Number(price).toLocaleString("en-IN")}</span>
                                  </td>
                                ` : ''}
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="color:#64748b;font-size:11px;font-weight:700;padding-top:4px;">
                            ${discountTag ? escapeHtml(discountTag) : 'SPECIAL GAME DEAL! Available live on Rakexura'}
                          </td>
                        </tr>
                      </table>
                    ` : ''}

                    <!-- Message Body -->
                    <div style="font-size:14px;line-height:1.75;color:#334155;margin-bottom:30px;text-align:left;">
                      ${escapeHtml(message).replace(/\n/g, '<br />')}
                    </div>

                    <!-- Epic / NVIDIA Style Primary Action CTA Button -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <a href="${escapeHtml(targetUrl)}" target="_blank" style="display:inline-block;width:85%;max-width:320px;background-color:#0078f2;color:#ffffff;font-size:14px;font-weight:900;text-decoration:none;padding:16px 24px;border-radius:8px;box-shadow:0 6px 20px rgba(0,120,242,0.35);letter-spacing:0.8px;text-transform:uppercase;text-align:center;">
                            VIEW GAME ON RAKEXURA &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- White Theme Footer Disclaimer -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;margin-top:24px;text-align:center;">
                <tr>
                  <td style="font-size:11px;line-height:1.6;color:#64748b;">
                    <p style="margin:0 0 6px 0;">Specific pricing, stock, and platform options are subject to change. Check live details at Rakexura Store.</p>
                    <p style="margin:0 0 14px 0;">You are receiving this notification email because you registered an account at Rakexura Store.</p>
                    <div style="border-top:1px solid #e2e8f0;padding-top:16px;font-size:11px;color:#64748b;">
                      <strong style="color:#0f172a;text-transform:uppercase;letter-spacing:1px;">RAKEXURA STORE</strong> &bull; 
                      <a href="${siteUrl}/games" style="color:#475569;text-decoration:underline;margin-left:4px;font-weight:600;">Browse Store</a> &bull; 
                      <a href="${siteUrl}/support" style="color:#475569;text-decoration:underline;margin-left:4px;font-weight:600;">Support Desk</a>
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

export type CleanInvoiceItem = {
  description: string;
  publisher?: string | null;
  price: number;
};

export type CleanInvoiceOptions = {
  customerName: string;
  orderRef: string;
  orderDate?: string;
  billToEmail: string;
  items: CleanInvoiceItem[];
  totalPrice: number;
};

export function buildCleanInvoiceEmailHtml(options: CleanInvoiceOptions) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app").replace(/\/$/, "");
  const logoUrl = `${siteUrl}/images/rakexura-silver-badge.png`;
  const { customerName, orderRef, orderDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), billToEmail, items, totalPrice } = options;

  const itemRowsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 14px;font-size:13px;font-weight:700;color:#121212;border-bottom:1px solid #eeeeee;">${escapeHtml(item.description)}</td>
        <td style="padding:12px 14px;font-size:12px;font-weight:500;color:#666666;border-bottom:1px solid #eeeeee;">${escapeHtml(item.publisher || "Rakexura Store")}</td>
        <td style="padding:12px 14px;font-size:13px;font-weight:800;color:#121212;border-bottom:1px solid #eeeeee;" align="right">₹${Number(item.price).toFixed(2)} INR</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Invoice ID: ${escapeHtml(orderRef)}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#121212;-webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f5f5f7;padding:32px 12px;">
          <tr>
            <td align="center">
              
              <!-- Clean White Card Container matching Apple/Epic Receipt Style -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#ffffff;border-radius:12px;border:1px solid #e2e2e8;padding:36px 32px;box-shadow:0 10px 30px rgba(0,0,0,0.06);text-align:left;">
                <tr>
                  <td>
                    
                    <!-- Top Logo Header -->
                    <div style="text-align:center;margin-bottom:28px;">
                      <img src="${logoUrl}" alt="Rakexura Logo" width="44" height="52" style="display:block;margin:0 auto;border:0;outline:none;" />
                    </div>

                    <!-- Thank You Heading -->
                    <div style="text-align:center;margin-bottom:28px;">
                      <h1 style="font-size:32px;font-weight:900;color:#000000;margin:0 0 10px 0;letter-spacing:-0.5px;line-height:1.1;">Thank You.</h1>
                      <div style="font-size:15px;font-weight:700;color:#121212;margin-bottom:4px;">Hi ${escapeHtml(customerName)}!</div>
                      <div style="font-size:14px;color:#555555;">Thank you for your purchase!</div>
                    </div>

                    <!-- Invoice ID Header -->
                    <div style="text-align:center;margin-bottom:32px;">
                      <div style="font-size:11px;font-weight:900;letter-spacing:1.5px;color:#666666;text-transform:uppercase;margin-bottom:6px;">INVOICE ID:</div>
                      <div style="font-size:26px;font-weight:900;color:#000000;letter-spacing:1px;font-family:monospace,Consolas,Courier,monospace;">${escapeHtml(orderRef)}</div>
                    </div>

                    <!-- Order Information Section -->
                    <div style="font-size:11px;font-weight:900;letter-spacing:1.2px;color:#777777;text-transform:uppercase;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #eeeeee;">
                      YOUR ORDER INFORMATION:
                    </div>

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                      <tr>
                        <td width="50%" style="vertical-align:top;padding-right:12px;">
                          <div style="font-size:12px;font-weight:700;color:#121212;margin-bottom:2px;">Order ID:</div>
                          <div style="font-size:12px;color:#666666;margin-bottom:12px;">${escapeHtml(orderRef)}</div>

                          <div style="font-size:12px;font-weight:700;color:#121212;margin-bottom:2px;">Order Date:</div>
                          <div style="font-size:12px;color:#666666;">${escapeHtml(orderDate)}</div>
                        </td>
                        <td width="50%" style="vertical-align:top;padding-left:12px;">
                          <div style="font-size:12px;font-weight:700;color:#121212;margin-bottom:2px;">Bill To:</div>
                          <div style="font-size:12px;color:#0066cc;margin-bottom:12px;word-break:break-all;"><a href="mailto:${escapeHtml(billToEmail)}" style="color:#0066cc;text-decoration:underline;">${escapeHtml(billToEmail)}</a></div>

                          <div style="font-size:12px;font-weight:700;color:#121212;margin-bottom:2px;">Source:</div>
                          <div style="font-size:12px;color:#666666;">Rakexura Store</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Items Table -->
                    <div style="font-size:11px;font-weight:900;letter-spacing:1.2px;color:#777777;text-transform:uppercase;margin-bottom:12px;">
                      HERE'S WHAT YOU ORDERED:
                    </div>

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:24px;border:1px solid #eeeeee;border-radius:6px;overflow:hidden;">
                      <thead>
                        <tr style="background-color:#f8f8f8;border-bottom:1px solid #eeeeee;">
                          <th align="left" style="padding:10px 14px;font-size:11px;font-weight:900;color:#444444;text-transform:uppercase;letter-spacing:0.5px;" width="50%">DESCRIPTION</th>
                          <th align="left" style="padding:10px 14px;font-size:11px;font-weight:900;color:#444444;text-transform:uppercase;letter-spacing:0.5px;" width="25%">PUBLISHER</th>
                          <th align="right" style="padding:10px 14px;font-size:11px;font-weight:900;color:#444444;text-transform:uppercase;letter-spacing:0.5px;" width="25%">PRICE</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemRowsHtml}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="2" align="right" style="padding:16px 14px;font-size:13px;font-weight:900;color:#444444;text-transform:uppercase;">TOTAL:</td>
                          <td align="right" style="padding:16px 14px;font-size:16px;font-weight:900;color:#000000;">₹${Number(totalPrice).toFixed(2)} INR</td>
                        </tr>
                      </tfoot>
                    </table>

                    <!-- Sleek Small Action Buttons Container Box -->
                    <div style="background-color:#fafafa;border:1px solid #eeeeee;border-radius:12px;padding:18px 16px;margin:24px 0;text-align:center;">
                      <div style="font-size:12px;font-weight:600;color:#555555;margin-bottom:12px;">
                        Please keep a copy of this receipt for your records.
                      </div>

                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="50%" style="padding-right:6px;" align="center">
                            <a href="${siteUrl}/dashboard/orders" style="display:block;background-color:#18181b;color:#ffffff;font-size:11px;font-weight:800;text-decoration:none;padding:10px 8px;border-radius:8px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.08);">
                              📦 View Purchase History &rarr;
                            </a>
                          </td>
                          <td width="50%" style="padding-left:6px;" align="center">
                            <a href="${siteUrl}/dashboard/rewards" style="display:block;background-color:#7c3aed;color:#ffffff;font-size:11px;font-weight:800;text-decoration:none;padding:10px 8px;border-radius:8px;text-align:center;box-shadow:0 2px 6px rgba(124,58,237,0.15);">
                              🎁 Rewards Balance &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <hr style="border:none;border-top:1px solid #eeeeee;margin:28px 0 20px 0;" />

                    <!-- Footer Legal & Disclaimer -->
                    <div style="text-align:center;font-size:11px;line-height:1.6;color:#777777;">
                      <p style="margin:0 0 10px 0;">PC games and apps purchased on Rakexura Store are eligible for instant delivery upon payment verification. If you have any activation questions, please contact our support team.</p>
                      
                      <div style="font-weight:800;color:#121212;margin-bottom:2px;">Rakexura Store Gaming Pvt Ltd</div>
                      <div style="font-size:10px;color:#888888;margin-bottom:12px;">Authorized PC Game Reseller &middot; India</div>

                      <img src="${logoUrl}" alt="Rakexura Shield" width="24" height="28" style="display:block;margin:0 auto 12px auto;border:0;outline:none;opacity:0.8;" />

                      <div style="font-size:10px;color:#888888;margin-bottom:8px;">&copy; 2026 Rakexura Store. All rights reserved. Rakexura, Epic Games, Steam, and their respective logos are trademarks or registered trademarks of their respective owners.</div>

                      <div>
                        <a href="${siteUrl}/terms" style="color:#666666;text-decoration:underline;margin:0 6px;">Terms of Service</a> |
                        <a href="${siteUrl}/privacy" style="color:#666666;text-decoration:underline;margin:0 6px;">Privacy Policy</a> |
                        <a href="${siteUrl}/support" style="color:#666666;text-decoration:underline;margin:0 6px;">Need Help?</a>
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

export type ReviewRequestEmailOptions = {
  customerName?: string;
  gameTitle?: string;
  message?: string;
  reviewUrl?: string;
};

export function buildReviewRequestEmailHtml(options: ReviewRequestEmailOptions = {}) {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app";
  const siteUrl = (rawSiteUrl.includes("localhost") || rawSiteUrl.includes("127.0.0.1"))
    ? "https://rakexura-store.vercel.app"
    : rawSiteUrl.replace(/\/$/, "");
  const logoUrl = `${siteUrl}/images/rakexura-silver-badge.png`;
  const {
    customerName = "Gamer",
    gameTitle,
    message = "Thank you for shopping at Rakexura Store! We hope you are loving your game. Please take 30 seconds to drop your honest rating and review — it helps fellow gamers choose their next adventure.",
    reviewUrl = `${siteUrl}/reviews`,
  } = options;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Review Your Game – Rakexura Store</title>
      </head>
      <body style="margin:0;padding:0;background-color:#080a11;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;-webkit-font-smoothing:antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#080a11;padding:36px 12px;">
          <tr>
            <td align="center">
              
              <!-- Dark Gaming Card Container (Epic / Steam Style) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#111522;border-radius:16px;border:1px solid #20273b;padding:36px 28px;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,0.7);">
                <tr>
                  <td>
                    
                    <!-- Top Brand Lockup -->
                    <div style="margin-bottom:24px;text-align:center;">
                      <img src="${logoUrl}" alt="Rakexura Shield" width="46" height="54" style="display:block;margin:0 auto 12px auto;border:0;outline:none;" />
                      <div style="font-size:19px;font-weight:900;color:#ffffff;letter-spacing:2px;text-transform:uppercase;line-height:1;">
                        RAKEXURA STORE
                      </div>
                      <div style="margin-top:10px;">
                        <span style="display:inline-block;background-color:rgba(139,92,246,0.15);color:#c084fc;font-size:10px;font-weight:800;padding:4px 12px;border-radius:12px;border:1px solid rgba(139,92,246,0.3);text-transform:uppercase;letter-spacing:1px;">
                          VERIFIED PURCHASE REVIEW
                        </span>
                      </div>
                    </div>

                    <hr style="border:none;border-top:1px solid #20273b;margin:20px 0 26px 0;" />

                    <!-- Headline -->
                    <h1 style="font-size:26px;font-weight:900;color:#ffffff;margin:0 0 10px 0;letter-spacing:-0.5px;line-height:1.25;">
                      How is your gaming experience?
                    </h1>

                    <div style="font-size:15px;font-weight:700;color:#facc15;margin-bottom:12px;">
                      Hey ${escapeHtml(customerName)}!
                    </div>

                    <!-- Intro Body -->
                    <p style="font-size:13.5px;line-height:1.65;color:#94a3b8;max-width:460px;margin:0 auto 24px auto;">
                      ${escapeHtml(message)}
                    </p>

                    ${
                      gameTitle
                        ? `
                      <!-- Purchased Game Showcase Deck -->
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#171d2e;border:1px solid #263047;border-radius:12px;padding:16px 20px;margin-bottom:26px;text-align:left;">
                        <tr>
                          <td>
                            <div style="font-size:10px;font-weight:800;color:#818cf8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">PURCHASED TITLE</div>
                            <div style="font-size:16px;font-weight:900;color:#ffffff;">${escapeHtml(gameTitle)}</div>
                          </td>
                          <td align="right" style="vertical-align:middle;">
                            <span style="background-color:rgba(0,214,143,0.12);color:#00d68f;border:1px solid rgba(0,214,143,0.3);font-size:10px;font-weight:800;padding:4px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;">DELIVERED</span>
                          </td>
                        </tr>
                      </table>
                    `
                        : ""
                    }

                    <!-- Interactive Tactical Rating Bar -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#161c2c;border:1px solid #252d43;border-radius:14px;padding:22px 16px;margin-bottom:28px;text-align:center;">
                      <tr>
                        <td>
                          <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:14px;">
                            TAP TO SELECT YOUR RATING
                          </div>
                          
                          <!-- Gold Star Deck -->
                          <div style="font-size:36px;line-height:1;letter-spacing:12px;margin-bottom:10px;">
                            <a href="${reviewUrl}?rating=1" style="color:#facc15;text-decoration:none;display:inline-block;" title="1 Star - Needs Improvement">&#9733;</a>
                            <a href="${reviewUrl}?rating=2" style="color:#facc15;text-decoration:none;display:inline-block;" title="2 Stars - Fair">&#9733;</a>
                            <a href="${reviewUrl}?rating=3" style="color:#facc15;text-decoration:none;display:inline-block;" title="3 Stars - Good">&#9733;</a>
                            <a href="${reviewUrl}?rating=4" style="color:#facc15;text-decoration:none;display:inline-block;" title="4 Stars - Great">&#9733;</a>
                            <a href="${reviewUrl}?rating=5" style="color:#facc15;text-decoration:none;display:inline-block;" title="5 Stars - Masterpiece">&#9733;</a>
                          </div>

                          <div style="font-size:11px;color:#64748b;">
                            1 = Needs Work &bull; 5 = Masterpiece
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Signature Action CTA Button -->
                    <div style="margin-bottom:24px;">
                      <a href="${reviewUrl}" target="_blank" style="display:inline-block;background-color:#7c3aed;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#ffffff;font-size:14px;font-weight:900;text-decoration:none;padding:16px 36px;border-radius:10px;text-transform:uppercase;letter-spacing:0.6px;box-shadow:0 8px 25px rgba(124,58,237,0.4);border:1px solid #a78bfa;">
                        Leave a Review on Rakexura &rarr;
                      </a>
                    </div>

                    <!-- Loyalty Perk Telemetry Banner -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:rgba(250,204,21,0.06);border:1px solid rgba(250,204,21,0.22);border-radius:10px;padding:12px 16px;margin-bottom:28px;text-align:center;">
                      <tr>
                        <td align="center">
                          <span style="font-size:12px;font-weight:800;color:#facc15;letter-spacing:0.3px;">
                            &#10022; BONUS: Verified reviews credit +50 Loyalty Points to your account!
                          </span>
                        </td>
                      </tr>
                    </table>

                    <hr style="border:none;border-top:1px solid #20273b;margin:24px 0 20px 0;" />

                    <!-- Sleek Dark Footer -->
                    <div style="font-size:11px;line-height:1.6;color:#64748b;text-align:center;">
                      <div style="font-weight:700;color:#94a3b8;margin-bottom:2px;">Rakexura Store Gaming Pvt Ltd</div>
                      <div style="font-size:10px;color:#64748b;margin-bottom:12px;">Authorized PC Game Reseller &middot; India</div>

                      <div style="margin-bottom:8px;">
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
    </html>
  `;
}

export {
  type OtpEmailOptions,
  buildOtpVerificationEmailHtml,
  getSupabaseOtpEmailTemplateHtml,
} from "./email-templates";

export async function sendEmail({ to, subject, text, html }: SendEmailInput): Promise<EmailResult> {
  const ownerEmail = OWNER_EMAIL.toLowerCase().trim();

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
    // 1a. Try Gmail Direct SMTP first for Owner emails (100% reliable inbox delivery)
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (nodemailer && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const mailHtml = html ?? textToHtml(text);
        const needsCidAttachment = typeof mailHtml === "string" && mailHtml.includes("cid:rakexuraSilverBadge");

        await transporter.sendMail({
          from: `Rakexura Store <${smtpUser}>`,
          to: recipient,
          subject,
          text,
          html: mailHtml,
          ...(needsCidAttachment ? { attachments: getInlineAttachments() } : {}),
        });

        console.log(`[Gmail Direct SMTP] Owner email successfully delivered to ${recipient}`);
        return { ok: true };
      } catch (smtpErr) {
        console.warn("[Gmail Direct SMTP] Owner email failed:", smtpErr);
      }
    }

    // 1b. Fallback: Try Resend API
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

    return { ok: false, skipped: true, reason: "Owner email dispatch failed (Gmail Direct SMTP & Resend API failed)" };
  }

  // =========================================================================
  // STRICT RULE 2: CUSTOMER EMAILS -> BREVO SMTP / BREVO API FIRST, THEN FALLBACKS
  // =========================================================================
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    const brevoLogin = process.env.BREVO_SMTP_USER || "b30b46001@smtp-brevo.com";
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

        const mailHtml = html ?? textToHtml(text);
        const needsCidAttachment = typeof mailHtml === "string" && mailHtml.includes("cid:rakexuraSilverBadge");

        await transporter.sendMail({
          from: senderEmail,
          to: recipient,
          subject,
          text,
          html: mailHtml,
          ...(needsCidAttachment ? { attachments: getInlineAttachments() } : {}),
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

      const mailHtml = html ?? textToHtml(text);
      const needsCidAttachment = typeof mailHtml === "string" && mailHtml.includes("cid:rakexuraSilverBadge");

      await transporter.sendMail({
        from: `Rakexura Store <${smtpUser}>`,
        to: recipient,
        subject,
        text,
        html: mailHtml,
        ...(needsCidAttachment ? { attachments: getInlineAttachments() } : {}),
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

export async function sendCartRecoveryEmail(options: {
  to: string;
  customerName?: string;
  brandName?: string;
  items: CartRecoveryItem[];
  checkoutUrl?: string;
  storeUrl?: string;
  storeAddress?: string;
  unsubscribeUrl?: string;
}): Promise<EmailResult> {
  const subject = "You left items at checkout";
  const itemsText = options.items
    .map((item) => `- ${item.title}${item.platform ? ` (${item.platform})` : ""}${item.quantity ? ` x${item.quantity}` : ""}`)
    .join("\n");
  const checkoutUrl = options.checkoutUrl || `${(process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app").replace(/\/$/, "")}/checkout`;
  const storeUrl = options.storeUrl || `${(process.env.NEXT_PUBLIC_SITE_URL || "https://rakexura-store.vercel.app").replace(/\/$/, "")}/games`;
  const text = `Your cart is ready for checkout\n\nItems left in shopping cart:\n${itemsText}\n\nContinue checkout: ${checkoutUrl}\n\nVisit our store: ${storeUrl}`;
  const html = buildCartRecoveryEmailHtml(options);

  return await sendEmail({
    to: options.to,
    subject,
    text,
    html,
  });
}

