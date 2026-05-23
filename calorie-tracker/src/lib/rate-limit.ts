import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback — process-local, ineffective across serverless instances.
// Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for production-grade limiting.
const attempts = new Map<string, { count: number; reset: number }>();

function inMemoryRateLimit(ip: string, max: number): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.reset < now) {
    attempts.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

let upstash: Ratelimit | null = null;

function getUpstash(): Ratelimit | null {
  if (upstash) return upstash;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  upstash = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: false,
  });
  return upstash;
}

export async function rateLimit(ip: string, max = 5): Promise<boolean> {
  const limiter = getUpstash();
  if (limiter) {
    const { success } = await limiter.limit(ip);
    return success;
  }
  return inMemoryRateLimit(ip, max);
}

export function getClientIp(request: NextRequest): string {
  // x-real-ip is injected by Vercel's edge and cannot be spoofed by clients
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  // Rightmost entry in x-forwarded-for is added by the last trusted proxy
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",").pop()!.trim();
  // Unique per request so we never collapse unidentified clients into one bucket
  return `anon-${crypto.randomUUID()}`;
}
