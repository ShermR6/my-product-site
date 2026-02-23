"use client";

import { useMemo, useState } from "react";

type Plan = {
  name: string;
  tier: string;
  price: string;
  oldPrice?: string;
  tagline: string;
  cta: string;
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
      { name: "Premium", tier: "premium", price: "$24.99", oldPrice: "$74.99", tagline: "Monthly Access", cta: "Buy now" },
      { name: "Pro", tier: "pro", price: "$49.99", oldPrice: "$119.99", tagline: "Monthly Access", cta: "Buy now" },
    ];

    const teamPlans: Plan[] = [
      { name: "Team Starter", tier: "team-starter", price: "$19.99", oldPrice: "$54.99", tagline: "Monthly Team License", cta: "Buy now" },
      { name: "Team Premium", tier: "team-premium", price: "$34.99", oldPrice: "$89.99", tagline: "Monthly Team License", cta: "Buy now" },
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
        <h1>Choose the plan that's right for you</h1>
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
            <div className="pt-cell pt-plan" key={p.name}>
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
    </div>
  );
}
