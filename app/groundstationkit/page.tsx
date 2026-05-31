"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const KITS = [
  {
    id: "standard",
    name: "Standard Kit",
    subtitle: "Pi + Pro Stick Plus + Stand Antenna",
    description: "Everything you need to run a full ADS-B ground station. Self-assemble and flash, or have it done for you.",
    img: "/ground/51jXcyrG51L._AC_SL1001_.jpg",
    basePrice: 200,
    builtPrice: 225,
    tier: "ground-station-kit",
    builtTier: "ground-station-kit-built",
    includes: ["Raspberry Pi Zero 2 W Starter Kit", "FlightAware Pro Stick Plus", "2.5dBi Stand Antenna"],
  },
  {
    id: "stubby",
    name: "Stubby Kit",
    subtitle: "Pi + Pro Stick Plus + Stubby Antenna",
    description: "Same full kit with the compact 6dBi stubby antenna — direct mount, higher gain, cleaner setup.",
    img: "/ground/stubby-antenna.jpg",
    basePrice: 220,
    builtPrice: 245,
    tier: "ground-station-kit-stubby",
    builtTier: "ground-station-kit-stubby-built",
    includes: ["Raspberry Pi Zero 2 W Starter Kit", "FlightAware Pro Stick Plus", "6dBi Stubby Antenna"],
    popular: true,
  },
];

const PARTS = [
  {
    id: "pro-stick-plus",
    name: "FlightAware Pro Stick Plus",
    description: "1090MHz bandpass filter with 19dB low-noise amplifier. The SDR dongle at the core of every kit.",
    img: "/ground/ProStick_Plus_open.jpg",
    price: 60,
    tier: "pro-stick-plus",
  },
  {
    id: "stand-antenna",
    name: "1090MHz Stand Antenna",
    description: "2.5dBi magnetic base antenna with 1m RG174 cable and MCX-to-SMA adapter.",
    img: "/ground/51jXcyrG51L._AC_SL1001_.jpg",
    price: 15,
    tier: "stand-antenna",
  },
  {
    id: "stubby-antenna",
    name: "6dBi Stubby Antenna",
    description: "Compact direct-mount antenna with higher gain than the standard stand antenna.",
    img: "/ground/stubby-antenna.jpg",
    price: 30,
    tier: "stubby-antenna-solo",
  },
];

function KitCard({ kit }: { kit: typeof KITS[0] }) {
  const [built, setBuilt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const price = built ? kit.builtPrice : kit.basePrice;

  const handleOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: built ? kit.builtTier : kit.tier }),
      });
      const data = await res.json();
      if (res.status === 401 || data.requireLogin) {
        router.push("/login?callbackUrl=/groundstationkit");
        return;
      }
      if (data.url) window.location.href = data.url;
      else setError("Something went wrong.");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: kit.popular ? "1px solid rgba(14,165,233,0.4)" : "1px solid var(--border)",
      background: "rgba(255,255,255,0.02)",
      display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      {kit.popular && (
        <div style={{
          position: "absolute", top: 14, right: 14, zIndex: 1,
          fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
          textTransform: "uppercase", padding: "3px 10px", borderRadius: 999,
          background: "var(--accent)", color: "#000",
        }}>Popular</div>
      )}

      {/* Image */}
      <div style={{
        background: "rgba(255,255,255,0.04)", padding: 32,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: "1px solid var(--border)", height: 200,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={kit.img} alt={kit.name} style={{ maxHeight: 140, maxWidth: "100%", objectFit: "contain" }} />
      </div>

      {/* Info */}
      <div style={{ padding: "20px 20px 0", flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{kit.name}</div>
        <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 10 }}>{kit.subtitle}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 16 }}>{kit.description}</div>

        {/* Includes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
          {kit.includes.map(item => (
            <div key={item} style={{ fontSize: 12, color: "var(--muted)", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ color: "#22d3a3", fontWeight: 700, fontSize: 10 }}>✓</span> {item}
            </div>
          ))}
        </div>

        {/* Pre-built toggle */}
        <div
          onClick={() => setBuilt(v => !v)}
          style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "12px", borderRadius: 10, marginBottom: 16, cursor: "pointer",
            border: built ? "1px solid rgba(14,165,233,0.5)" : "1px solid var(--border)",
            background: built ? "rgba(14,165,233,0.08)" : "rgba(255,255,255,0.02)",
            transition: "all 0.15s",
          }}
        >
          <div style={{
            width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
            border: built ? "2px solid #0ea5e9" : "2px solid rgba(255,255,255,0.25)",
            background: built ? "#0ea5e9" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}>
            {built && (
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              Pre-built &amp; Pre-flashed
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999,
                background: "rgba(14,165,233,0.15)", color: "var(--accent)", border: "1px solid rgba(14,165,233,0.3)",
              }}>+$25</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
              Assembled and pre-loaded. Plug in, connect WiFi, done.
            </div>
          </div>
        </div>
      </div>

      {/* Buy */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>${price}</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>+ shipping</span>
        </div>
        <button
          onClick={handleOrder}
          disabled={loading}
          style={{
            display: "block", width: "100%", padding: "12px",
            borderRadius: 10, border: "none",
            background: loading ? "rgba(14,165,233,0.5)" : "#0ea5e9",
            color: "#fff", fontSize: 14, fontWeight: 800,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Loading..." : "Buy Now →"}
        </button>
        {error && <div style={{ fontSize: 11, color: "#f87171", marginTop: 6, textAlign: "center" }}>{error}</div>}
      </div>
    </div>
  );
}

function PartCard({ part }: { part: typeof PARTS[0] }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: part.tier }),
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
      setLoading(false);
    }
  };

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.04)", padding: 24,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: "1px solid var(--border)", height: 160,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={part.img} alt={part.name} style={{ maxHeight: 110, maxWidth: "100%", objectFit: "contain" }} />
      </div>
      <div style={{ padding: "16px 16px 0", flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{part.name}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>{part.description}</div>
      </div>
      <div style={{ padding: "12px 16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>${part.price}</span>
        <button
          onClick={handleOrder}
          disabled={loading}
          style={{
            padding: "8px 16px", borderRadius: 8,
            border: "1px solid rgba(14,165,233,0.3)",
            background: "rgba(14,165,233,0.1)",
            color: "var(--accent)", fontSize: 13, fontWeight: 700,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "..." : "Buy →"}
        </button>
      </div>
    </div>
  );
}

export default function GroundStationKitPage() {
  return (
    <main className="page">
      <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 40, display: "flex", gap: 6, alignItems: "center" }}>
          <Link href="/groundstationdevices" style={{ color: "var(--muted)", textDecoration: "none" }}>Hardware Guide</Link>
          <span>›</span>
          <span style={{ color: "var(--text)" }}>Ground Station Hardware</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: "inline-block", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase", padding: "3px 12px", borderRadius: 999, marginBottom: 14,
            background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)",
            color: "var(--accent)",
          }}>
            FinalPing Official Store
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            Ground Station Hardware
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.8, maxWidth: 560, margin: 0 }}>
            Everything you need for a local ADS-B receiver. All parts sourced, tested, and ready to run with FinalPing.
          </p>
        </div>

        {/* Kits */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Complete Kits</h2>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>2 products</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {KITS.map(kit => <KitCard key={kit.id} kit={kit} />)}
          </div>
        </div>

        {/* Individual Parts */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Individual Parts</h2>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>3 products</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 20px" }}>
            Already have some of the hardware? Pick up just what you need.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {PARTS.map(part => <PartCard key={part.id} part={part} />)}
          </div>
        </div>

        {/* Bottom note */}
        <div style={{
          marginTop: 56, padding: "20px 24px", borderRadius: 14,
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap" as const, gap: 16,
        }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            All orders ship within 3–5 business days. Shipping calculated at checkout.
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/groundstationsetup" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>Setup guide →</Link>
            <Link href="/groundstationdevices" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>Hardware guide →</Link>
          </div>
        </div>

      </div>
    </main>
  );
}
