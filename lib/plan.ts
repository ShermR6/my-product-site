// The one paid Personal plan, in one place. Safe to import from pages.
//
// Since 13 November 2026 there is a single plan. Licences are stored with the
// tier "starter"; "premium" and "pro" are the same plan under the names older
// licences were sold as. The backend enforces the limits (TIER_LIMITS and
// plans.py in aircraft-tracker-backend): these numbers are for display.

export const PLAN = {
  /** Tier written on new licences. */
  tier: "starter",
  name: "Personal",
  monthly: 14.99,
  /** Charged once a year: 40% less than twelve monthly payments. */
  yearly: 107.88,
  yearlyPerMonth: 8.99,
  yearlySaving: 40,
  trialDays: 7,
  aircraft: 15,
  smsPerMonth: 100,
} as const;

export type Billing = "monthly" | "yearly";

/** Every name the plan has been sold under, with or without "-yearly". */
const PLAN_TIERS = new Set(["starter", "premium", "pro"]);

export function isPlanTier(tier: unknown): boolean {
  return typeof tier === "string" && PLAN_TIERS.has(tier.replace(/-yearly$/, ""));
}

/** "premium-yearly" -> "premium". Billing period is not part of a tier. */
export function baseTier(tier: string): string {
  return tier.replace(/-yearly$/, "");
}

/** How a tier is named to customers. */
export function planLabel(tier: string | null | undefined): string {
  if (!tier) return PLAN.name;
  if (tier === "owner") return "Owner";
  if (tier.startsWith("team-")) return `Team ${baseTier(tier).slice(5).replace(/^./, (c) => c.toUpperCase())}`;
  return PLAN.name;
}
