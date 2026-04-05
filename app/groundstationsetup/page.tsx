// app/groundstationsetup/page.tsx
import Link from "next/link";
import React from "react";

export default function GroundStationSetupPage() {
  const codeBlock = (code: string) => (
    <pre style={{
      background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10, padding: "16px 20px", overflow: "auto",
      fontSize: 13, lineHeight: 1.7, color: "#e2e8f0",
      fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      margin: "12px 0",
    }}>
      <code>{code}</code>
    </pre>
  );

  const note = (text: string) => (
    <div style={{
      padding: "12px 16px", borderRadius: 10, margin: "12px 0",
      background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
      fontSize: 13, color: "#fcd34d", lineHeight: 1.7,
    }}>
      ⚠️ {text}
    </div>
  );

  const tip = (text: string) => (
    <div style={{
      padding: "12px 16px", borderRadius: 10, margin: "12px 0",
      background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)",
      fontSize: 13, color: "#7dd3fc", lineHeight: 1.7,
    }}>
      💡 {text}
    </div>
  );

  return (
    <main className="page">
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 52 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--accent)", marginBottom: 10 }}>
            📖 SETUP GUIDE
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 14px" }}>
            FinalPing Ground Station Setup
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 24px" }}>
            One command installs everything. Pick your platform below.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
            <Link href="/groundstationdevices" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 999,
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
              color: "var(--muted)", fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              🛒 Buy a receiver first →
            </Link>
            <Link href="/pricing" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 999,
              background: "var(--accent)", color: "#fff",
              fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              Buy Ground Station →
            </Link>
          </div>
        </div>

        {/* What you need */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "20px 24px", marginBottom: 48,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>Before you start</div>
            {[
              "ADS-B receiver dongle + 1090MHz antenna",
              "Raspberry Pi, Windows PC, or Mac",
              "Active FinalPing account",
              "FinalPing Ground Station add-on purchased",
            ].map(i => (
              <div key={i} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4, display: "flex", gap: 8 }}>
                <span style={{ color: "#22d3a3" }}>✓</span> {i}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>What the installer does</div>
            {[
              "Installs RTL-SDR drivers",
              "Installs dump1090 (ADS-B decoder)",
              "Downloads FinalPing Ground Station",
              "Walks you through configuration",
              "Sets up auto-start on boot/login",
            ].map(i => (
              <div key={i} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4, display: "flex", gap: 8 }}>
                <span style={{ color: "#22d3a3" }}>✓</span> {i}
              </div>
            ))}
          </div>
        </div>

        {/* ── Raspberry Pi ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 40, paddingBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 999, marginBottom: 20,
            background: "rgba(34,211,163,0.1)", border: "1px solid rgba(34,211,163,0.25)",
            fontSize: 13, fontWeight: 700, color: "#22d3a3",
          }}>
            🍓 Raspberry Pi
          </div>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            Open a terminal on your Pi (or SSH in) and run:
          </p>
          {codeBlock(`curl -fsSL https://finalpingapp.com/install.sh | sudo bash`)}
          {tip("The installer will pause for 5 seconds before starting — press Ctrl+C to cancel if needed.")}
          {note("If you get a 'password' prompt, type your Pi's password and press Enter. Nothing will appear as you type — that's normal.")}
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0 0" }}>
            The installer will ask for your FinalPing email, password, location coordinates, and aircraft tail numbers/ICAO24 codes. Once done, FinalPing Ground Station starts automatically and runs on every boot.
          </p>
        </div>

        {/* ── Windows ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 40, paddingBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 999, marginBottom: 20,
            background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)",
            fontSize: 13, fontWeight: 700, color: "#7dd3fc",
          }}>
            🪟 Windows
          </div>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            Right-click PowerShell → <strong style={{ color: "var(--text)" }}>Run as Administrator</strong>, then run:
          </p>
          {codeBlock(`irm https://finalpingapp.com/install.ps1 | iex`)}
          {note("Windows requires a manual driver step — the installer will open the Zadig download page automatically. Install the WinUSB driver for your RTL-SDR device, then restart your computer.")}
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0 0" }}>
            After restart, plug in your receiver and FinalPing Ground Station will start automatically on every login via Task Scheduler.
          </p>
        </div>

        {/* ── Mac ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 40, paddingBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 999, marginBottom: 20,
            background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)",
            fontSize: 13, fontWeight: 700, color: "#c4b5fd",
          }}>
            🍎 macOS
          </div>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            Open Terminal and run:
          </p>
          {codeBlock(`curl -fsSL https://finalpingapp.com/install-mac.sh | bash`)}
          {note("If macOS blocks the RTL-SDR driver, go to System Settings → Privacy & Security → Allow Anyway.")}
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0 0" }}>
            The installer sets up Launch Agents so both dump1090 and FinalPing Ground Station start automatically on login.
          </p>
        </div>

        {/* After install */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>After installation</h2>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            Once installed, alerts fire through your existing FinalPing notification channels (Discord, Slack, email, SMS, etc.) and appear in your alert history at <a href="https://finalpingapp.com/dashboard" style={{ color: "var(--accent)" }}>finalpingapp.com/dashboard</a>.
          </p>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 16px" }}>
            To add or change tracked aircraft after install, edit the config file:
          </p>
          {codeBlock(`# Raspberry Pi / Linux
nano ~/finalping-ground/finalping_ground.py

# Windows
notepad %USERPROFILE%\\finalping-ground\\finalping_ground.py

# Mac
open ~/finalping-ground/finalping_ground.py`)}
          {tip("Find your ICAO24 hex code by searching your tail number at globe.adsbexchange.com — it shows in the aircraft details panel.")}
        </div>

        {/* Troubleshooting */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "24px 28px", marginBottom: 48,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>Troubleshooting</h2>
          {[
            { q: "\"Cannot reach dump1090\"", a: "Make sure dump1090 is running. On Raspberry Pi run: sudo systemctl status dump1090-fa. If your receiver is on a different device, update DUMP1090_URL in finalping_ground.py to its IP address." },
            { q: "\"Ground station not enabled\"", a: "Your account doesn't have the Ground Station add-on. Purchase it at finalpingapp.com/pricing." },
            { q: "\"Login failed\"", a: "Check your email and password in finalping_ground.py. Make sure you're using your FinalPing website credentials." },
            { q: "No aircraft showing up in dump1090", a: "Make sure your antenna is connected and pointing skyward. Indoor antennas near windows work but outdoor antennas give much better range." },
            { q: "Windows — no signals received", a: "The Zadig driver step is required. Plug in your receiver, open Zadig, select your device, choose WinUSB, and click Install Driver. Then restart." },
            { q: "Mac — driver blocked by macOS", a: "Go to System Settings → Privacy & Security → scroll down and click Allow Anyway next to the RTL-SDR driver entry." },
          ].map((item, i, arr) => (
            <div key={item.q} style={{ marginBottom: i < arr.length - 1 ? 16 : 0, paddingBottom: i < arr.length - 1 ? 16 : 0, borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4, fontFamily: "monospace" }}>{item.q}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{item.a}</div>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
          <Link href="/groundstationdevices" style={{
            padding: "11px 24px", borderRadius: 999,
            background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
            color: "var(--text)", fontSize: 14, fontWeight: 600, textDecoration: "none",
          }}>
            🛒 Buy a Receiver
          </Link>
          <Link href="/pricing" style={{
            padding: "11px 24px", borderRadius: 999,
            background: "var(--accent)", color: "#fff",
            fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}>
            Buy Ground Station →
          </Link>
        </div>

      </div>
    </main>
  );
}
