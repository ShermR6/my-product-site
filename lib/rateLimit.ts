import { prisma } from "./prisma";

/**
 * Durable, database-backed rate limiter.
 *
 * The previous implementation used an in-memory Map, which on Vercel's
 * serverless runtime is per-instance and wiped on every cold start — so an
 * attacker could evade it just by spreading requests. This version stores
 * counters in Postgres so a limit is enforced across every instance.
 *
 * Fails OPEN: if the database is unreachable we allow the request rather than
 * lock every user out of login. The limiter is a speed bump, not the only lock
 * on the door (passwords are still bcrypt-hashed, 2FA codes are capped, etc.).
 *
 * @param key      Unique bucket, e.g. `login:1.2.3.4` or `register:1.2.3.4`.
 * @param limit    Max requests allowed within the window.
 * @param windowMs Window length in milliseconds.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  const now = new Date();

  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    // No bucket yet, or the previous window has expired → start fresh.
    if (!existing || existing.resetAt < now) {
      const resetAt = new Date(now.getTime() + windowMs);
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { allowed: true, retryAfter: 0 };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        retryAfter: Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000),
      };
    }

    // Atomic increment avoids losing counts under concurrent requests.
    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { allowed: true, retryAfter: 0 };
  } catch (err) {
    console.error("rateLimit error (failing open):", err);
    return { allowed: true, retryAfter: 0 };
  }
}

/** Best-effort IP extraction from a request behind Vercel's proxy. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
