"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const KITS = [
  {
    id: "standard",
    name: "Standard Kit",
    antenna: "2.5dBi Stand Antenna",
    antennaDetail: "Magnetic base · 1m RG174 cable · MCX-to-SMA adapter",
    antennaImg: "/ground/51jXcyrG51L._AC_SL1001_.jpg",
    basePrice: 200,
    builtPrice: 225,
    tier: "ground-station-kit",
    builtTier: "ground-station-kit-built",
    highlight: false,
  },
  {
    id: "stubby",
    name: "Stubby Kit",
    antenna: "6dBi Stubby Antenna",
    antennaDetail: "Direct-mount · compact profile · higher gain",
    antennaImg: "/ground/stubby-antenna.jpg",
    basePrice: 220,
    builtPrice: 245,
    tier: "ground-station-kit-stubby",
    builtTier: "ground-station-kit-stubby-built",
    highlight: true,
  },
];

const INCLUDED_BASE = [
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
];

const SPECS = [
  { label: "Frequency", value: "1090 MHz (ADS-B)" },
  { label: "Range", value: "Up to 200+ nm line-of-sight" },
  { label: "Latency", value: "1–2 seconds" },
  { label: "Power", value: "5V micro-USB (2.5A supply included)" },
  { label: "Connectivity", value: "WiFi 802.11 b/g/n (2.4GHz)" },
  { label: "OS", value: "Raspberry Pi OS Lite (pre-loaded)" },
];

const INDIVIDUAL_PARTS = [
  {
    id: "pro-stick-plus",
    name: "FlightAware Pro Stick Plus",
    detail: "1090MHz bandpass filter · 19dB LNA · USB dongle",
    img: "/ground/ProStick_Plus_open.jpg",
    price: 60,
    tier: "pro-stick-plus",
  },
  {
    id: "stand-antenna",
    name: "1090MHz Stand Antenna",
    detail: "2.5dBi · magnetic base · 1m RG174 cable · MCX-to-SMA adapter",
    img: "/ground/51jXcyrG51L._AC_SL1001_.jpg",
    price: 15,
    tier: "stand-antenna",
  },
  {
    id: "stubby-antenna",
    name: "6dBi Stubby Antenna",
    detail: "Direct-mount · compact · higher gain than included stand antenna",
    img: "/ground/stubby-antenna.jpg",
    price: 30,
    tier: "stubby-antenna-solo",
  },
];

export default function GroundStationKitPage() {
  const [selectedKit, setSelectedKit] = useState<"standard" | "stubby">("standard");
  const [builtAndFlashed, setBuiltAndFlashed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [partLoading, setPartLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const kit = KITS.find(k => k.id === selectedKit)!;
  const total = builtAndFlashed ? kit.builtPrice : kit.basePrice;

  const handleOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const tier = builtAndFlashed ? kit.builtTier : kit.tier;
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.status === 401 || data.requireLogin) {
        router.push("/login?callbackUrl=/groundstationkit");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePartOrder = async (tier: string) => {
    setPartLoading(tier);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.status === 401 || data.requireLogin) {
        router.push("/login?callbackUrl=/groundstationkit");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      // silent
    } finally {
      setPartLoading(null);
    }
  };

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

            {/* Kit selector */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>
                Choose Your Kit
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {KITS.map(k => (
                  <div
                    key={k.id}
                    onClick={() => setSelectedKit(k.id as "standard" | "stubby")}
                    style={{
                      padding: "18px 20px", borderRadius: 14, cursor: "pointer",
                      border: selectedKit === k.id ? "2px solid #0ea5e9" : "1px solid var(--border)",
                      background: selectedKit === k.id ? "rgba(14,165,233,0.08)" : "rgba(255,255,255,0.02)",
                      transition: "all 0.15s", position: "relative",
                    }}
                  >
                    {k.highlight && (
                      <div style={{
                        position: "absolute", top: -1, right: 12,
                        fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
                        textTransform: "uppercase", padding: "2px 8px", borderRadius: 999,
                        background: "var(--accent)", color: "#000",
                      }}>Popular</div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                        border: selectedKit === k.id ? "5px solid #0ea5e9" : "2px solid rgba(255,255,255,0.3)",
                        background: selectedKit === k.id ? "#fff" : "transparent",
                        transition: "all 0.15s",
                      }} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{k.name}</div>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, marginBottom: 4, paddingLeft: 28 }}>
                      📡 {k.antenna}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 28 }}>{k.antennaDetail}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", marginTop: 12, paddingLeft: 28 }}>
                      ${k.basePrice}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What's included */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>
                What&apos;s Included
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {INCLUDED_BASE.map(item => (
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
                <div style={{
                  display: "flex", gap: 14, alignItems: "flex-start",
                  padding: "14px 16px", borderRadius: 12,
                  background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.2)",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
                  }}>📡</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                      {kit.antenna}
                      <span style={{
                        marginLeft: 8, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                        background: "rgba(14,165,233,0.15)", color: "var(--accent)",
                        border: "1px solid rgba(14,165,233,0.3)",
                      }}>Selected</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{kit.antennaDetail}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Specs */}
            <div style={{ marginBottom: 48 }}>
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
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>
                    ${total}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  + shipping · Ships within 3–5 business days
                </div>
              </div>

              {/* Selected kit summary */}
              <div style={{
                padding: "12px 14px", borderRadius: 10, marginBottom: 16,
                background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)",
                fontSize: 13, color: "var(--text)",
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{kit.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Pi Zero 2 W · Pro Stick Plus · {kit.antenna}</div>
              </div>

              {/* Pre-built toggle */}
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
                    We assemble and pre-load FinalPing software. Plug in power, connect to WiFi, done.
                  </div>
                </div>
              </div>

              {/* Order button */}
              <button
                onClick={handleOrder}
                disabled={loading}
                style={{
                  display: "block", width: "100%", textAlign: "center",
                  padding: "14px", borderRadius: 12, marginBottom: 12,
                  background: loading ? "rgba(14,165,233,0.5)" : "#0ea5e9", color: "#fff",
                  fontSize: 15, fontWeight: 800, border: "none", cursor: loading ? "default" : "pointer",
                  letterSpacing: "-0.01em",
                }}
              >
                {loading ? "Loading..." : `Order Now — $${total}`}
              </button>

              {error && (
                <div style={{ fontSize: 12, color: "#f87171", textAlign: "center", marginBottom: 8 }}>{error}</div>
              )}

              <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
                Secure checkout via Stripe · Shipping calculated at checkout
              </div>

              {/* PC note */}
              <div style={{
                padding: "12px 14px", borderRadius: 10, marginBottom: 20,
                background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
                fontSize: 12, color: "var(--muted)", lineHeight: 1.7,
              }}>
                💡 <strong style={{ color: "var(--text)" }}>Don&apos;t need a Pi?</strong> If your PC runs 24/7, plug a Pro Stick Plus directly into your computer. Buy individual parts below or{" "}
                <a href="https://flightaware.store/products/pro-stick-plus" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>from FlightAware</a>.
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

            <div style={{ textAlign: "center", marginTop: 14 }}>
              <Link href="/groundstationsetup" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>
                View full setup guide →
              </Link>
            </div>
          </div>

        </div>

        {/* Individual Parts */}
        <div style={{ marginTop: 72, borderTop: "1px solid var(--border)", paddingTop: 56 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
              Individual Parts
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
              Already have some of the hardware?
            </h2>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, maxWidth: 560, margin: 0 }}>
              Pick up just what you need. All parts are the same ones included in the kits.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {INDIVIDUAL_PARTS.map(part => (
              <div key={part.id} style={{
                borderRadius: 16, border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.02)", padding: "24px 20px",
                display: "flex", flexDirection: "column", gap: 16,
              }}>
                <div style={{
                  borderRadius: 10, overflow: "hidden",
                  background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                  padding: 12, textAlign: "center",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={part.img} alt={part.name} style={{ width: "100%", height: 100, objectFit: "contain" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{part.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{part.detail}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>${part.price}</span>
                  <button
                    onClick={() => handlePartOrder(part.tier)}
                    disabled={partLoading === part.tier}
                    style={{
                      padding: "9px 18px", borderRadius: 10, border: "none",
                      background: partLoading === part.tier ? "rgba(14,165,233,0.4)" : "rgba(14,165,233,0.15)",
                      color: "var(--accent)", fontSize: 13, fontWeight: 700,
                      cursor: partLoading === part.tier ? "default" : "pointer",
                      border: "1px solid rgba(14,165,233,0.3)" as any,
                    }}
                  >
                    {partLoading === part.tier ? "..." : "Buy →"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Setup guide section */}
        <div style={{ marginTop: 72, borderTop: "1px solid var(--border)", paddingTop: 56 }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 10 }}>
              Getting Started
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
              When your kit arrives
            </h2>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 40px" }}>
              Two paths depending on what you ordered.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Pre-built path */}
              <div style={{
                borderRadius: 16, border: "1px solid rgba(14,165,233,0.3)",
                background: "linear-gradient(160deg, rgba(14,165,233,0.06), rgba(14,165,233,0.02))",
                padding: "28px 24px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <div style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800,
                    letterSpacing: "0.1em", textTransform: "uppercase" as const,
                    background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)", color: "var(--accent)",
                  }}>Pre-built &amp; Pre-flashed</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                  {[
                    { n: 1, text: "Attach the antenna to the Pro Stick Plus and plug it into the Pi's USB port via the included OTG cable." },
                    { n: 2, text: "Connect power to the Pi and wait about 60 seconds for it to boot." },
                    { n: 3, text: "On your phone, open WiFi settings and connect to FinalPing-Setup (password: finalping)." },
                    { n: 4, text: "The setup page opens automatically. Enter your home WiFi, FinalPing credentials, coordinates, and aircraft tail numbers." },
                    { n: 5, text: "Tap Connect Ground Station. Your Pi reboots and starts tracking within 30 seconds." },
                    { n: 6, text: "Alerts fire through your existing FinalPing notification channels. Verify live status at finalpingapp.com/dashboard." },
                  ].map(step => (
                    <div key={step.n} style={{ display: "flex", gap: 14 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                        background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800, color: "var(--accent)",
                      }}>{step.n}</div>
                      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{step.text}</p>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 20, padding: "12px 14px", borderRadius: 10,
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                  fontSize: 12, color: "#fcd34d", lineHeight: 1.6,
                }}>
                  Use your phone — not a laptop — to connect to FinalPing-Setup. iPhones and Android phones open the setup page automatically.
                </div>
              </div>

              {/* Kit-only path */}
              <div style={{
                borderRadius: 16, border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.02)", padding: "28px 24px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <div style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800,
                    letterSpacing: "0.1em", textTransform: "uppercase" as const,
                    background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", color: "var(--muted)",
                  }}>Kit Only</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                  {[
                    { n: 1, text: "Assemble the Pi: attach the case, insert the SD card, connect the Pro Stick Plus via the OTG cable." },
                    { n: 2, text: "Attach the antenna to the Pro Stick Plus." },
                    { n: 3, text: "Connect power and SSH into the Pi (or use the full setup guide below)." },
                    { n: 4, text: "Run the one-line Raspberry Pi installer — it handles drivers, dump1090, and FinalPing Ground Station automatically." },
                    { n: 5, text: "Follow the prompts to enter your credentials, coordinates, and aircraft." },
                    { n: 6, text: "Ground Station starts automatically on every boot." },
                  ].map(step => (
                    <div key={step.n} style={{ display: "flex", gap: 14 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                        background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800, color: "var(--muted)",
                      }}>{step.n}</div>
                      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{step.text}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20 }}>
                  <Link href="/groundstationsetup" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 18px", borderRadius: 999,
                    background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
                    color: "var(--text)", fontSize: 13, fontWeight: 600, textDecoration: "none",
                  }}>
                    Full Setup Guide →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
