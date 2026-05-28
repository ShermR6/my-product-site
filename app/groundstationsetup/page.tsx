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

  const success = (text: string) => (
    <div style={{
      padding: "12px 16px", borderRadius: 10, margin: "12px 0",
      background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
      fontSize: 13, color: "#86efac", lineHeight: 1.7,
    }}>
      ✓ {text}
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
            Your location and tracked aircraft are pulled automatically from your FinalPing account — no manual configuration needed.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
            <Link href="/groundstationdevices" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 999,
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
              color: "var(--muted)", fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              🛒 Buy a receiver →
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

        {/* Before you start */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "20px 24px", marginBottom: 48,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>Before you start</div>
            {[
              "Active FinalPing account with Ground Station add-on",
              "Aircraft and location set up in the FinalPing app",
              "FlightAware Pro Stick Plus + 1090MHz antenna",
            ].map(i => (
              <div key={i} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4, display: "flex", gap: 8 }}>
                <span style={{ color: "#22d3a3" }}>✓</span> {i}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>What happens automatically</div>
            {[
              "Pulls your location from your account",
              "Pulls your tracked aircraft from your account",
              "Sends alerts through your existing notification channels",
              "Starts automatically on every boot or login",
            ].map(i => (
              <div key={i} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4, display: "flex", gap: 8 }}>
                <span style={{ color: "#22d3a3" }}>✓</span> {i}
              </div>
            ))}
          </div>
        </div>

        {/* ── Pre-built Pi Kit ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 40, paddingBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 999, marginBottom: 20,
            background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.3)",
            fontSize: 13, fontWeight: 700, color: "var(--accent)",
          }}>
            📦 Raspberry Pi Kit (Pre-flashed)
          </div>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 20px" }}>
            Your kit arrives with the SD card already flashed and ready. No terminal, no installer, no coding.
          </p>

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14, marginBottom: 20 }}>
            {[
              {
                step: "Screw the antenna onto the Pro Stick Plus, then plug the Pro Stick Plus into any USB port on the Raspberry Pi.",
              },
              {
                step: "Plug the power supply into the Pi. Wait about 60 seconds for it to fully boot.",
              },
              {
                step: "On your phone, open WiFi settings and connect to FinalPing-Setup. The password is: finalping",
              },
              {
                step: "A setup page will open automatically on your phone. If it doesn't open after 10 seconds, open a browser and go to 192.168.4.1",
              },
              {
                step: "Enter your home WiFi name and password, then your FinalPing account email and password. Tap Connect Ground Station.",
              },
              {
                step: "The Pi reboots, connects to your home WiFi, and starts tracking. Your location and aircraft are pulled from your FinalPing account automatically.",
              },
              {
                step: "Open the FinalPing desktop app. On the Dashboard you'll see Ground Station: Online with a green dot within about 60 seconds.",
              },
            ].map(({ step }, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "var(--accent)",
                }}>{i + 1}</div>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{step}</p>
              </div>
            ))}
          </div>

          {note("Use your phone — not a laptop or desktop. iPhones and Android phones open the setup page automatically when you join FinalPing-Setup. Laptops typically do not.")}
          {tip("Make sure your location and aircraft are already configured in the FinalPing app before running setup. The ground station reads them from your account.")}
          {success("That's it. Once setup is complete the Pi connects to your WiFi and runs silently in the background on every boot. No further configuration is needed.")}
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
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 20px" }}>
            The Windows installer handles everything — drivers, dump1090, Python, and auto-start. Your location and aircraft are pulled from your account automatically.
          </p>

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14, marginBottom: 20 }}>
            {[
              "Plug your Pro Stick Plus into any USB port on this PC.",
              "Right-click the Start menu → Windows PowerShell (Admin) or Terminal (Admin) and run:",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "#7dd3fc",
                }}>{i + 1}</div>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{step}</p>
              </div>
            ))}
          </div>

          {codeBlock(`irm https://finalpingapp.com/install.ps1 | iex`)}

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14, margin: "20px 0" }}>
            {[
              "The installer verifies your FinalPing account and Ground Station access.",
              "When Zadig opens, select your device (RTL2832U), choose WinUSB as the driver, and click Install Driver. Return to PowerShell when done.",
              "The installer finishes and sets up auto-start via Task Scheduler. Restart your PC.",
              "After reboot, FinalPing Ground Station starts silently in the background on every login. No windows open.",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "#7dd3fc",
                }}>{i + 3}</div>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{step}</p>
              </div>
            ))}
          </div>

          {note("The Zadig driver step is required the first time. If you skip it, dump1090 won't see the receiver. Run the installer again if needed.")}
          {success("After reboot, open the FinalPing desktop app. Dashboard → Ground Station: Online means everything is working.")}
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
            Plug your Pro Stick Plus in, then open Terminal and run:
          </p>
          {codeBlock(`curl -fsSL https://finalpingapp.com/install-mac.sh | bash`)}
          {note("If macOS blocks the RTL-SDR driver, go to System Settings → Privacy & Security → Allow Anyway.")}
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0 0" }}>
            The installer sets up Launch Agents so dump1090 and FinalPing Ground Station start automatically on every login.
          </p>
        </div>

        {/* After setup */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>After setup</h2>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {[
              { title: "Ground Station status", body: "Open the FinalPing desktop app. The Dashboard shows a Ground Station row with a green Online dot when your receiver is connected and running. If it shows Offline, check that your Pi or PC is powered on and connected to the internet." },
              { title: "Alerts", body: "Takeoff, approach (10nm, 5nm, 2nm), and landing alerts fire automatically through your existing FinalPing notification channels — Discord, Slack, SMS, email, or any integration you have configured. Nothing extra to set up." },
              { title: "Live Map", body: "Open the Live Map in the desktop app to see your aircraft in real time. The SDR reception range polygon (purple) shows the area your antenna can actually hear — it grows more accurate over time as more aircraft are received in different directions." },
              { title: "Changing aircraft or location", body: "Update your aircraft or airport location in the FinalPing app. The ground station re-fetches your config from your account every hour automatically." },
              { title: "Finding your ICAO24 code", body: "Search your tail number at globe.adsbexchange.com — the ICAO24 hex code appears in the aircraft detail panel. Enter it in the FinalPing app under Aircraft." },
            ].map((item, i, arr) => (
              <div key={item.title} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "16px 20px",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "24px 28px", marginBottom: 48,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>Troubleshooting</h2>
          {[
            {
              q: "Ground Station shows Offline in the app",
              a: "Check that your Pi or PC is powered on and connected to the internet. On the Pi, SSH in and run: sudo systemctl status finalping-ground — look for any errors. On Windows, check Task Scheduler for the FinalPingGroundStation task.",
            },
            {
              q: "\"Cannot reach dump1090\" in the logs",
              a: "dump1090 is not running or the receiver isn't detected. On the Pi: sudo systemctl status finalping-dump1090. On Windows: check that dump1090.exe is running in Task Manager. Make sure the Pro Stick Plus is plugged in.",
            },
            {
              q: "\"Ground station not enabled\"",
              a: "Your account doesn't have the Ground Station add-on. Purchase it at finalpingapp.com/pricing, then re-run setup.",
            },
            {
              q: "\"Login failed\" in the logs",
              a: "Your FinalPing email or password is wrong. On Pi: nano /home/pi/finalping-ground/finalping_ground.py and correct FINALPING_EMAIL and FINALPING_PASSWORD. On Windows: run the installer again.",
            },
            {
              q: "No aircraft are appearing in the live map",
              a: "Make sure your antenna is connected and pointing skyward. Indoor antennas near windows work but outdoor antennas give much better range. Also confirm your aircraft have ICAO24 codes entered in the FinalPing app.",
            },
            {
              q: "Pi won't connect to my WiFi after setup",
              a: "The SSID or password entered during setup may have been wrong. Reset the Pi to setup mode by SSHing in while on FinalPing-Setup WiFi and running: sudo rm /etc/finalping/.setup_done && sudo rm -f /etc/NetworkManager/system-connections/FinalPing-Home.nmconnection && sudo reboot — then go through setup again on your phone.",
            },
            {
              q: "Windows — no signals received",
              a: "The Zadig driver step is required. Open Zadig (zadig.akeo.ie), go to Options → List All Devices, select RTL2832U, choose WinUSB, and click Install Driver. Then restart your PC.",
            },
            {
              q: "Mac — driver blocked by macOS",
              a: "Go to System Settings → Privacy & Security → scroll down and click Allow Anyway next to the RTL-SDR driver entry. Then restart.",
            },
          ].map((item, i, arr) => (
            <div key={item.q} style={{
              marginBottom: i < arr.length - 1 ? 16 : 0,
              paddingBottom: i < arr.length - 1 ? 16 : 0,
              borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{item.q}</div>
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
          <Link href="/groundstationkit" style={{
            padding: "11px 24px", borderRadius: 999,
            background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
            color: "var(--text)", fontSize: 14, fontWeight: 600, textDecoration: "none",
          }}>
            📦 Buy a Pi Kit
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
