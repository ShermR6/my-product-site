"use client";

import { useState } from "react";

const plans = [
  { name: "Starter", price: "$14.99/mo", aircraft: "3", channels: "2", support: false },
  { name: "Premium", price: "$24.99/mo", aircraft: "7", channels: "5", support: true },
  { name: "Pro",     price: "$49.99/mo", aircraft: "15", channels: "8", support: true },
];

const rows = [
  { label: "Price",                  key: "price" },
  { label: "Tracked aircraft",       key: "aircraft" },
  { label: "Notification channels",  key: "channels" },
  { label: "Distance alerts",        key: "alerts" },
  { label: "Priority support",       key: "support" },
];

function Check() {
  return <span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span>;
}
function Cross() {
  return <span style={{ color: "#4b5563", fontWeight: 700 }}>✕</span>;
}

export default function ComparePlans() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: 6 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: "none", border: "none", padding: 0,
          color: "var(--accent)", fontSize: 13, fontWeight: 600,
          cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3,
        }}
      >
        {open ? "Hide plan comparison ↑" : "Compare plans ↓"}
      </button>

      {open && (
        <div style={{
          marginTop: 16, borderRadius: 12,
          border: "1px solid var(--border)",
          overflow: "hidden",
          fontSize: 13,
        }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", background: "rgba(255,255,255,0.04)" }}>
            <div style={{ padding: "12px 16px", fontWeight: 700, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>Feature</div>
            {plans.map(p => (
              <div key={p.name} style={{ padding: "12px 16px", fontWeight: 800, textAlign: "center", color: "var(--text)", borderLeft: "1px solid var(--border)" }}>{p.name}</div>
            ))}
          </div>

          {/* Data rows */}
          {rows.map((row, i) => (
            <div key={row.key} style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
              borderTop: "1px solid var(--border)",
              background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
            }}>
              <div style={{ padding: "11px 16px", color: "var(--muted)" }}>{row.label}</div>
              {plans.map(p => {
                const val = p[row.key as keyof typeof p];
                return (
                  <div key={p.name} style={{ padding: "11px 16px", textAlign: "center", fontWeight: 600, borderLeft: "1px solid var(--border)" }}>
                    {row.key === "alerts" ? <Check /> :
                     typeof val === "boolean" ? (val ? <Check /> : <Cross />) :
                     <span style={{ color: "var(--text)" }}>{val}</span>}
                  </div>
                );
              })}
            </div>
          ))}

          {/* CTA row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderTop: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ padding: "14px 16px" }} />
            {plans.map(p => (
              <div key={p.name} style={{ padding: "14px 16px", textAlign: "center", borderLeft: "1px solid var(--border)" }}>
                <a
                  href="/pricing"
                  style={{
                    display: "inline-block", padding: "7px 16px", borderRadius: 8,
                    background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)",
                    color: "var(--accent)", fontSize: 12, fontWeight: 700, textDecoration: "none",
                  }}
                >
                  Buy {p.name} →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
