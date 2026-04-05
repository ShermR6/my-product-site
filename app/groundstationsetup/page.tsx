// app/groundstationsetup/page.tsx
import Link from "next/link";

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

  const step = (num: number, title: string, content: React.ReactNode) => (
    <div style={{
      display: "grid", gridTemplateColumns: "48px 1fr", gap: 20,
      marginBottom: 40,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
        background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, fontWeight: 900, color: "var(--accent)",
      }}>
        {num}
      </div>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "10px 0 12px", color: "var(--text)" }}>{title}</h2>
        {content}
      </div>
    </div>
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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 10 }}>
            📖 SETUP GUIDE
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 14px" }}>
            FinalPing Ground Station Setup
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 24px" }}>
            Complete guide to setting up your ADS-B receiver and connecting it to FinalPing.
            Covers Raspberry Pi, Windows, Mac, and Linux.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>You&apos;ll need</div>
            {["ADS-B receiver dongle (RTL-SDR, FlightAware, etc.)", "1090MHz antenna (usually included)", "Raspberry Pi, Windows, Mac, or Linux computer", "FinalPing account with Ground Station add-on", "Python 3 installed"].map(i => (
              <div key={i} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4, display: "flex", gap: 8 }}>
                <span style={{ color: "#22d3a3" }}>✓</span> {i}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>Estimated time</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
              Raspberry Pi setup: ~20 minutes<br />
              Windows setup: ~10 minutes<br />
              Mac setup: ~10 minutes<br />
              Linux setup: ~5 minutes
            </div>
          </div>
        </div>

        {/* ── SECTION 1: Raspberry Pi ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 48, paddingBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 999, marginBottom: 28,
            background: "rgba(34,211,163,0.1)", border: "1px solid rgba(34,211,163,0.25)",
            fontSize: 13, fontWeight: 700, color: "#22d3a3",
          }}>
            🍓 Raspberry Pi Setup
          </div>

          <div style={{
            background: "rgba(34,211,163,0.06)", border: "1px solid rgba(34,211,163,0.2)",
            borderRadius: 12, padding: "16px 20px", marginBottom: 32,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#22d3a3", marginBottom: 8 }}>⚡ One-command install</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>Run this in your Pi terminal — it installs everything and walks you through setup:</div>
            {codeBlock(`curl -fsSL https://finalpingapp.com/install.sh | bash`)}</div>

          {step(1, "Install PiAware on your Raspberry Pi", <>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
              PiAware is FlightAware&apos;s free software that turns your Pi into an ADS-B receiver. It includes dump1090 which FinalPing reads from.
            </p>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
              Download the PiAware SD card image from FlightAware and flash it to your SD card using Raspberry Pi Imager or Balena Etcher:
            </p>
            {codeBlock(`# Download Raspberry Pi Imager from:
# https://www.raspberrypi.com/software/

# Then flash the PiAware image from:
# https://flightaware.com/adsb/piaware/build`)}
            {tip("The FlightAware Pro Stick Plus comes with a pre-loaded microSD card — just insert it and skip flashing entirely.")}
          </>)}

          {step(2, "Connect your receiver and boot up", <>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
              Plug your ADS-B receiver dongle into a USB port on the Pi, attach the antenna, then insert the SD card and power on.
            </p>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
              After about 60 seconds, dump1090 will be running and accessible at:
            </p>
            {codeBlock(`http://[your-pi-ip]:8080/data/aircraft.json`)}
            {tip("Find your Pi's IP address by checking your router's connected devices page, or connecting a keyboard and monitor and running: hostname -I")}
          </>)}

          {step(3, "Verify the receiver is working", <>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
              Open a browser on any device on your network and go to:
            </p>
            {codeBlock(`http://[your-pi-ip]:8080`)}
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0" }}>
              You should see a radar map with aircraft. If you see aircraft you&apos;re good to go. If not, make sure the antenna is connected and you&apos;re in an area with air traffic.
            </p>
          </>)}

          {step(4, "Download and configure FinalPing Ground Station", <>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
              Download <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>finalping_ground.py</code> and copy it to your Pi. Then install the dependency:
            </p>
            {codeBlock(`pip3 install requests`)}
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0" }}>
              Open the file and fill in your details at the top:
            </p>
            {codeBlock(`FINALPING_EMAIL    = "your@email.com"
FINALPING_PASSWORD = "yourpassword"
DUMP1090_URL       = "http://localhost:8080/data/aircraft.json"
MY_LAT             = 33.2001   # Your latitude
MY_LON             = -97.1998  # Your longitude
MY_ELEVATION_FT    = 641       # Your elevation in feet

TRACKED_AIRCRAFT = [
    {"tail": "N12345", "icao24": "a1b2c3"},
]`)}
            {tip("Find your ICAO24 hex code by searching your tail number at globe.adsbexchange.com — it's shown in the aircraft info panel.")}
          </>)}

          {step(5, "Run it", <>
            {codeBlock(`python3 finalping_ground.py`)}
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0" }}>
              You should see:
            </p>
            {codeBlock(`2026-04-04 09:32:11 [INFO] Logging in as your@email.com...
2026-04-04 09:32:12 [INFO] ✅ Logged in — pro license
2026-04-04 09:32:12 [INFO] ✅ Ground station access confirmed
2026-04-04 09:32:17 [INFO] Polling receiver...`)}
          </>)}

          {step(6, "Auto-start on boot (optional)", <>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
              To have FinalPing Ground Station start automatically when the Pi powers on:
            </p>
            {codeBlock(`# Copy the service file
sudo cp finalping-ground.service /etc/systemd/system/

# Enable and start it
sudo systemctl daemon-reload
sudo systemctl enable finalping-ground
sudo systemctl start finalping-ground

# Check it's running
sudo journalctl -u finalping-ground -f`)}
            {note("Edit the service file first and update the path to where you put finalping_ground.py on your Pi.")}
          </>)}
        </div>

        {/* ── SECTION 2: Windows ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 48, paddingBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 999, marginBottom: 28,
            background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)",
            fontSize: 13, fontWeight: 700, color: "#7dd3fc",
          }}>
            🪟 Windows Setup
          </div>

          <div style={{
            background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)",
            borderRadius: 12, padding: "16px 20px", marginBottom: 32,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#7dd3fc", marginBottom: 8 }}>⚡ One-command install</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>Run this in PowerShell as Administrator (right-click PowerShell → Run as Administrator):</div>
            {codeBlock(`irm https://finalpingapp.com/install.ps1 | iex`)}
          </div>

          {step(1, "Install dump1090 for Windows", <>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
              Download and install <strong style={{ color: "var(--text)" }}>dump1090-win</strong> — a Windows port of the standard dump1090 software:
            </p>
            {codeBlock(`# Download from:
# https://github.com/MalcolmRobb/dump1090/releases

# Or use RTL-SDR Blog's Windows driver package:
# https://www.rtl-sdr.com/rtl-sdr-quick-start-guide/`)}
            {note("If using the RTL-SDR Blog V4, you must install their custom driver first. Follow the instructions included with the dongle carefully.")}
          </>)}

          {step(2, "Install the RTL-SDR driver", <>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
              Plug in your receiver, then run Zadig to install the WinUSB driver:
            </p>
            {codeBlock(`# Download Zadig from: https://zadig.akeo.ie
# 1. Open Zadig
# 2. Options → List All Devices
# 3. Select your RTL-SDR device
# 4. Choose WinUSB
# 5. Click Install Driver`)}
          </>)}

          {step(3, "Start dump1090", <>
            {codeBlock(`# In Command Prompt or PowerShell:
dump1090.exe --net --net-ro-port 30002`)}
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0" }}>
              Then open a browser to verify it&apos;s working:
            </p>
            {codeBlock(`http://localhost:8080`)}
          </>)}

          {step(4, "Install Python and run FinalPing Ground Station", <>
            {codeBlock(`# Install Python from https://python.org
# Then install the dependency:
pip install requests

# Fill in your credentials in finalping_ground.py, then:
python finalping_ground.py`)}
          </>)}
        </div>

        {/* ── SECTION 3: Mac ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 48, paddingBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 999, marginBottom: 28,
            background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)",
            fontSize: 13, fontWeight: 700, color: "#c4b5fd",
          }}>
            🍎 macOS Setup
          </div>

          <div style={{
            background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)",
            borderRadius: 12, padding: "16px 20px", marginBottom: 32,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd", marginBottom: 8 }}>⚡ One-command install</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>Run this in Terminal — it installs everything and walks you through setup:</div>
            {codeBlock(`curl -fsSL https://finalpingapp.com/install-mac.sh | bash`)}</div>

          {step(1, "Install Homebrew and dump1090", <>
            {codeBlock(`# Install Homebrew if you don't have it:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dump1090:
brew install dump1090-mutability`)}
          </>)}

          {step(2, "Install the RTL-SDR driver", <>
            {codeBlock(`brew install librtlsdr`)}
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0" }}>
              Plug in your receiver. If macOS blocks the driver, go to System Settings → Privacy & Security → allow it.
            </p>
            {note("Apple Silicon (M1/M2/M3) Macs may need Rosetta for some RTL-SDR tools. Run: softwareupdate --install-rosetta")}
          </>)}

          {step(3, "Start dump1090", <>
            {codeBlock(`dump1090 --interactive --net`)}
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0" }}>
              Verify it&apos;s working by opening:
            </p>
            {codeBlock(`http://localhost:8080`)}
          </>)}

          {step(4, "Run FinalPing Ground Station", <>
            {codeBlock(`pip3 install requests
python3 finalping_ground.py`)}
          </>)}
        </div>

        {/* ── SECTION 4: Linux ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 999, marginBottom: 28,
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
            fontSize: 13, fontWeight: 700, color: "#fcd34d",
          }}>
            🐧 Linux Setup
          </div>

          {step(1, "Install dump1090 and RTL-SDR", <>
            {codeBlock(`# Ubuntu/Debian:
sudo apt update
sudo apt install dump1090-mutability rtl-sdr

# Fedora/RHEL:
sudo dnf install rtl-sdr dump1090`)}
          </>)}

          {step(2, "Blacklist the default DVB-T driver", <>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
              Linux loads a DVB-T driver by default that conflicts with RTL-SDR. Blacklist it:
            </p>
            {codeBlock(`echo 'blacklist dvb_usb_rtl28xxu' | sudo tee /etc/modprobe.d/rtlsdr.conf
sudo modprobe -r dvb_usb_rtl28xxu`)}
          </>)}

          {step(3, "Start dump1090 and run FinalPing", <>
            {codeBlock(`dump1090 --net &

pip3 install requests
python3 finalping_ground.py`)}
            {tip("On Linux you can create a systemd service exactly like the Raspberry Pi section above to auto-start both dump1090 and FinalPing on boot.")}
          </>)}
        </div>

        {/* Troubleshooting */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "24px 28px", marginBottom: 48,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>Troubleshooting</h2>
          {[
            { q: "\"Cannot reach dump1090\"", a: "Make sure dump1090 is running and check the URL in finalping_ground.py. If the receiver is on a different device, use its IP address instead of localhost." },
            { q: "\"Ground station not enabled\"", a: "Your account doesn't have the Ground Station add-on. Purchase it at finalpingapp.com/pricing." },
            { q: "\"Login failed\"", a: "Check your email and password in finalping_ground.py. Make sure you're using your FinalPing website credentials, not a license key." },
            { q: "No aircraft showing up", a: "Make sure your antenna is connected and you have line of sight to the sky. Indoor antennas near windows work but outdoor antennas give much better range." },
            { q: "Script stops after a few hours", a: "Add the ground station as a systemd service (Raspberry Pi/Linux) or use Task Scheduler (Windows) to auto-restart if it stops." },
          ].map((item) => (
            <div key={item.q} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4, fontFamily: "monospace" }}>{item.q}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{item.a}</div>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
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
