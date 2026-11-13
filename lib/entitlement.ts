// What an account is entitled to, in one place.
//
// Used by /api/auth/verify (password login) and /api/internal/entitlement
// (Google sign-in and periodic refresh), so every path agrees.

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { baseTier } from "@/lib/plan";

// Tiers that are hardware purchases, not plans. They live in the same table but
// must never be selected as someone's plan — TIER_LIMITS has no entry for them,
// so the backend would silently fall back to starter limits.
const HARDWARE_PREFIXES = [
  "ground-station-kit",
  "pro-stick",
  "stand-antenna",
  "stubby-antenna",
];

function isHardware(tier: string): boolean {
  return HARDWARE_PREFIXES.some((p) => tier.startsWith(p));
}

export type Entitlement = {
  tier: string;
  status: string;
  expires_at: string | null;
  license_key: string | null;
};

export const FREE: Entitlement = {
  tier: "free",
  status: "none",
  expires_at: null,
  license_key: null,
};

/**
 * The site's own admin account always has the internal "owner" plan, so
 * whoever runs FinalPing is never locked out of it by a billing change. The
 * key is derived from the address: stable, and not a licence anyone can buy.
 */
function ownerFallback(email: string, product?: string | null): Entitlement {
  const admin = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (!admin || email !== admin || product === "teams") return FREE;
  const tag = crypto.createHash("sha256").update(email).digest("hex").slice(0, 12).toUpperCase();
  return { tier: "owner", status: "active", expires_at: null, license_key: `FP-OWNER-${tag}` };
}

/**
 * The live plan for an account, scoped to the product that is asking.
 *
 * "inactive" counts as entitled: it means paid but never activated on a
 * desktop, and desktop activation is the step the entitlement model removes.
 * "pending" (pre-payment), "revoked" and "expired" do not.
 */
export async function getEntitlement(
  email: string,
  userId: string | null,
  product?: string | null
): Promise<Entitlement> {
  const normalized = email.toLowerCase().trim();

  // `owner` is deliberately not team-prefixed, so it satisfies both scopes.
  const scope =
    product === "teams"
      ? { OR: [{ tier: { startsWith: "team-" } }, { tier: "owner" }] }
      : { NOT: { tier: { startsWith: "team-" } } };

  const candidates = await prisma.license.findMany({
    where: {
      status: { in: ["active", "inactive"] },
      AND: [
        {
          OR: [
            ...(userId ? [{ userId }] : []),
            { purchaseEmail: normalized },
          ],
        },
        scope,
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  const live = candidates.find(
    (l) => !isHardware(l.tier) && (!l.expiresAt || l.expiresAt.getTime() > now)
  );

  if (!live) return ownerFallback(normalized, product);

  return {
    // Billing period is not part of a tier: "starter-yearly" is "starter".
    tier: baseTier(live.tier),
    status: live.status,
    expires_at: live.expiresAt ? live.expiresAt.toISOString() : null,
    license_key: live.licenseKey,
  };
}
