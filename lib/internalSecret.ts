import { timingSafeEqual } from "crypto";

/**
 * Shared secret between this site and the Railway backends.
 *
 * No hardcoded fallback: if it is unset we treat it as empty and every check
 * fails closed, rather than silently authenticating with a value that lives in
 * the repo. Accepts either env name so a deployment configured with the
 * documented INTERNAL_API_SECRET still works.
 */
export const INTERNAL_SECRET =
  process.env.WEBHOOK_INTERNAL_SECRET || process.env.INTERNAL_API_SECRET || "";

/** Constant-time check of an inbound internal-request secret. */
export function validInternalSecret(provided: string | null | undefined): boolean {
  if (!provided || !INTERNAL_SECRET) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(INTERNAL_SECRET);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
