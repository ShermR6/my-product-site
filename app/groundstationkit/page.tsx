"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [stubbyAntenna, setStubbyAntenna] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const basePrice = 200;
  const addonPrice = 25;
  const stubbyPrice = 20;
  const total = basePrice + (builtAndFlashed ? addonPrice : 0) + (stubbyAntenna ? stubbyPrice : 0);

  const handleOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const tier = builtAndFlashed ? "ground-station-kit-built" : "ground-station-kit";
      const addons = stubbyAntenna ? ["stubby-antenna"] : [];
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, addons }),
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
                { src: "/ground/814LpKbBx3L._AC_SL1500_.jpg", label: "Pi Zero 2 W Kit" },
                { src: "/ground/ProStick_Plus_open.jpg", label: "Pro Stick Plus" },
                { src: "/ground/51jXcyrG51L._AC_SL1001_.jpg", label: "1090MHz Antenna" },
                { src: "/ground/stubby-antenna.jpg", label: "6dBi Stubby Antenna (Add-on)" },
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

              {/* Stubby antenna add-on */}
              <div
                onClick={() => setStubbyAntenna(v => !v)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "16px", borderRadius: 12, marginBottom: 20,
                  border: stubbyAntenna ? "1px solid rgba(14,165,233,0.5)" : "1px solid var(--border)",
                  background: stubbyAntenna ? "rgba(14,165,233,0.1)" : "rgba(255,255,255,0.03)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: stubbyAntenna ? "2px solid #0ea5e9" : "2px solid rgba(255,255,255,0.2)",
                  background: stubbyAntenna ? "#0ea5e9" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {stubbyAntenna && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                    Stubby Antenna Add-on
                    <span style={{
                      marginLeft: 8, fontSize: 11, fontWeight: 700,
                      padding: "2px 8px", borderRadius: 999,
                      background: "rgba(14,165,233,0.15)", color: "var(--accent)",
                      border: "1px solid rgba(14,165,233,0.3)",
                    }}>+$20</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                    Higher gain 5dBi antenna that screws directly onto the receiver — better range than the included 2.5dBi cable antenna with a smaller, cleaner setup.
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
                Secure checkout via Stripe. We&apos;ll collect shipping details after payment.
              </div>

              {/* PC note */}
              <div style={{
                padding: "12px 14px", borderRadius: 10, marginBottom: 20,
                background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
                fontSize: 12, color: "var(--muted)", lineHeight: 1.7,
              }}>
                💡 <strong style={{ color: "var(--text)" }}>Don&apos;t need a Pi?</strong> If your PC runs 24/7 you can skip the kit and plug a Pro Stick Plus directly into your computer. Buy the{" "}
                <a href="https://flightaware.store/products/pro-stick-plus" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Pro Stick Plus from FlightAware</a>
                {" "}and follow the <a href="/groundstationsetup" style={{ color: "var(--accent)" }}>Windows or Mac setup guide</a>.
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
                View full setup guide →
              </Link>
            </div>
          </div>

        </div>

        {/* ── When your kit arrives ── */}
        <div style={{ marginTop: 72, borderTop: "1px solid var(--border)", paddingTop: 56 }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--accent)", marginBottom: 10 }}>
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
                    { n: 1, text: "Screw the antenna onto the Pro Stick Plus and plug it into the Pi's USB port via the included OTG cable." },
                    { n: 2, text: "Connect power to the Pi and wait about 60 seconds for it to boot." },
                    { n: 3, text: "On your phone, open WiFi settings and connect to FinalPing-Setup (password: finalping)." },
                    { n: 4, text: "The setup page opens automatically on your phone. Enter your home WiFi, FinalPing account credentials, location coordinates, and aircraft tail numbers." },
                    { n: 5, text: "Tap Connect Ground Station. Your Pi will reboot and start tracking within 30 seconds." },
                    { n: 6, text: "Alerts will fire through your existing FinalPing notification channels. You can verify your station is live at finalpingapp.com/dashboard." },
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
                  Use your phone — not a laptop — to connect to FinalPing-Setup. iPhones and Android phones open the setup page automatically. Computers do not.
                </div>
              </div>

              {/* Kit-only path */}
              <div style={{
                borderRadius: 16, border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.02)",
                padding: "28px 24px",
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
                    { n: 2, text: "Screw the antenna onto the Pro Stick Plus." },
                    { n: 3, text: "Connect power and SSH into the Pi (or use the full setup guide below)." },
                    { n: 4, text: "Run the one-line Raspberry Pi installer — it handles drivers, dump1090, and FinalPing Ground Station automatically." },
                    { n: 5, text: "Follow the prompts to enter your account credentials, coordinates, and aircraft." },
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
