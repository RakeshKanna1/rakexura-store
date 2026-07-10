export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimiter {
  limit(key: string, limitCount: number, windowSeconds: number): Promise<RateLimitResult>;
}

// In-memory fallback for local development
class LocalRateLimiter implements RateLimiter {
  private cache = new Map<string, { count: number; reset: number }>();

  async limit(key: string, limitCount: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const cached = this.cache.get(key);

    if (!cached || now > cached.reset) {
      const reset = now + windowSeconds;
      this.cache.set(key, { count: 1, reset });
      return { success: true, limit: limitCount, remaining: Math.max(0, limitCount - 1), reset };
    }

    if (cached.count >= limitCount) {
      return { success: false, limit: limitCount, remaining: 0, reset: cached.reset };
    }

    cached.count += 1;
    return { success: true, limit: limitCount, remaining: Math.max(0, limitCount - cached.count), reset: cached.reset };
  }
}

// Production distributed rate limiter using Upstash Redis HTTP REST API
class UpstashRateLimiter implements RateLimiter {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, "");
    this.token = token;
  }

  async limit(key: string, limitCount: number, windowSeconds: number): Promise<RateLimitResult> {
    // Lua script to perform atomic increment and expiration
    const luaScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local current = tonumber(redis.call('get', key) or "0")
      if current >= limit then
        return {current, redis.call('ttl', key)}
      else
        current = redis.call('incr', key)
        if current == 1 then
          redis.call('expire', key, window)
        end
        return {current, redis.call('ttl', key)}
      end
    `;

    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["EVAL", luaScript, "1", key, String(limitCount), String(windowSeconds)]),
        // Strict 2-second timeout for Redis communication to prevent bottlenecking requests
        signal: AbortSignal.timeout(2000),
      });

      if (!res.ok) {
        throw new Error(`Upstash HTTP error: ${res.status}`);
      }

      const data = await res.json();
      if (!data || !Array.isArray(data.result)) {
        throw new Error("Invalid Upstash EVAL response");
      }

      const [current, ttlSeconds] = data.result as [number, number];
      const now = Math.floor(Date.now() / 1000);
      const reset = now + (ttlSeconds > 0 ? ttlSeconds : windowSeconds);

      return {
        success: current <= limitCount,
        limit: limitCount,
        remaining: Math.max(0, limitCount - current),
        reset,
      };
    } catch (err) {
      // Fail open in case of rate limiter errors to preserve user experience under outage conditions
      console.error("Rate limiting service failure, failing open:", err);
      const now = Math.floor(Date.now() / 1000);
      return {
        success: true,
        limit: limitCount,
        remaining: 1,
        reset: now + windowSeconds,
      };
    }
  }
}

// Export singleton instance based on environment variables
let limiterInstance: RateLimiter;

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (upstashUrl && upstashToken) {
  limiterInstance = new UpstashRateLimiter(upstashUrl, upstashToken);
} else {
  if (process.env.NODE_ENV === "production") {
    console.warn("WARNING: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not configured in production. Falling back to local in-memory mock.");
  }
  limiterInstance = new LocalRateLimiter();
}

export const rateLimiter = limiterInstance;
