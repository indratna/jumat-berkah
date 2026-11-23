import { NextResponse } from "next/server";

export type RateLimitRule = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
};

export const RATE_LIMITS = {
  donationCreate: { limit: 10, windowMs: 10 * 60_000 },
  donationStatus: { limit: 60, windowMs: 10 * 60_000 },
  adminLogin: { limit: 5, windowMs: 15 * 60_000 },
  donorLogin: { limit: 10, windowMs: 15 * 60_000 },
  cspReport: { limit: 60, windowMs: 10 * 60_000 },
} satisfies Record<string, RateLimitRule>;

type Bucket = {
  count: number;
  resetAt: number;
};

const MAX_BUCKETS = 10_000;
const buckets = new Map<string, Bucket>();

/**
 * Fixed-window in-memory limiter.
 *
 * This is intentionally small and dependency-free. It protects a single
 * container; if the app is ever scaled horizontally, replace the store with a
 * shared backend (Redis/Postgres) before relying on it.
 */
export function consumeRateLimit(input: {
  key: string;
  rule: RateLimitRule;
  now?: number;
}): RateLimitResult {
  const now = input.now ?? Date.now();
  const existing = buckets.get(input.key);

  if (!existing || existing.resetAt <= now) {
    pruneExpired(now);
    const resetAt = now + input.rule.windowMs;
    buckets.set(input.key, { count: 1, resetAt });

    return {
      allowed: true,
      remaining: Math.max(0, input.rule.limit - 1),
      retryAfterSeconds: 0,
      resetAt,
    };
  }

  if (existing.count >= input.rule.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: Math.max(0, input.rule.limit - existing.count),
    retryAfterSeconds: 0,
    resetAt: existing.resetAt,
  };
}

export function buildRateLimitKey(scope: string, identifier: string | null) {
  return `${scope}:${identifier ?? "unknown"}`;
}

export function rateLimitResponse(
  result: RateLimitResult,
  message = "Terlalu banyak permintaan. Silakan coba lagi nanti.",
) {
  return NextResponse.json(
    { errors: { rateLimit: message } },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}

export function resetRateLimitStore() {
  buckets.clear();
}

/** Diagnostics only: lets tests prove the store stays bounded. */
export function getRateLimitBucketCount() {
  return buckets.size;
}

function pruneExpired(now: number) {
  if (buckets.size < MAX_BUCKETS) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  // If every bucket is still inside its window, evict the oldest ones. Without
  // this cap an attacker rotating identifiers could grow the Map without bound.
  // Losing the oldest bucket only lets that single key retry a little early.
  for (const key of buckets.keys()) {
    if (buckets.size < MAX_BUCKETS) {
      break;
    }

    buckets.delete(key);
  }
}