import "server-only";

type SendResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
};

function readableWhatsAppError(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    const error = parsed?.error;
    const message = String(error?.error_data?.details ?? error?.message ?? raw);

    if (message.includes("131030") || message.toLowerCase().includes("not in allowed list")) {
      return "Meta blocked this number because it is not in the WhatsApp Cloud API test recipient list. Add this number in Meta API Setup, or move the app to production with approved message templates.";
    }

    return message;
  } catch {
    return raw;
  }
}

export function cleanPhone(value?: string | null) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export async function sendWhatsAppText(to: string | null | undefined, body: string): Promise<SendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = cleanPhone(to);

  if (!recipient) return { ok: false, skipped: true, reason: "Customer WhatsApp number is missing" };
  if (!token || !phoneNumberId) return { ok: false, skipped: true, reason: "WhatsApp API env vars are not configured" };

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: {
          preview_url: false,
          body,
        },
      }),
    });

    if (!response.ok) {
      return { ok: false, error: readableWhatsAppError(await response.text()) };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "WhatsApp API request failed" };
  }
}
