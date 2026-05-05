import type { NextRequest } from "next/server";

// NOTE: this Map is process-local. On serverless cold starts the counter resets,
// making it ineffective in production. Replace with Upstash Redis before launch.
const attempts = new Map<string, { count: number; reset: number }>();

export function rateLimit(ip: string, max = 5): boolean {
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
