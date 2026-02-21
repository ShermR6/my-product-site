"use client";

import { useMemo, useState } from "react";

type Plan = {
  name: string;
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

  const data = useMemo(() => {
    const personalPlans: Plan[] = [
      { name: "License Tier 1", price: "$39", oldPrice: "$275", tagline: "Lifetime access", cta: "Buy now" },
      { name: "License Tier 2", price: "$69", oldPrice: "$448", tagline: "Lifetime access", cta: "Buy now" },
      { name: "License Tier 3", price: "$139", oldPrice: "$950", tagline: "Lifetime access", cta: "Buy now" },
    ];

    const teamPlans: Plan[] = [
      { name: "Team Tier 1", price: "$99", oldPrice: "$599", tagline: "Team license", cta: "Buy now" },
      { name: "Team Tier 2", price: "$199", oldPrice: "$999", tagline: "Team license", cta: "Buy now" },
      { name: "Team Tier 3", price: "$399", oldPrice: "$1,999", tagline: "Team license", cta: "Buy now" },
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
      ? { title: "Personal", plans: personalPlans, features: personalFeatures }
      : { title: "Team", plans: teamPlans, features: teamFeatures };
  }, [mode]);

  return (
    <div>
      <div className="pricing-head">
        <h1>Choose the plan that’s right for you</h1>
        <p className="pricing-sub">Feel secure in your purchase with a 60 day money-back guarantee.</p>

        <div className="tabbar" role="tablist" aria-label="Pricing mode">
          <button
            className={`tab ${mode === "personal" ? "active" : ""}`}
            onClick={() => setMode("personal")}
            role="tab"
            aria-selected={mode === "personal"}
          >
            Personal
          </button>
          <button
            className={`tab ${mode === "team" ? "active" : ""}`}
            onClick={() => setMode("team")}
            role="tab"
            aria-selected={mode === "team"}
          >
            Team
          </button>
        </div>
      </div>

      <div className="pricing-table">
        {/* header row */}
        <div className="pt-row pt-header">
          <div className="pt-cell pt-left" />
          {data.plans.map((p) => (
            <div className="pt-cell pt-plan" key={p.name}>
              <div className="pt-plan-title">{p.name}</div>

              <div className="pt-price">
                <span className="pt-price-now">{p.price}</span>
                {p.oldPrice ? <span className="pt-price-old">{p.oldPrice}</span> : null}
              </div>

              <button className="pt-cta">{p.cta}</button>
              <div className="pt-tagline">{p.tagline}</div>
            </div>
          ))}
        </div>

        {/* feature rows */}
        {data.features.map((row) => (
          <div className="pt-row" key={row.label}>
            <div className="pt-cell pt-left">
              <span className="pt-feature">{row.label}</span>
            </div>

            {row.values.map((v, i) => (
              <div className="pt-cell pt-value" key={`${row.label}-${i}`}>
                {typeof v === "boolean" ? (v ? <CheckIcon /> : <XIcon />) : <span>{v}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="pricing-foot">
        <span className="refund">Refundable up to 60 days</span>
      </div>
    </div>
  );
}