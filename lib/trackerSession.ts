// A signed-in website user's session with the tracker backend.
//
// The tracker (Railway) issues its own JWT. The desktop app gets one by signing
// in; the web app gets one here, on the server, so the token never reaches page
// scripts. It rides in an httpOnly cookie and is attached by the proxy at
// app/api/tracker/[...path].
//
// Minting reuses the bridge the desktop Google sign-in already has: store a
// short-lived single-use token on the user's row, hand it to the backend's
// /api/auth/google-desktop, and the backend confirms it by calling this site's
// /api/auth/google/desktop-verify. Nothing on the backend had to change.
//
// Known limit: the bridge column is shared with the desktop flow, so a desktop
// Google sign-in landing in the same few hundred milliseconds fails once and
// has to be retried.

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { INTERNAL_SECRET } from "@/lib/internalSecret";

export const TRACKER_URL =
  process.env.TRACKER_API_URL ?? "https://aircraft-tracker-backend-production.up.railway.app";

export const TRACKER_COOKIE = "fp_tracker";

/**
 * Marks a request as coming from this site. The tracker only serves signed-in
 * requests that carry it, which is what keeps the retired desktop apps out.
 * Server-side only: it must never be sent from page scripts.
 */
export const TRACKER_ORIGIN_HEADERS: Record<string, string> = { "x-internal-secret": INTERNAL_SECRET };
// The backend's JWT lasts 30 days; ask for a new one a little before that.
export const TRACKER_COOKIE_MAX_AGE = 60 * 60 * 24 * 25;

export type TrackerAuthFailure = "license_expired" | "no_account" | "unavailable";

export class TrackerAuthError extends Error {
  constructor(public readonly code: TrackerAuthFailure) {
    super(code);
  }
}

/** Ties a cookie to one account, so signing in as someone else never reuses it. */
function ownerTag(email: string): string {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex").slice(0, 16);
}

export function packTrackerCookie(email: string, token: string): string {
  return `${ownerTag(email)}.${token}`;
}

/** The tracker token inside a cookie value, or null if it belongs to another account. */
export function unpackTrackerCookie(email: string, value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot !== 16) return null;
  if (value.slice(0, dot) !== ownerTag(email)) return null;
  const token = value.slice(dot + 1);
  return token.length > 20 ? token : null;
}

/** Ask the tracker for a fresh JWT for this website account. */
export async function mintTrackerToken(email: string): Promise<string> {
  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true } });
  if (!user) throw new TrackerAuthError("no_account");

  const bridgeToken = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      desktopOAuthToken: bridgeToken,
      desktopOAuthExpiry: new Date(Date.now() + 2 * 60 * 1000),
    },
  });

  let res: Response;
  try {
    res = await fetch(`${TRACKER_URL}/api/auth/google-desktop`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...TRACKER_ORIGIN_HEADERS },
      body: JSON.stringify({ token: bridgeToken, email: normalized }),
      cache: "no-store",
    });
  } catch {
    throw new TrackerAuthError("unavailable");
  }

  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    throw new TrackerAuthError(body?.detail === "license_expired" ? "license_expired" : "unavailable");
  }
  if (!res.ok) throw new TrackerAuthError("unavailable");

  const data = await res.json().catch(() => null);
  if (!data?.access_token) throw new TrackerAuthError("unavailable");
  return data.access_token as string;
}
