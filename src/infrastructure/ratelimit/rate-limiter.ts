export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  default: { maxRequests: 60, windowMs: 60 * 1000 }, // 60/min
  download: { maxRequests: 30, windowMs: 60 * 60 * 1000 }, // 30/hour
  stem_separation: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20/hour
  translate_speak: { maxRequests: 30, windowMs: 60 * 60 * 1000 }, // 30/hour
  chord_detection: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20/hour
  mashup: { maxRequests: 8, windowMs: 60 * 60 * 1000 }, // 8/hour (Strict limit for heavy multi-track pipeline)
};

interface RequestRecord {
  timestamps: number[];
}

export class RateLimiter {
  private records: Map<string, RequestRecord> = new Map();

  check(identifier: string, action = "default"): RateLimitResult {
    const config = DEFAULT_LIMITS[action] || DEFAULT_LIMITS.default;
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const cutoff = now - config.windowMs;

    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Filter out timestamps outside window
    record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

    if (record.timestamps.length >= config.maxRequests) {
      const oldest = record.timestamps[0];
      const resetTime = oldest + config.windowMs;
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        limit: config.maxRequests,
      };
    }

    record.timestamps.push(now);
    const resetTime = record.timestamps[0] + config.windowMs;

    return {
      allowed: true,
      remaining: config.maxRequests - record.timestamps.length,
      resetTime,
      limit: config.maxRequests,
    };
  }

  getActiveClientsCount(): number {
    return this.records.size;
  }

  getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
    };
  }
}

export const rateLimiter = new RateLimiter();
export default rateLimiter;
