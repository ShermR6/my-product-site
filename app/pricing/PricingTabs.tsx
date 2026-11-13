"use client";

// The pricing page: one plan, billed monthly or yearly.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { Check } from "lucide-react";
import { PLAN, type Billing } from "@/lib/plan";
import { faqs } from "./faqs";

const INCLUDED = [
  `Track up to ${PLAN.aircraft} aircraft`,
  "Unlimited alert distances, set per airport or per aircraft",
  "Landing and takeoff alerts",
  "Live map with runways and approach paths",
  "Discord, email, Slack, Microsoft Teams and Google Chat",
  "Telegram and webhooks",
  `Text message alerts, ${PLAN.smsPerMonth} a month`,
  "Choose which alerts go to which channel",
  "Your own alert wording, plus quiet hours",
  "Alert history with CSV export",
  "Ground Station support for your own receiver",
  "Runs in your browser, nothing to install",
];

const usd = (n: number) => `$${n.toFixed(2)}`;

export default function PricingTabs() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [busy, setBusy] = useState<null | "trial" | "buy">(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const router = useRouter();
  const yearly = billing === "yearly";

  /** Start the trial or buy outright; both end at Stripe's checkout page. */
  async function go(kind: "trial" | "buy") {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(kind === "trial" ? "/api/trial" : "/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: PLAN.tier, billing }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || data.requireLogin) {
        router.push("/login?callbackUrl=/pricing");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* ── Header ── */}
      <div className="pricing-head">
        <h1>One plan. Everything included.</h1>
        <p className="pricing-sub">
          Try it free for {PLAN.trialDays} days. 30-day money-back guarantee. Cancel anytime.
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}>
          <div
            role="group" aria-label="Billing period"
            style={{ display: "inline-flex", padding: 4, borderRadius: 999, background: "var(--panel-2)", border: "1px solid var(--border)" }}
          >
            {(["monthly", "yearly"] as const).map((freq) => {
              const selected = billing === freq;
              return (
                <button
                  key={freq}
                  onClick={() => setBilling(freq)}
                  aria-pressed={selected}
                  style={{
                    position: "relative", appearance: "none", border: "none", background: "none",
                    padding: "8px 18px", borderRadius: 999, cursor: "pointer",
                    fontFamily: "inherit", fontSize: 13, fontWeight: 700, textTransform: "capitalize",
                    color: selected ? "var(--text)" : "var(--muted)",
                    display: "inline-flex", alignItems: "center", gap: 8, transition: "color 0.2s",
                  }}
                >
                  {selected && (
                    <motion.span
                      layoutId="billing-pill"
                      transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
                      style={{
                        position: "absolute", inset: 0, borderRadius: 999,
                        background: "var(--panel)", border: "1px solid var(--border)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                      }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 1 }}>{freq}</span>
                  {freq === "yearly" && (
                    <span style={{
                      position: "relative", zIndex: 1,
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                      padding: "2px 8px", borderRadius: 999,
                      background: "var(--good-bg)", color: "var(--good)", border: "1px solid var(--good-border)",
                    }}>
                      Save {PLAN.yearlySaving}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── The plan ── */}
      <div className="plan-one">
        <div className="plan-one-price">
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
            FinalPing {PLAN.name}
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text)", lineHeight: 1 }}>
              <NumberFlow
                value={yearly ? PLAN.yearlyPerMonth : PLAN.monthly}
                format={{ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              />
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>/mo</span>
            {yearly && (
              <span style={{ fontSize: 14, color: "var(--muted)", textDecoration: "line-through" }}>{usd(PLAN.monthly)}</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, minHeight: 20 }}>
            {yearly ? `Billed ${usd(PLAN.yearly)} once a year` : "Billed monthly"}
          </div>

          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, margin: "20px 0 22px" }}>
            Know when your aircraft is inbound, on final and on the ground, wherever you want the alert.
          </p>

          <button
            className="pt-cta"
            style={{ maxWidth: "100%", width: "100%", fontSize: 14, padding: "13px 14px" }}
            onClick={() => go("trial")}
            disabled={busy !== null}
          >
            {busy === "trial" ? "Loading…" : `Start ${PLAN.trialDays}-day free trial`}
          </button>
          <button
            onClick={() => go("buy")}
            disabled={busy !== null}
            style={{
              width: "100%", marginTop: 10, padding: "12px 14px", borderRadius: 999,
              fontSize: 13, fontWeight: 700, fontFamily: "inherit",
              cursor: busy ? "default" : "pointer", background: "transparent",
              border: "1px solid var(--border-strong)", color: "var(--text)",
              opacity: busy === "buy" ? 0.6 : 1,
            }}
          >
            {busy === "buy" ? "Loading…" : "Subscribe now"}
          </button>

          {error && (
            <div role="alert" style={{ fontSize: 13, color: "var(--bad)", marginTop: 12, lineHeight: 1.5 }}>{error}</div>
          )}

          <div className="pt-tagline" style={{ marginTop: 14, lineHeight: 1.6 }}>
            The trial needs a card, and nothing is charged until it ends. Refundable for 30 days after that.
          </div>
        </div>

        <div className="plan-one-list">
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>
            What you get
          </div>
          <ul className="plan-one-items">
            {INCLUDED.map((item) => (
              <li key={item}>
                <span className="plan-one-tick" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Around the plan ── */}
      <div className="plan-notes">
        <div className="panel" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Ground Station, included</h2>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: "0 0 12px" }}>
            Connect your own ADS-B receiver and alerts arrive in under 10 seconds instead of about 30, with touchdown and liftoff detected at your field. It used to be a paid add-on. Now it comes with the plan.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
            <Link href="/groundstationkit" style={{ color: "var(--text)", textDecoration: "underline" }}>Receiver kits</Link>
            <Link href="/groundstationsetup" style={{ color: "var(--text)", textDecoration: "underline" }}>Setup guide</Link>
          </div>
        </div>
        <div className="panel" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>More than {PLAN.aircraft} aircraft?</h2>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: "0 0 12px" }}>
            Flight schools, FBOs and fleet operators: tell us how many aircraft and people you have and we will set you up. FinalPing for Teams, with shared tracking for a whole crew, is in development.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
            <Link href="/contact" style={{ color: "var(--text)", textDecoration: "underline" }}>Contact us</Link>
            <Link href="/waitlist" style={{ color: "var(--text)", textDecoration: "underline" }}>Teams waitlist</Link>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <section style={{ marginTop: 56 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="small" style={{ letterSpacing: "0.08em", marginBottom: 6 }}>FAQ</div>
          <h2 style={{ fontSize: 26 }}>Pricing questions</h2>
          <p style={{ maxWidth: 480, margin: "8px auto 0" }}>
            Common questions about the plan, billing and refunds.
          </p>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((f) => {
            const open = openFaq === f.q;
            return (
              <div className="panel" key={f.q} style={{ padding: 0, overflow: "hidden" }}>
                <button
                  onClick={() => setOpenFaq(open ? null : f.q)}
                  aria-expanded={open}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                    padding: 20, background: "none", border: "none", cursor: "pointer",
                    fontFamily: "inherit", textAlign: "left",
                  }}
                >
                  <h3 style={{ fontSize: 14, margin: 0, color: "var(--text)" }}>{f.q}</h3>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                    style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .25s ease" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .3s ease" }}>
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ fontSize: 13, margin: 0, lineHeight: 1.7, padding: "0 20px 20px" }}>{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
