/**
 * Request Reliability Utilities
 * Handles request timeouts and safe retries for idempotent read operations.
 */

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
}

/**
 * Perform a fetch request with a strict timeout.
 */
export async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeoutMs = 8000, ...fetchOptions } = options;

  // Use AbortSignal.timeout if supported, otherwise fallback to AbortController
  let signal: AbortSignal;
  let timerId: NodeJS.Timeout | undefined;

  if (typeof AbortSignal.timeout === "function") {
    signal = AbortSignal.timeout(timeoutMs);
  } else {
    const controller = new AbortController();
    timerId = setTimeout(() => controller.abort(), timeoutMs);
    signal = controller.signal;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: options.signal ? anySignal([options.signal, signal]) : signal,
    });
    return response;
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}

/**
 * Retries a safe, idempotent read operation (GET or HEAD) if it fails.
 * Never retry mutations like POST, PUT, or DELETE.
 */
export async function retrySafeRead<T>(
  operation: () => Promise<T>,
  options: { retries?: number; delayMs?: number; backoffFactor?: number } = {}
): Promise<T> {
  const { retries = 3, delayMs = 500, backoffFactor = 2 } = options;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      console.warn(`Idempotent read failed (attempt ${attempt}/${retries}). Retrying in ${currentDelay}ms...`, err);
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= backoffFactor;
    }
  }
  throw new Error("Retry operation failed");
}

/**
 * Combines multiple abort signals into one.
 */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  const onAbort = () => {
    controller.abort();
    for (const signal of signals) {
      signal.removeEventListener("abort", onAbort);
    }
  };
  for (const signal of signals) {
    if (signal.aborted) {
      onAbort();
      break;
    }
    signal.addEventListener("abort", onAbort);
  }
  return controller.signal;
}
