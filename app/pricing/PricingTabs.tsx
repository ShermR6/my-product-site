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
};

type FeatureRow = {
  label: string;
  values: (string | boolean)[];
  subtitles?: (string | null)[];
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
    a: "Yes — you can upgrade your plan at any time directly from your dashboard. You'll be charged the flat price difference between plans today, and your subscription renews at the new plan's price on your next billing date. Downgrades can be arranged by contacting support.",
  },
  {
    q: "How does the 30-day refund work?",
    a: "If you're not satisfied for any reason within the first 30 days, contact us and we'll issue a full refund — no questions asked.",
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
    a: "Personal plans are for individual users tracking their own aircraft. Team plans are built for businesses like FBOs, fuel services, and flight schools — multiple team members can log in and monitor a shared fleet, with much higher limits on tracked aircraft and notification channels.",
  },
];

export default function PricingTabs() {
  const [mode, setMode] = useState<"personal" | "team">("personal");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const router = useRouter();

  const handleBuy = async (tier: string) => {
    setLoadingTier(tier);
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
        alert("Something went wrong. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
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
        oldPrice: yearly ? undefined : "$49.99",
        tagline: yearly ? "Billed annually" : "Monthly Access",
        desc: "Essential tracking for individual operators",
        cta: "Buy now",
      },
      {
        name: "Premium",
        tier: yearly ? "premium-yearly" : "premium",
        price: yearly ? "$249/yr" : "$24.99",
        perMonth: yearly ? "$20.75/mo" : undefined,
        oldPrice: yearly ? undefined : "$74.99",
        tagline: yearly ? "Billed annually" : "Monthly Access",
        desc: "More aircraft and channels for serious tracking",
        cta: "Buy now",
        popular: true,
      },
      {
        name: "Pro",
        tier: yearly ? "pro-yearly" : "pro",
        price: yearly ? "$499/yr" : "$49.99",
        perMonth: yearly ? "$41.58/mo" : undefined,
        oldPrice: yearly ? undefined : "$119.99",
        tagline: yearly ? "Billed annually" : "Monthly Access",
        desc: "Maximum capacity for high-volume operations",
        cta: "Buy now",
      },
    ];

    const teamPlans: Plan[] = [
      {
        name: "Team Starter",
        tier: yearly ? "team-starter-yearly" : "team-starter",
        price: yearly ? "$199/yr" : "$19.99",
        perMonth: yearly ? "$16.58/mo" : undefined,
        oldPrice: yearly ? undefined : "$54.99",
        tagline: yearly ? "Billed annually" : "Monthly Team License",
        desc: "Shared tracking for small ramp teams",
        cta: "Buy now",
      },
      {
        name: "Team Premium",
        tier: yearly ? "team-premium-yearly" : "team-premium",
        price: yearly ? "$349/yr" : "$34.99",
        perMonth: yearly ? "$29.08/mo" : undefined,
        oldPrice: yearly ? undefined : "$89.99",
        tagline: yearly ? "Billed annually" : "Monthly Team License",
        desc: "Scale up for larger ground operations",
        cta: "Buy now",
        popular: true,
      },
      {
        name: "Team Pro",
        tier: yearly ? "team-pro-yearly" : "team-pro",
        price: yearly ? "$699/yr" : "$69.99",
        perMonth: yearly ? "$58.25/mo" : undefined,
        oldPrice: yearly ? undefined : "$139.99",
        tagline: yearly ? "Billed annually" : "Monthly Team License",
        desc: "No limits for enterprise and multi-base operations",
        cta: "Buy now",
      },
    ];

    const personalFeatures: FeatureRow[] = [
      { label: "Tracked aircraft", values: ["3", "7", "15"] },
      { label: "Distance alerts", values: [true, true, true] },
      {
        label: "Notification channels",
        values: ["2 channels", "5 channels", "All 6 channels"],

        subtitles: ["Discord & Email", "Starter + Slack, SMS, Teams", "Premium + WhatsApp"],
      },
      { label: "Ground station add-on", values: [true, true, true] },
      { label: "Priority support", values: [false, true, true] },
    ];

    const teamFeatures: FeatureRow[] = [
      { label: "Operator seats", values: ["3", "10", "Unlimited"] },
      { label: "Tracked aircraft", values: ["25", "75", "Unlimited"] },
      { label: "Notification channels", values: ["3 channels", "10 channels", "Unlimited"] },
      { label: "Shared aircraft list", values: [true, true, true] },
      { label: "Distance alerts", values: [true, true, true] },
      { label: "Priority support", values: [false, false, true] },
    ];

    return mode === "personal"
      ? { plans: personalPlans, features: personalFeatures }
      : { plans: teamPlans, features: teamFeatures };
  }, [mode, billing]);

  return (
    <div>
      <div className="pricing-head">
        <h1>Choose the plan that&apos;s right for you</h1>
        <p className="pricing-sub">Feel secure in your purchase with a 30 day money-back guarantee.</p>

        {/* Personal / Team toggle */}
        <div className="tabbar" role="tablist">
          <button className={`tab ${mode === "personal" ? "active" : ""}`} onClick={() => setMode("personal")} role="tab">Personal</button>
          <button className={`tab ${mode === "team" ? "active" : ""}`} onClick={() => setMode("team")} role="tab" style={{ position: "relative" }}>
            Team
            <span style={{
              marginLeft: 8, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", padding: "2px 7px", borderRadius: 999,
              background: "rgba(255,165,0,0.2)", color: "#f59e0b",
              border: "1px solid rgba(245,158,11,0.3)",
            }}>
              Coming Soon
            </span>
          </button>
        </div>

        {/* Monthly / Yearly toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "20px" }}>
          <span style={{
            fontSize: "14px",
            fontWeight: billing === "monthly" ? 600 : 400,
            color: billing === "monthly" ? "var(--text)" : "var(--muted)",
            transition: "color 0.2s",
          }}>
            Monthly
          </span>

          <div
            onClick={() => setBilling(b => b === "monthly" ? "yearly" : "monthly")}
            style={{
              width: "48px", height: "26px", borderRadius: "13px",
              background: billing === "yearly" ? "var(--accent)" : "rgba(255,255,255,0.12)",
              cursor: "pointer", position: "relative", transition: "background 0.25s",
              flexShrink: 0,
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

          <span style={{
            fontSize: "14px",
            fontWeight: billing === "yearly" ? 600 : 400,
            color: billing === "yearly" ? "var(--text)" : "var(--muted)",
            transition: "color 0.2s",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            Yearly
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase", padding: "2px 8px", borderRadius: 999,
              background: "rgba(34,211,163,0.15)", color: "#22d3a3",
              border: "1px solid rgba(34,211,163,0.3)",
            }}>
              Save 17%
            </span>
          </span>
        </div>
      </div>

      <div className="pricing-table">
        <div className="pt-row pt-header">
          <div className="pt-cell pt-left" />
          {data.plans.map((p) => (
            <div className={`pt-cell pt-plan${p.popular ? " pt-popular-col" : ""}`} key={p.name} style={{ position: "relative" }}>
              {p.popular && (
                <span style={{
                  position: "absolute", top: -2, right: -2,
                  fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
                  textTransform: "uppercase", padding: "3px 10px",
                  borderRadius: 999, background: "var(--accent)", color: "#000",
                }}>
                  Most Popular
                </span>
              )}
              <div className="pt-plan-title">{p.name}</div>
              <div className="pt-plan-desc">{p.desc}</div>
              <div className="pt-price">
                <span className="pt-price-now">{p.price}</span>
                {p.oldPrice && <span className="pt-price-old">{p.oldPrice}</span>}
              </div>
              {p.perMonth && (
                <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "10px", marginTop: "-4px" }}>
                  {p.perMonth}
                </div>
              )}
              <button
                className="pt-cta"
                onClick={() => mode === "personal" && handleBuy(p.tier)}
                disabled={loadingTier === p.tier || mode === "team"}
                style={mode === "team" ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              >
                {mode === "team" ? "Coming Soon" : loadingTier === p.tier ? "Loading..." : p.cta}
              </button>
              <div className="pt-tagline">{p.tagline}</div>
            </div>
          ))}
        </div>

        {data.features.map((row) => (
          <div className="pt-row" key={row.label}>
            <div className="pt-cell pt-left">
              <span className="pt-feature">{row.label}</span>
            </div>
            {row.values.map((v, i) => (
              <div className={`pt-cell pt-value${data.plans[i]?.popular ? " pt-popular-col" : ""}`} key={i}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {typeof v === "boolean" ? (v ? <CheckIcon /> : <XIcon />) : <span>{v}</span>}
                  {row.subtitles && row.subtitles[i] && (
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                      {row.subtitles[i]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="pricing-foot">
        <span className="refund">Refundable up to 30 days</span>
      </div>

      {/* Ground Station Add-on */}
      <section style={{ marginTop: 56 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div className="small" style={{ letterSpacing: "0.08em", marginBottom: 6 }}>ADD-ON</div>
          <h2 style={{ fontSize: 26 }}>FinalPing Ground Station</h2>
          <p style={{ maxWidth: 520, margin: "8px auto 0" }}>
            Plug in your own ADS-B receiver for ultra-accurate landing and takeoff detection. Your local antenna captures what cloud APIs miss — with no reliance on adsb.lol or any third-party data feed.
          </p>
        </div>

        <div style={{
          maxWidth: 600, margin: "0 auto",
          background: "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(14,165,233,0.03))",
          border: "1px solid rgba(14,165,233,0.25)", borderRadius: 16, padding: "32px 36px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 24, flexWrap: "wrap" as const,
        }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginBottom: 8, letterSpacing: "0.04em" }}>
              📡 GROUND STATION
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>
              $29.99 <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>one-time</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              Requires a compatible ADS-B receiver (RTL-SDR, FlightAware stick, etc.) and an active FinalPing subscription.
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column" as const, gap: 6 }}>
              {[
                "Precise landing alerts — actual wheels-down touchdown detection",
                "Takeoff alerts — detect the moment an aircraft lifts off",
                "2–5 second latency vs 30–60+ seconds via adsb.lol",
                "No data gaps — zero dependency on cloud API availability",
                "Ground movement tracking: taxiways, ramps, and runways",
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
            <div style={{ fontSize: 11, color: "var(--muted)" }}>One-time purchase · No subscription</div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <a href="/groundstationsetup" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "underline" }}>Setup guide</a>
              <a href="/groundstationdevices" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "underline" }}>Buy a receiver</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
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
    </div>
  );
}
