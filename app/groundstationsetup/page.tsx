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

  const stepList = (steps: string[], color: string) => (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 14, margin: "20px 0" }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
            background: `${color}18`, border: `1px solid ${color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color,
          }}>{i + 1}</div>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{step}</p>
        </div>
      ))}
    </div>
  );

  const sectionTag = (label: string, bg: string, border: string, color: string) => (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "6px 14px", borderRadius: 999, marginBottom: 20,
      background: bg, border: `1px solid ${border}`,
      fontSize: 13, fontWeight: 700, color,
    }}>
      {label}
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
          <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 10px" }}>
            Pick your setup type below. Your location and tracked aircraft are always pulled automatically from your FinalPing account — no manual config needed.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginTop: 24 }}>
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
            <div style={{ fontSize: 13, color: "#fcd34d", marginTop: 10, display: "flex", gap: 8 }}>
              <span>💡</span> Place the antenna near a window for best range — the Pi can sit anywhere nearby.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>What happens automatically</div>
            {[
              "Pulls your location from your account",
              "Pulls your tracked aircraft from your account",
              "Sends alerts through your notification channels",
              "Starts on every boot or login",
            ].map(i => (
              <div key={i} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4, display: "flex", gap: 8 }}>
                <span style={{ color: "#22d3a3" }}>✓</span> {i}
              </div>
            ))}
          </div>
        </div>

        {/* ── Pre-flashed Pi Kit ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 40, paddingBottom: 40 }}>
          {sectionTag("📦 Raspberry Pi Kit — Pre-flashed", "rgba(14,165,233,0.1)", "rgba(14,165,233,0.3)", "var(--accent)")}
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 8px" }}>
            Your kit arrives with the SD card already flashed. No computer setup needed — just plug in and go through setup on your phone.
          </p>
          {stepList([
            "Screw the antenna onto the Pro Stick Plus and plug it into any USB port on the Pi.",
            "Plug the power supply into the Pi and wait about 60 seconds for it to fully boot.",
            "On your phone, open WiFi settings and connect to FinalPing-Setup. No password — it's an open network.",
            "A setup page opens automatically on your phone. If it doesn't appear after 10 seconds, open a browser and go to 192.168.4.1",
            "Enter your home WiFi name, WiFi password, and your FinalPing account email. Tap Save & Connect.",
            "The Pi connects to your home WiFi and automatically claims your account credentials from FinalPing. Your location and aircraft are pulled from your account — no manual config needed.",
            "The Pi reboots and starts tracking. Open the FinalPing desktop app — Dashboard → Ground Station: Online within 60 seconds.",
          ], "#0ea5e9")}
          {note("Use your phone — not a laptop or desktop. iPhones and Android phones open the setup page automatically when joining FinalPing-Setup. Laptops typically do not.")}
          {success("That's it. The Pi runs silently in the background on every boot. No further setup needed.")}
        </div>

        {/* ── DIY Pi Kit ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 40, paddingBottom: 40 }}>
          {sectionTag("🍓 Raspberry Pi Kit — Self-Setup (No Pre-flash)", "rgba(34,211,163,0.08)", "rgba(34,211,163,0.25)", "#22d3a3")}
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 8px" }}>
            If your kit did not come pre-flashed, you'll need to image the SD card yourself. You'll need a Windows PC or Mac, your microSD card, and a card reader.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "24px 0 8px" }}>Step 1 — Flash the SD card</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 8px" }}>
            Download and install <strong style={{ color: "var(--text)" }}>Raspberry Pi Imager</strong> from <a href="https://www.raspberrypi.com/software/" target="_blank" style={{ color: "var(--accent)" }}>raspberrypi.com/software</a>. Insert your microSD card, then open the Imager and configure:
          </p>
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "16px 20px", margin: "12px 0",
          }}>
            {[
              { label: "Device", value: "Raspberry Pi (any model you have)" },
              { label: "Operating System", value: "Raspberry Pi OS Lite (32-bit)" },
              { label: "Storage", value: "Your microSD card" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", gap: 16, marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: "var(--accent)", fontWeight: 700, minWidth: 160 }}>{row.label}</span>
                <span style={{ color: "var(--muted)" }}>{row.value}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0 8px" }}>
            Click <strong style={{ color: "var(--text)" }}>Edit Settings</strong> (the gear icon) and fill in the OS Customisation panel:
          </p>
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "16px 20px", margin: "12px 0",
          }}>
            {[
              { label: "Hostname", value: "raspberrypi (or anything you want)" },
              { label: "Username", value: "pi (recommended)" },
              { label: "Password", value: "Set a password — you'll need it to SSH in" },
              { label: "WiFi SSID", value: "Your home WiFi name" },
              { label: "WiFi Password", value: "Your home WiFi password" },
              { label: "Enable SSH", value: "Yes — tick this" },
              { label: "Pi Connect", value: "Leave this off" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", gap: 16, marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: "#22d3a3", fontWeight: 700, minWidth: 160 }}>{row.label}</span>
                <span style={{ color: "var(--muted)" }}>{row.value}</span>
              </div>
            ))}
          </div>
          {tip("The WiFi credentials you enter here are so the Pi connects to your home network temporarily, which lets you SSH in to run the installer. The installer will wipe this at the end, and you'll enter your WiFi again on your phone during the FinalPing setup step.")}
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0" }}>
            Click <strong style={{ color: "var(--text)" }}>Save → Write → Yes</strong> to flash. When done, eject the card and insert it into your Pi.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "28px 0 8px" }}>Step 2 — Run the FinalPing installer</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            Plug your Pro Stick Plus into the Pi, then power it on. Wait about 60 seconds for it to boot and connect to your WiFi.
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 8px" }}>
            Next, find the Pi's IP address. Use whichever method works for your router:
          </p>
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "16px 20px", margin: "12px 0",
            display: "flex", flexDirection: "column" as const, gap: 12,
          }}>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              <span style={{ color: "#22d3a3", fontWeight: 700 }}>Router app</span> — If your router has an app (Eero, Google Home, Orbi, Netgear, etc.) open it and look at the connected devices list. Find the device named <strong style={{ color: "var(--text)" }}>raspberrypi</strong> and note its IP address.
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              <span style={{ color: "#22d3a3", fontWeight: 700 }}>Router admin page</span> — Check the sticker on the back or bottom of your router for the admin login address and credentials. Open that address in a browser, log in, and find the connected devices list. Look for <strong style={{ color: "var(--text)" }}>raspberrypi</strong> and note its IP.
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              <span style={{ color: "#22d3a3", fontWeight: 700 }}>Windows (find your router address)</span> — Open PowerShell and run <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>ipconfig</code> — look for <strong style={{ color: "var(--text)" }}>Default Gateway</strong>. Type that address into a browser to open your router admin page, then find raspberrypi in the connected devices list.
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            Then open PowerShell (Windows) or Terminal (Mac) and SSH in using that IP address:
          </p>
          {codeBlock(`ssh pi@192.168.1.45`)}
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "8px 0 12px" }}>
            Replace <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>192.168.1.45</code> with the actual IP from your router. It will ask for the password you set in the Imager — nothing appears as you type, that is normal.
          </p>
          {note("If you get a warning about a changed host key (REMOTE HOST IDENTIFICATION HAS CHANGED), run this first to clear it — then SSH in again:\n\nssh-keygen -R <ip-address>")}
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0" }}>
            Enter your password when prompted. Nothing will appear as you type — that's normal. Once you're in, run the FinalPing installer:
          </p>
          {codeBlock(`curl -fsSL https://finalpingapp.com/setup-portal.sh | sudo bash`)}
          {tip("The installer compiles dump1090 from source — this takes around 10–15 minutes. You'll see a lot of compiler output. That's normal. Let it finish.")}
          {success("When you see \"Kit preparation complete!\" the installer is done. The Pi will reboot automatically.")}

          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "28px 0 8px" }}>Step 3 — Activate on your phone</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            After the Pi reboots it broadcasts a setup WiFi network. On your phone:
          </p>
          {stepList([
            "Open WiFi settings and connect to FinalPing-Setup. No password — it's an open network.",
            "A setup page opens automatically. If it doesn't, open a browser and go to 192.168.4.1",
            "Enter your home WiFi name, WiFi password, and your FinalPing account email. Tap Save & Connect.",
            "The Pi connects to your WiFi and automatically claims your account credentials from FinalPing. It reboots and starts tracking. Open the FinalPing desktop app — Dashboard → Ground Station: Online.",
          ], "#22d3a3")}
          {note("Use your phone for this step — not your laptop. Phones auto-open the setup page when joining FinalPing-Setup. Laptops do not.")}

          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "28px 0 8px" }}>Optional — Contribute to the adsb.lol network</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            Your Pi can anonymously feed ADS-B data to <a href="https://adsb.lol" target="_blank" style={{ color: "var(--accent)" }}>adsb.lol</a>, a community-run network that improves coverage for all FinalPing users in your area. It runs alongside FinalPing and won't interfere with anything.
          </p>
          {codeBlock(`curl -L -o /tmp/lol-feed.sh https://adsb.lol/feed.sh\nsudo bash /tmp/lol-feed.sh`)}
          {tip("Use your receiver's physical location coordinates, not necessarily your airport. When done, check adsb.lol to confirm you're showing as a feeder.")}
        </div>

        {/* ── Windows ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 40, paddingBottom: 40 }}>
          {sectionTag("🪟 Windows PC", "rgba(14,165,233,0.1)", "rgba(14,165,233,0.25)", "#7dd3fc")}
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            Run the ground station directly on your Windows PC with the Pro Stick Plus plugged in. No Pi required.
          </p>
          {stepList([
            "Plug your Pro Stick Plus into any USB port on this PC.",
            "Right-click Start → Windows PowerShell (Admin) or Terminal (Admin) and run the installer:",
          ], "#7dd3fc")}
          {codeBlock(`irm https://finalpingapp.com/install.ps1 | iex`)}
          {stepList([
            "The installer verifies your FinalPing account and Ground Station access.",
            "When Zadig opens: Options → List All Devices → select RTL2832U → choose WinUSB → click Install Driver. Return to PowerShell when done.",
            "The installer sets up auto-start via Task Scheduler. Restart your PC.",
            "After reboot FinalPing Ground Station starts silently in the background on every login. Open the FinalPing app — Dashboard → Ground Station: Online.",
          ].map((s, i) => `${s}`), "#7dd3fc")}
          {note("The Zadig driver step is required the first time. If you skip it, dump1090 won't see the receiver.")}
        </div>

        {/* ── Mac ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 40, paddingBottom: 40 }}>
          {sectionTag("🍎 macOS", "rgba(167,139,250,0.1)", "rgba(167,139,250,0.25)", "#c4b5fd")}
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            Run the ground station directly on your Mac with the Pro Stick Plus plugged in. No Pi required.
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
              { title: "Alerts", body: "Takeoff, approach (10nm, 5nm, 2nm), and landing alerts fire automatically through your FinalPing notification channels — Discord, Slack, SMS, email, or any integration you have set up. Nothing extra to configure." },
              { title: "Live Map", body: "The Live Map in the FinalPing desktop app shows your aircraft in real time. The purple SDR range polygon shows the area your antenna can actually hear — it builds out over time as more aircraft are received in different directions." },
              { title: "Changing aircraft or location", body: "Update aircraft or location in the FinalPing app. The ground station re-fetches your config from your account every hour automatically." },
              { title: "Finding your ICAO24 code", body: "Search your tail number at globe.adsbexchange.com — the ICAO24 hex code appears in the aircraft detail panel. Enter it in the FinalPing app under Aircraft." },
            ].map(item => (
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
            { q: "Ground Station shows Offline in the app", a: "Check that your Pi or PC is powered on and online. On the Pi, SSH in and run: sudo systemctl status finalping-ground — look for errors. On Windows, check Task Scheduler for the FinalPingGroundStation task." },
            { q: "SSH gives \"host key changed\" warning", a: "You previously connected to a different Pi at this IP address. Clear the old key (replace the IP with your Pi's actual IP) and try again:\n\nssh-keygen -R 192.168.1.45" },
            { q: "\"Cannot reach dump1090\" in the logs", a: "dump1090 is not running or the receiver isn't detected. On the Pi: sudo systemctl status finalping-dump1090. Make sure the Pro Stick Plus is plugged in." },
            { q: "\"Ground station not enabled\"", a: "Your account doesn't have the Ground Station add-on. Purchase it at finalpingapp.com/pricing." },
            { q: "\"Ground station not enabled\" or \"Invalid device key\"", a: "Your FinalPing account doesn't have Ground Station enabled, or the wrong email was entered during setup. To redo setup, delete the config and reboot — the Pi will broadcast FinalPing-Setup again:\n\nsudo rm /home/pi/finalping-ground/config.json && sudo reboot" },
            { q: "Pi won't connect to my WiFi after setup", a: "The SSID or password entered during phone setup may have been wrong. To redo setup, delete the config and reboot:\n\nsudo rm /home/pi/finalping-ground/config.json && sudo reboot\n\nThen connect to FinalPing-Setup again and re-enter your WiFi credentials and email." },
            { q: "No aircraft appearing", a: "Make sure your antenna is connected and pointing skyward. Indoor antennas near windows work but outdoor antennas give much better range. Confirm your aircraft have ICAO24 codes entered in the FinalPing app." },
            { q: "Windows — no signals received", a: "The Zadig driver step is required. Open Zadig (zadig.akeo.ie), go to Options → List All Devices, select RTL2832U, choose WinUSB, click Install Driver. Then restart your PC." },
            { q: "Mac — driver blocked by macOS", a: "Go to System Settings → Privacy & Security → scroll down and click Allow Anyway next to the RTL-SDR driver entry. Then restart." },
          ].map((item, i, arr) => (
            <div key={item.q} style={{
              marginBottom: i < arr.length - 1 ? 16 : 0,
              paddingBottom: i < arr.length - 1 ? 16 : 0,
              borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{item.q}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, whiteSpace: "pre-line" as const }}>{item.a}</div>
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
