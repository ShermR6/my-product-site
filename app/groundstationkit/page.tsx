"use client";

import { useState } from "react";
import Link from "next/link";

const INCLUDED = [
  {
    icon: "🖥️",
    name: "CanaKit Raspberry Pi Zero 2 W Starter Kit",
    detail: "Pi board · official case · 2.5A power supply · 32GB SD card · OTG cable",
  },
  {
    icon: "📻",
    name: "FlightAware Pro Stick Plus",
    detail: "Built-in 1090MHz bandpass filter · 19dB low-noise amplifier",
  },
  {
    icon: "📡",
    name: "1090MHz ADS-B Magnetic Antenna",
    detail: "Magnet base · 1m RG174 cable · MCX-to-SMA adapter included",
  },
];

const SPECS = [
  { label: "Frequency", value: "1090 MHz (ADS-B)" },
  { label: "Range", value: "Up to 200+ nm line-of-sight" },
  { label: "Latency", value: "1–2 seconds" },
  { label: "Power", value: "5V micro-USB (2.5A supply included)" },
  { label: "Connectivity", value: "WiFi 802.11 b/g/n (2.4GHz)" },
  { label: "OS", value: "Raspberry Pi OS Lite (pre-loaded)" },
];

export default function GroundStationKitPage() {
  const [builtAndFlashed, setBuiltAndFlashed] = useState(false);
  const basePrice = 200;
  const addonPrice = 25;
  const total = basePrice + (builtAndFlashed ? addonPrice : 0);

  return (
    <main className="page">
      <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 32, display: "flex", gap: 6, alignItems: "center" }}>
          <Link href="/groundstationdevices" style={{ color: "var(--muted)", textDecoration: "none" }}>Hardware Guide</Link>
          <span>›</span>
          <span style={{ color: "var(--text)" }}>Ground Station Kit</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 48, alignItems: "start" }}>

          {/* Left — product info */}
          <div>
            {/* Badge */}
            <div style={{
              display: "inline-block", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
              textTransform: "uppercase", padding: "3px 12px", borderRadius: 999,
              background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)",
              color: "var(--accent)", marginBottom: 14,
            }}>
              FinalPing Official Bundle
            </div>

            <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              Ground Station Kit
            </h1>
            <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 36px", maxWidth: 560 }}>
              A complete, ready-to-run ADS-B ground station. Plug it in, connect to WiFi, and start receiving live aircraft positions with 1–2 second latency — directly from the sky, no third-party data feeds required.
            </p>

            {/* Component images */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 36 }}>
              {[
                { src: "https://m.media-amazon.com/images/I/71GnMN3G03L._AC_SL1200_.jpg", label: "Pi Zero 2 W Kit" },
                { src: "https://m.media-amazon.com/images/I/71it4FmVFbL._AC_SL1500_.jpg", label: "Pro Stick Plus" },
                { src: "https://m.media-amazon.com/images/I/51mE8r6AATL._AC_SL1500_.jpg", label: "1090MHz Antenna" },
              ].map(item => (
                <div key={item.label} style={{
                  borderRadius: 12, overflow: "hidden",
                  background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                  padding: 12, textAlign: "center",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.src} alt={item.label} style={{ width: "100%", height: 100, objectFit: "contain", marginBottom: 8 }} />
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* What's included */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>
                What&apos;s Included
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {INCLUDED.map(item => (
                  <div key={item.name} style={{
                    display: "flex", gap: 14, alignItems: "flex-start",
                    padding: "14px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
                    }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Specs */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>
                Specs
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {SPECS.map(s => (
                  <div key={s.label} style={{
                    padding: "11px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
                  }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — purchase panel */}
          <div style={{ position: "sticky", top: 24 }}>
            <div style={{
              borderRadius: 18, border: "1px solid rgba(14,165,233,0.3)",
              background: "linear-gradient(160deg, rgba(14,165,233,0.08), rgba(14,165,233,0.02))",
              padding: "28px 24px",
            }}>

              {/* Price */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>
                    ${total}
                  </span>
                  {builtAndFlashed && (
                    <span style={{ fontSize: 14, color: "var(--muted)", textDecoration: "line-through" }}>$200</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Free shipping · Ships within 3–5 business days</div>
              </div>

              {/* Add-on toggle */}
              <div
                onClick={() => setBuiltAndFlashed(v => !v)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "16px", borderRadius: 12, marginBottom: 20,
                  border: builtAndFlashed ? "1px solid rgba(14,165,233,0.5)" : "1px solid var(--border)",
                  background: builtAndFlashed ? "rgba(14,165,233,0.1)" : "rgba(255,255,255,0.03)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: builtAndFlashed ? "2px solid #0ea5e9" : "2px solid rgba(255,255,255,0.2)",
                  background: builtAndFlashed ? "#0ea5e9" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {builtAndFlashed && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                    Pre-built &amp; Pre-flashed
                    <span style={{
                      marginLeft: 8, fontSize: 11, fontWeight: 700,
                      padding: "2px 8px", borderRadius: 999,
                      background: "rgba(14,165,233,0.15)", color: "var(--accent)",
                      border: "1px solid rgba(14,165,233,0.3)",
                    }}>+$25</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                    We assemble the hardware and pre-load FinalPing software. Plug in power, connect to WiFi, done.
                  </div>
                </div>
              </div>

              {/* Order button */}
              <a
                href={`/contact?subject=Ground+Station+Kit${builtAndFlashed ? "+%28Built+%26+Flashed%29" : ""}&total=$${total}`}
                style={{
                  display: "block", textAlign: "center",
                  padding: "14px", borderRadius: 12, marginBottom: 12,
                  background: "#0ea5e9", color: "#fff",
                  fontSize: 15, fontWeight: 800, textDecoration: "none",
                  letterSpacing: "-0.01em",
                }}
              >
                Order Now — ${total}
              </a>

              <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
                We&apos;ll confirm your order and collect shipping details via email.
              </div>

              {/* Trust points */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 18 }}>
                {[
                  "✓ All parts sourced and tested",
                  "✓ Works with your existing FinalPing license",
                  "✓ Full setup guide included",
                ].map(t => (
                  <div key={t} style={{ fontSize: 12, color: "var(--muted)" }}>{t}</div>
                ))}
              </div>
            </div>

            {/* Setup guide link */}
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <Link href="/groundstationsetup" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>
                View setup guide →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
