import * as Sentry from "@sentry/nextjs";

export type ErrorCategory =
  | "validation_error"
  | "authentication_error"
  | "authorization_error"
  | "dependency_error"
  | "rate_limit_error"
  | "internal_error";

export interface LogPayload {
  category: ErrorCategory;
  message: string;
  context?: Record<string, unknown>;
  error?: unknown;
}

/**
 * Log structured error details to stderr and Sentry.
 */
export function logError(payload: LogPayload) {
  const { category, message, context = {}, error } = payload;
  const sanitizedContext = sanitize(context);

  const structuredLog = {
    timestamp: new Date().toISOString(),
    level: "ERROR",
    service: "rakexura-store",
    category,
    message,
    context: sanitizedContext,
    error: error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    } : error ? String(error) : undefined,
  };

  console.error(JSON.stringify(structuredLog));

  // Capture to Sentry with enriched contextual details
  try {
    const route = sanitizedContext.route || sanitizedContext.pathname;
    const userId = sanitizedContext.userId || sanitizedContext.user_id;
    const requestId = sanitizedContext.requestId || sanitizedContext.request_id;
    const orderId = sanitizedContext.orderId || sanitizedContext.order_id || sanitizedContext.reference;
    const operationName = sanitizedContext.operationName || sanitizedContext.operation || sanitizedContext.operation_name;

    Sentry.withScope((scope) => {
      scope.setTag("category", category);
      if (route) scope.setTag("route", String(route));
      if (requestId) scope.setTag("request_id", String(requestId));
      if (orderId) scope.setTag("order_id", String(orderId));
      if (operationName) scope.setTag("operation_name", String(operationName));
      if (userId) scope.setUser({ id: String(userId) });

      scope.setContext("details", sanitizedContext);

      if (error instanceof Error) {
        Sentry.captureException(error);
      } else if (error) {
        Sentry.captureException(new Error(String(error)));
      } else {
        Sentry.captureMessage(message, "error");
      }
    });
  } catch (sentryErr) {
    console.error("Failed to capture error in Sentry:", sentryErr);
  }
}

/**
 * Obfuscate name PII (e.g. John -> J***n)
 */
function obfuscateName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 2) return "***";
  return `${trimmed[0]}***${trimmed[trimmed.length - 1]}`;
}

/**
 * Obfuscate email PII (e.g. user@domain.com -> u***r@domain.com)
 */
function obfuscateEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length < 2) return "[REDACTED_PII]";
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `*@${domain}`;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

/**
 * Obfuscate phone PII (e.g. 918317416695 -> *******6695)
 */
function obfuscatePhone(phone: string): string {
  const trimmed = phone.replace(/\D/g, "");
  if (trimmed.length <= 4) return "****";
  return `******${trimmed.slice(-4)}`;
}

/**
 * Deep sanitize object to redact secrets and obfuscate PII.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitize(obj: unknown): any {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  if (typeof obj === "object") {
    const res: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Secrets & Screenshot URLs Redaction
      if (
        lowerKey.includes("password") ||
        lowerKey.includes("token") ||
        lowerKey.includes("key") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("proof") ||
        lowerKey.includes("cvv") ||
        lowerKey.includes("card") ||
        lowerKey.includes("auth") ||
        lowerKey.includes("jwt") ||
        lowerKey.includes("credentials") ||
        lowerKey.includes("screenshot") ||
        lowerKey.includes("image_url") ||
        lowerKey.includes("payment_proof") ||
        lowerKey.includes("proof_path")
      ) {
        res[key] = "[REDACTED_SECRET]";
      }
      // PII Obfuscation
      else if (lowerKey.includes("email")) {
        res[key] = typeof val === "string" ? obfuscateEmail(val) : "[REDACTED_PII]";
      } else if (lowerKey.includes("whatsapp") || lowerKey.includes("phone") || lowerKey.includes("tel")) {
        res[key] = typeof val === "string" ? obfuscatePhone(val) : "[REDACTED_PII]";
      } else if (lowerKey.includes("customer_name") || lowerKey.includes("display_name") || lowerKey === "name") {
        res[key] = typeof val === "string" ? obfuscateName(val) : "[REDACTED_PII]";
      }
      // Recursive Sanitization
      else {
        res[key] = sanitize(val);
      }
    }
    return res;
  }

  return obj;
}

