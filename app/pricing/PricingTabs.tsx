"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Plan = {
  name: string;
  tier: string;
  price: string;
  perMonth?: string;
  oldPrice?: string;
  tagline: string;
  desc: string;
  cta: string;
  popular?: boolean;
  highlights: string[];
};

type FeatureRow = {
  label: string;
  sectionHeader?: boolean;
  values: (string | boolean)[];
  subtitles?: (string | null)[];
  subtitlePrefix?: (string | null)[];
};

function CheckIcon() {
  return <span className="check" aria-label="Included">✓</span>;
}
function XIcon() {
  return <span className="x" aria-label="Not included">✕</span>;
}

const faqs = [
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade your plan at any time directly from your dashboard. You'll be charged the flat price difference between plans today, and your subscription renews at the new plan's price on your next billing date. Downgrades can be arranged by contacting support.",
  },
  {
    q: "How does the 30-day refund work?",
    a: "If you're not satisfied for any reason within the first 30 days, contact us and we'll issue a full refund, no questions asked.",
  },
  {
    q: "Do I need a license per device?",
    a: "Personal licenses are tied to your email, not a specific device. You can reinstall or switch computers and activate with the same license key.",
  },
  {
    q: "What happens when my subscription renews?",
    a: "Your subscription renews automatically each month or year depending on your billing cycle. You'll receive an email receipt from Stripe, and your access continues uninterrupted.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. You can cancel your subscription at any time from your dashboard or by contacting support. You'll keep access until the end of your current billing period.",
  },
  {
    q: "What's the difference between Personal and Team plans?",
    a: "Personal plans are for individual users tracking their own aircraft. Team plans are built for businesses like FBOs, fuel services, and flight schools. Multiple team members can log in and monitor a shared fleet, with much higher limits on tracked aircraft and notification channels.",
  },
];

export default function PricingTabs() {
  const [mode, setMode] = useState<"personal" | "team">("personal");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const router = useRouter();

  const handleTrial = async () => {
    setTrialLoading(true);
    setTrialError(null);
    try {
      const res = await fetch("/api/trial", { method: "POST" });
      const data = await res.json();
      if (res.status === 401 || data.requireLogin) {
        router.push("/login?callbackUrl=/pricing");
        return;
      }
      if (!res.ok) {
        setTrialError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setTrialError("Something went wrong. Please try again.");
    } finally {
      setTrialLoading(false);
    }
  };

  const handleBuy = async (tier: string) => {
    setLoadingTier(tier);
    setBuyError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billing }),
      });
      const data = await res.json();
      if (res.status === 401 || data.requireLogin) {
        router.push("/login?callbackUrl=/pricing");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBuyError("Something went wrong. Please try again.");
      }
    } catch {
      setBuyError("Something went wrong. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  const data = useMemo(() => {
    const yearly = billing === "yearly";

    const personalPlans: Plan[] = [
      {
        name: "Starter",
        tier: yearly ? "starter-yearly" : "starter",
        price: yearly ? "$149/yr" : "$14.99",
        perMonth: yearly ? "$12.42/mo" : undefined,
        tagline: yearly ? "Billed annually" : "Monthly Access",
        desc: "Essential tracking for individual operators",
        cta: "Buy now",
        highlights: [
          "3 tracked aircraft",
          "2 custom distance alert zones",
          "1 notification channel",
          "Approach zone alerts",
          "Custom alert templates",
          "Basic alert log",
        ],
      },
      {
        name: "Premium",
        tier: yearly ? "premium-yearly" : "premium",
        price: yearly ? "$249/yr" : "$24.99",
        perMonth: yearly ? "$20.75/mo" : undefined,
        tagline: yearly ? "Billed annually" : "Monthly Access",
        desc: "More aircraft and channels for serious tracking",
        cta: "Buy now",
        popular: true,
        highlights: [
          "7 tracked aircraft",
          "5 custom distance alert zones",
          "3 notification channels",
          "Approach zone alerts",
          "Alert log & history export",
          "Custom alert message templates",
        ],
      },
      {
        name: "Pro",
        tier: yearly ? "pro-yearly" : "pro",
        price: yearly ? "$499/yr" : "$49.99",
        perMonth: yearly ? "$41.58/mo" : undefined,
        tagline: yearly ? "Billed annually" : "Monthly Access",
        desc: "Maximum capacity for high-volume operations",
        cta: "Buy now",
        highlights: [
          "15 tracked aircraft",
          "7 custom distance alert zones",
          "5 notification channels",
          "Ground Station add-on included free",
          "Precise landing & takeoff detection (via GS)",
          "Alert log & history export",
          "Dedicated priority support",
        ],
      },
    ];

    const teamPlans: Plan[] = [
      {
        name: "Starter",
        tier: yearly ? "team-starter-yearly" : "team-starter",
        price: yearly ? "$199/yr" : "$19.99",
        perMonth: yearly ? "$16.58/mo" : undefined,
        oldPrice: yearly ? undefined : "$54.99",
        tagline: yearly ? "Billed annually" : "Monthly Team License",
        desc: "Shared tracking for small ramp teams",
        cta: "Buy now",
        highlights: [
          "3 operator seats",
          "25 tracked aircraft",
          "3 notification channels",
          "Shared live map & aircraft list",
          "Proximity & landing alerts",
          "Discord notifications",
        ],
      },
      {
        name: "Premium",
        tier: yearly ? "team-premium-yearly" : "team-premium",
        price: yearly ? "$349/yr" : "$34.99",
        perMonth: yearly ? "$29.08/mo" : undefined,
        oldPrice: yearly ? undefined : "$89.99",
        tagline: yearly ? "Billed annually" : "Monthly Team License",
        desc: "Scale up for larger ground operations",
        cta: "Buy now",
        popular: true,
        highlights: [
          "10 operator seats",
          "75 tracked aircraft",
          "10 notification channels",
          "Roles & permissions",
          "Duty scheduling & shift management",
          "Alert routing by duty status",
          "Aircraft claiming & expected arrivals",
          "Slack & Microsoft Teams notifications",
        ],
      },
      {
        name: "Pro",
        tier: yearly ? "team-pro-yearly" : "team-pro",
        price: yearly ? "$699/yr" : "$69.99",
        perMonth: yearly ? "$58.25/mo" : undefined,
        oldPrice: yearly ? undefined : "$139.99",
        tagline: yearly ? "Billed annually" : "Monthly Team License",
        desc: "No limits for enterprise and multi-base operations",
        cta: "Buy now",
        highlights: [
          "Unlimited operator seats",
          "Unlimited tracked aircraft",
          "Unlimited notification channels",
          "All Premium features",
          "Multi-airport support",
          "Escalation routing & configuration",
          "Activity & audit log",
          "Dedicated priority support",
        ],
      },
    ];

    const personalFeatures: FeatureRow[] = [
      { label: "Tracking", sectionHeader: true, values: [] },
      { label: "Tracked aircraft", values: ["3", "7", "15"] },
      { label: "Alert latency (cloud)", values: ["~30s", "~30s", "~30s"] },

      { label: "Notifications", sectionHeader: true, values: [] },
      { label: "Notification channels", values: ["1 channel", "3 channels", "5 channels"] },
      { label: "Custom approach zones (distance alerts)", values: ["2 zones", "5 zones", "7 zones"] },
      { label: "Landing & takeoff alerts", values: [true, true, true] },
      { label: "Discord & Email", values: [true, true, true] },
      { label: "Slack, Teams, Google Chat", values: [false, true, true] },
      { label: "SMS, Telegram, Webhook", values: [false, false, true] },
      { label: "Custom alert templates", values: [true, true, true] },
      { label: "Quiet hours", values: [true, true, true] },

      { label: "Ground Station", sectionHeader: true, values: [] },
      { label: "GS add-on cost", values: ["Add-on", "Add-on", "✦ Included"] },

      { label: "History & Reporting", sectionHeader: true, values: [] },
      { label: "Alert log", values: [true, true, true] },
      { label: "Export history (CSV)", values: [true, true, true] },

      { label: "Support", sectionHeader: true, values: [] },
      { label: "Priority support", values: [false, false, true] },
    ];

    const teamFeatures: FeatureRow[] = [
      { label: "Capacity", sectionHeader: true, values: [] },
      { label: "Operator seats", values: ["3", "10", "Unlimited"] },
      { label: "Tracked aircraft", values: ["25", "75", "Unlimited"] },
      { label: "Notification channels", values: ["3", "10", "Unlimited"] },

      { label: "Tracking", sectionHeader: true, values: [] },
      { label: "Real-time ADS-B aircraft tracking", values: [true, true, true] },
      { label: "Live map with full flight trail history", values: [true, true, true] },
      { label: "Shared live map for all team members", values: [true, true, true] },
      { label: "Airport monitoring & runway diagram", values: [true, true, true] },
      { label: "Multi-airport support", values: [false, false, true] },

      { label: "Alerts", sectionHeader: true, values: [] },
      { label: "Proximity alerts (custom distances)", values: [true, true, true] },
      { label: "Takeoff & landing alerts", values: [true, true, true] },
      { label: "Custom alert message templates", values: [false, true, true] },
      { label: "Escalation routing", values: [false, false, true] },

      { label: "Notifications", sectionHeader: true, values: [] },
      { label: "Discord", values: [true, true, true] },
      { label: "Slack", values: [false, true, true] },
      { label: "Microsoft Teams", values: [false, true, true] },

      { label: "Team Management", sectionHeader: true, values: [] },
      { label: "Shared aircraft list", values: [true, true, true] },
      { label: "Team member management", values: [true, true, true] },
      { label: "Roles & permissions", values: [false, true, true] },
      { label: "Duty scheduling & shift management", values: [false, true, true] },
      { label: "Alert routing by duty status", values: [false, true, true] },

      { label: "Operations", sectionHeader: true, values: [] },
      { label: "Aircraft claiming by dispatcher", values: [false, true, true] },
      { label: "Expected arrivals scheduling", values: [false, true, true] },
      { label: "On-duty status tracking", values: [false, true, true] },
      { label: "Activity & audit log", values: [false, true, true] },
      { label: "Escalation configuration", values: [false, false, true] },

      { label: "Support", sectionHeader: true, values: [] },
      { label: "Email support", values: [true, true, true] },
      { label: "Priority support", values: [false, false, true] },
    ];

    return mode === "personal"
      ? { plans: personalPlans, features: personalFeatures }
      : { plans: teamPlans, features: teamFeatures };
  }, [mode, billing]);

  return (
    <div>
      {/* ── Header ── */}
      <div className="pricing-head">
        <h1>Choose the plan that&apos;s right for you</h1>
        <p className="pricing-sub">Feel secure in your purchase with a 30 day money-back guarantee.</p>

        <div className="tabbar" role="tablist">
          <button className={`tab ${mode === "personal" ? "active" : ""}`} onClick={() => setMode("personal")} role="tab">Personal</button>
          <button className={`tab ${mode === "team" ? "active" : ""}`} onClick={() => setMode("team")} role="tab">
            Team
          </button>
        </div>

        {/* Billing toggle — shown for both modes */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
          marginTop: "20px",
        }}>
          <span style={{ fontSize: "14px", fontWeight: billing === "monthly" ? 600 : 400, color: billing === "monthly" ? "var(--text)" : "var(--muted)", transition: "color 0.2s" }}>
            Monthly
          </span>
          <div
            onClick={() => setBilling(b => b === "monthly" ? "yearly" : "monthly")}
            style={{
              width: "48px", height: "26px", borderRadius: "13px",
              background: billing === "yearly" ? "var(--accent)" : "rgba(255,255,255,0.12)",
              cursor: "pointer", position: "relative", transition: "background 0.25s", flexShrink: 0,
            }}
          >
            <div style={{
              position: "absolute", top: "3px",
              left: billing === "yearly" ? "25px" : "3px",
              width: "20px", height: "20px", borderRadius: "50%",
              background: "#fff", transition: "left 0.25s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: billing === "yearly" ? 600 : 400, color: billing === "yearly" ? "var(--text)" : "var(--muted)", transition: "color 0.2s", display: "flex", alignItems: "center", gap: "8px" }}>
            Yearly
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 999, background: "rgba(34,211,163,0.15)", color: "#22d3a3", border: "1px solid rgba(34,211,163,0.3)" }}>
              Save 17%
            </span>
          </span>
        </div>

        {/* Team mode callout */}
        {mode === "team" && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginTop: 16, padding: "8px 16px", borderRadius: 999,
            background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)",
            fontSize: 13, color: "var(--muted)",
          }}>
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>FinalPing Teams</span>
            — multi-seat aircraft tracking for FBOs, fuel services & flight schools ·{" "}
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>Coming soon</span>
          </div>
        )}
      </div>

      {/* ── Plan cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "16px",
        alignItems: "stretch",
        margin: "24px 0 48px",
        padding: "12px 0 4px",
      }}>
        {data.plans.map((p) => {
          const isPopular = !!p.popular;
          return (
            <div
              key={p.name}
              style={{
                background: "var(--panel)",
                border: isPopular ? "2px solid rgba(14,165,233,0.5)" : "1px solid var(--border)",
                borderRadius: 20,
                padding: "28px",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                marginTop: isPopular ? "-12px" : "0",
                marginBottom: isPopular ? "-12px" : "0",
                boxShadow: isPopular
                  ? "0 0 40px rgba(14,165,233,0.08), 0 20px 60px rgba(0,0,0,0.35)"
                  : "0 4px 24px rgba(0,0,0,0.15)",
                zIndex: isPopular ? 1 : 0,
              }}
            >
              {isPopular && (
                <span style={{
                  position: "absolute", top: 14, right: 14,
                  fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
                  textTransform: "uppercase", padding: "3px 10px",
                  borderRadius: 999, background: "var(--accent)", color: "#000",
                }}>
                  Most Popular
                </span>
              )}

              <div style={{
                fontSize: 12, fontWeight: 800, letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: isPopular ? "var(--accent)" : "var(--muted)",
                marginBottom: 10,
              }}>
                {mode === "team" ? "Teams · " : ""}{p.name}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text)", lineHeight: 1 }}>
                  {p.price}
                </span>
                {p.oldPrice && (
                  <span style={{ fontSize: 13, color: "var(--muted)", textDecoration: "line-through" }}>{p.oldPrice}</span>
                )}
              </div>
              {p.perMonth && (
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{p.perMonth}</div>
              )}

              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20, minHeight: 36 }}>
                {p.desc}
              </p>

              <div style={{ height: 1, background: "var(--border)", marginBottom: 18 }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24, flex: 1 }}>
                {p.highlights.map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13 }}>
                    <span style={{
                      flexShrink: 0, marginTop: 1,
                      width: 18, height: 18, borderRadius: 999,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 900, fontSize: 11, lineHeight: 1,
                      background: "rgba(35, 199, 107, 0.18)",
                      border: "1px solid rgba(35, 199, 107, 0.45)",
                      color: "rgba(35, 199, 107, 1)",
                    }}>✓</span>
                    <span style={{ color: "var(--muted)", lineHeight: 1.45 }}>{feat}</span>
                  </div>
                ))}
              </div>

              {p.tier.startsWith("team-") ? (
                <button
                  style={{
                    maxWidth: "100%", width: "100%", fontSize: 14, padding: "12px 14px",
                    borderRadius: 999, fontWeight: 700, cursor: "not-allowed",
                    background: "rgba(255,255,255,0.05)", color: "var(--muted)",
                    border: "1px solid var(--border)", boxShadow: "none",
                  }}
                  disabled
                  title="FinalPing for Teams isn't available to download yet"
                >
                  Coming soon
                </button>
              ) : (
                <button
                  className="pt-cta"
                  style={{ maxWidth: "100%", width: "100%", fontSize: 14, padding: "12px 14px" }}
                  onClick={() => handleBuy(p.tier)}
                  disabled={loadingTier === p.tier}
                >
                  {loadingTier === p.tier ? "Loading..." : p.cta}
                </button>
              )}

              {p.tier === "starter" && billing === "monthly" && mode === "personal" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <button
                    onClick={handleTrial}
                    disabled={trialLoading}
                    style={{
                      width: "100%", marginTop: 8, padding: "11px 14px",
                      borderRadius: 999, fontSize: 13, fontWeight: 700,
                      cursor: trialLoading ? "default" : "pointer",
                      background: "transparent",
                      border: "1px solid var(--border-strong)",
                      color: "var(--accent)",
                      opacity: trialLoading ? 0.6 : 1,
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    {trialLoading ? "Loading..." : "Try free for 7 days"}
                  </button>
                  {trialError && (
                    <div style={{ fontSize: 12, color: "#f87171", textAlign: "center", maxWidth: 200 }}>
                      {trialError}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-tagline" style={{ textAlign: "center", marginTop: 8 }}>{p.tagline}</div>
            </div>
          );
        })}
      </div>

      {/* ── Full feature comparison ── */}
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 20 }}>Full feature comparison</h2>

        <div className="pricing-table">
          <div className="pt-row pt-header">
            <div className="pt-cell pt-left" style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Feature
            </div>
            {data.plans.map((p) => (
              <div
                key={p.name}
                className={`pt-cell${p.popular ? " pt-popular-col" : ""}`}
                style={{ flexDirection: "column", gap: 4, position: "relative" }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{p.price}</span>
              </div>
            ))}
          </div>

          {data.features.map((row) => {
            if (row.sectionHeader) {
              return (
                <div className="pt-row" key={row.label}>
                  <div
                    className="pt-cell pt-left"
                    style={{
                      gridColumn: "1 / -1",
                      background: "rgba(255,255,255,0.025)",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      minHeight: 36,
                      paddingTop: 10,
                      paddingBottom: 10,
                    }}
                  >
                    {row.label}
                  </div>
                </div>
              );
            }
            return (
              <div className="pt-row" key={row.label}>
                <div className="pt-cell pt-left">
                  <span className="pt-feature">{row.label}</span>
                </div>
                {row.values.map((v, i) => (
                  <div className={`pt-cell pt-value${data.plans[i]?.popular ? " pt-popular-col" : ""}`} key={i}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center" }}>
                      {typeof v === "boolean" ? (v ? <CheckIcon /> : <XIcon />) : (
                        <span style={{
                          fontWeight: 700,
                          color: v === "✦ Included" ? "rgba(35,199,107,1)" : "inherit",
                        }}>{v}</span>
                      )}
                      {row.subtitles?.[i] && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          {row.subtitlePrefix?.[i] && (
                            <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.04em" }}>
                              {row.subtitlePrefix[i]}
                            </span>
                          )}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
                            {row.subtitles[i]!.split(" · ").map(ch => (
                              <span key={ch} style={{
                                fontSize: 10, padding: "1px 6px", borderRadius: 999,
                                background: "rgba(255,255,255,0.06)", color: "var(--muted)",
                                border: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap",
                              }}>{ch}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pricing-foot">
        <span className="refund">Refundable up to 30 days</span>
      </div>

      {/* ── Ground Station Add-on (personal only) ── */}
      {mode === "personal" && (
        <section style={{ marginTop: 56 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
              <div className="small" style={{ letterSpacing: "0.08em" }}>ADD-ON</div>
            </div>
            <h2 style={{ fontSize: 26 }}>FinalPing Ground Station</h2>
            <p style={{ maxWidth: 520, margin: "8px auto 0" }}>
              Connect your own ADS-B receiver for sub-10-second local alerts — no dependency on cloud data feeds. Available on any plan. Pro users get this unlocked automatically.
            </p>
          </div>

          <div style={{
            maxWidth: 620, margin: "0 auto",
            background: "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(14,165,233,0.03))",
            border: "1px solid rgba(14,165,233,0.25)", borderRadius: 16, padding: "32px 36px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 24, flexWrap: "wrap" as const,
          }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginBottom: 8, letterSpacing: "0.04em" }}>
                GROUND STATION
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>
                  $29.99 <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>one-time</span>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
                  padding: "2px 8px", borderRadius: 999,
                  background: "rgba(34,211,163,0.15)", color: "#22d3a3",
                  border: "1px solid rgba(34,211,163,0.3)",
                }}>Free with Pro</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 14 }}>
                Requires a compatible ADS-B receiver (RTL-SDR, FlightAware stick, etc.) and an active FinalPing subscription.
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                {[
                  "Precise landing alerts: actual wheels-down touchdown detection",
                  "Takeoff alerts: detect the moment an aircraft lifts off",
                  "Under 10 second latency vs ~30 seconds via cloud",
                  "No data gaps: zero dependency on cloud API availability",
                  "Fires through all your existing notification channels",
                ].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)" }}>
                    <span style={{ color: "#22d3a3", fontWeight: 700 }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, alignItems: "center", flexShrink: 0 }}>
              <button
                className="pt-cta"
                style={{ width: 160, padding: "13px 0", fontSize: 14 }}
                onClick={() => handleBuy("ground-station")}
                disabled={loadingTier === "ground-station"}
              >
                {loadingTier === "ground-station" ? "Loading..." : "Buy now →"}
              </button>
              <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" as const }}>
                One-time · No subscription<br/>
                <span style={{ color: "#22d3a3" }}>Included free on Pro</span>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <a href="/groundstationsetup" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "underline" }}>Setup guide</a>
                <a href="/groundstationdevices" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "underline" }}>Buy a receiver</a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section style={{ marginTop: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="small" style={{ letterSpacing: "0.08em", marginBottom: 6 }}>FAQ</div>
          <h2 style={{ fontSize: 26 }}>Pricing questions</h2>
          <p style={{ maxWidth: 480, margin: "8px auto 0" }}>
            Common questions about plans, billing, and refunds.
          </p>
        </div>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((f) => (
            <div className="panel" key={f.q} style={{ padding: 20 }}>
              <h2 style={{ fontSize: 14, marginBottom: 6, color: "var(--text)" }}>{f.q}</h2>
              <p style={{ fontSize: 13, marginBottom: 0, lineHeight: 1.7 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {buyError && (
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#f87171" }}>{buyError}</div>
      )}
    </div>
  );
}
