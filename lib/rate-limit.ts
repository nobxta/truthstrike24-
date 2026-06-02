import { prisma } from "./db";
import type { NextRequest } from "next/server";

/**
 * DB-backed sliding-window rate limiter.
 *
 * Keyed by "<bucket>:<identifier>" (e.g. "newsletter:1.2.3.4").
 * Resets the counter once the window has elapsed since `windowStart`.
 *
 * Returns { ok, remaining, resetInSec } so callers can return a 429 with
 * a Retry-After header.
 */

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetInSec: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const now = new Date();
  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing) {
    await prisma.rateLimit.create({
      data: { key, count: 1, windowStart: now },
    });
    return { ok: true, remaining: limit - 1, resetInSec: windowSec };
  }

  const elapsedSec = (now.getTime() - existing.windowStart.getTime()) / 1000;

  // Window expired — reset counter
  if (elapsedSec >= windowSec) {
    await prisma.rateLimit.update({
      where: { key },
      data: { count: 1, windowStart: now },
    });
    return { ok: true, remaining: limit - 1, resetInSec: windowSec };
  }

  // Still inside window — already at/over limit?
  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetInSec: Math.max(1, Math.ceil(windowSec - elapsedSec)),
    };
  }

  // Increment
  const updated = await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return {
    ok: true,
    remaining: Math.max(0, limit - updated.count),
    resetInSec: Math.max(1, Math.ceil(windowSec - elapsedSec)),
  };
}

/** Extracts the client IP from common proxy headers, with a sensible fallback. */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/**
 * Checks a honeypot field. Pass the value the client sent for a hidden field
 * (e.g. body.website). If non-empty, the submitter is a bot — return true.
 */
export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
