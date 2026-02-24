"use client";

import { useMemo, useState } from "react";

type Plan = {
  name: string;
  tier: string;
  price: string;
  oldPrice?: string;
  tagline: string;
  cta: string;
  popular?: boolean;
};

type FeatureRow = {
  label: string;
  values: (string | boolean)[];
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
    a: "Yes — you can upgrade or downgrade your plan at any time. When you upgrade, you'll be charged the prorated difference. When you downgrade, the change takes effect at the start of your next billing cycle.",
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
    a: "Your subscription renews automatically each month. You'll receive an email receipt from Stripe, and your access continues uninterrupted.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. You can cancel your subscription at any time from your dashboard or by contacting support. You'll keep access until the end of your current billing period.",
  },
  {
    q: "What's the difference between Personal and Team plans?",
    a: "Personal plans are for individual users. Team plans include shared aircraft lists, shared coordinates, and (on higher tiers) role-based permissions so your whole crew can stay in sync.",
  },
];

export default function PricingTabs() {
  const [mode, setMode] = useState<"personal" | "team">("personal");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleBuy = async (tier: string) => {
    setLoadingTier(tier);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
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
    const personalPlans: Plan[] = [
      { name: "Starter", tier: "starter", price: "$14.99", oldPrice: "$49.99", tagline: "Monthly Access", cta: "Buy now" },
      { name: "Premium", tier: "premium", price: "$24.99", oldPrice: "$74.99", tagline: "Monthly Access", cta: "Buy now", popular: true },
      { name: "Pro", tier: "pro", price: "$49.99", oldPrice: "$119.99", tagline: "Monthly Access", cta: "Buy now" },
    ];

    const teamPlans: Plan[] = [
      { name: "Team Starter", tier: "team-starter", price: "$19.99", oldPrice: "$54.99", tagline: "Monthly Team License", cta: "Buy now" },
      { name: "Team Premium", tier: "team-premium", price: "$34.99", oldPrice: "$89.99", tagline: "Monthly Team License", cta: "Buy now", popular: true },
      { name: "Team Pro", tier: "team-pro", price: "$69.99", oldPrice: "$139.99", tagline: "Monthly Team License", cta: "Buy now" },
    ];

    const personalFeatures: FeatureRow[] = [
      { label: "Tracked aircraft", values: ["3", "10", "Unlimited"] },
      { label: "Saved coordinates", values: ["1", "5", "Unlimited"] },
      { label: "Distance alerts", values: [true, true, true] },
      { label: "Notification channels", values: ["Email", "Email + SMS", "Email + SMS + Push"] },
      { label: "Advanced filters", values: [false, true, true] },
      { label: "Priority support", values: [false, false, true] },
    ];

    const teamFeatures: FeatureRow[] = [
      { label: "Seats", values: ["5", "15", "Unlimited"] },
      { label: "Shared aircraft lists", values: [true, true, true] },
      { label: "Shared coordinates", values: [true, true, true] },
      { label: "Roles & permissions", values: [false, true, true] },
      { label: "Org-wide alert rules", values: [false, true, true] },
      { label: "Priority support", values: [true, true, true] },
    ];

    return mode === "personal"
      ? { plans: personalPlans, features: personalFeatures }
      : { plans: teamPlans, features: teamFeatures };
  }, [mode]);

  return (
    <div>
      <div className="pricing-head">
        <h1>Choose the plan that&apos;s right for you</h1>
        <p className="pricing-sub">Feel secure in your purchase with a 30 day money-back guarantee.</p>

        <div className="tabbar" role="tablist">
          <button className={`tab ${mode === "personal" ? "active" : ""}`} onClick={() => setMode("personal")} role="tab">Personal</button>
          <button className={`tab ${mode === "team" ? "active" : ""}`} onClick={() => setMode("team")} role="tab">Team</button>
        </div>
      </div>

      <div className="pricing-table">
        <div className="pt-row pt-header">
          <div className="pt-cell pt-left" />
          {data.plans.map((p) => (
            <div className="pt-cell pt-plan" key={p.name} style={{ position: "relative" }}>
              {p.popular && (
                <span style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: "var(--accent)",
                  color: "#000",
                }}>
                  Most Popular
                </span>
              )}
              <div className="pt-plan-title">{p.name}</div>
              <div className="pt-price">
                <span className="pt-price-now">{p.price}</span>
                {p.oldPrice && <span className="pt-price-old">{p.oldPrice}</span>}
              </div>
              <button
                className="pt-cta"
                onClick={() => handleBuy(p.tier)}
                disabled={loadingTier === p.tier}
              >
                {loadingTier === p.tier ? "Loading..." : p.cta}
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
              <div className="pt-cell pt-value" key={i}>
                {typeof v === "boolean" ? (v ? <CheckIcon /> : <XIcon />) : <span>{v}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="pricing-foot">
        <span className="refund">Refundable up to 30 days</span>
      </div>

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
