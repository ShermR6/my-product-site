"use client";
import { Lightbulb, TriangleAlert } from "lucide-react";
// app/groundstationsetup/page.tsx
import Link from "next/link";
import React, { useState } from "react";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div style={{ position: "relative", margin: "12px 0" }}>
      <pre style={{
        background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10, padding: "16px 56px 16px 20px", overflow: "auto",
        fontSize: 13, lineHeight: 1.7, color: "var(--text-2)",
        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        margin: 0,
      }}>
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        style={{
          position: "absolute", top: 10, right: 10,
          background: copied ? "rgba(255,255,255,0.075)" : "rgba(255,255,255,0.07)",
          border: `1px solid ${copied ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 6, padding: "4px 10px",
          color: copied ? "var(--good)" : "var(--muted)",
          fontSize: 11, fontWeight: 600, cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function GroundStationSetupPage() {
  const codeBlock = (code: string) => <CodeBlock code={code} />;

  const note = (text: string) => (
    <div style={{
      padding: "12px 16px", borderRadius: 10, margin: "12px 0",
      background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
      fontSize: 13, color: "var(--warn)", lineHeight: 1.7,
    }}>
      <TriangleAlert size={14} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: 7 }} />{text}
    </div>
  );

  const tip = (text: string) => (
    <div style={{
      padding: "12px 16px", borderRadius: 10, margin: "12px 0",
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
      fontSize: 13, color: "var(--text)", lineHeight: 1.7,
    }}>
      <Lightbulb size={14} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: 7 }} />{text}
    </div>
  );

  const success = (text: string) => (
    <div style={{
      padding: "12px 16px", borderRadius: 10, margin: "12px 0",
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
      fontSize: 13, color: "var(--text)", lineHeight: 1.7,
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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text)", marginBottom: 10 }}>
            SETUP GUIDE
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 14px" }}>
            FinalPing Ground Station Setup
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 10px" }}>
            A Ground Station is a Raspberry Pi with an ADS-B radio at your field. Setting one up is one command, and your airport and aircraft come from your FinalPing account by themselves. It also feeds adsb.lol, and a receiver that keeps feeding earns the FinalPing plan for free.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginTop: 24 }}>
            <Link href="/groundstationdevices" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 999,
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
              color: "var(--muted)", fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              Buy a receiver →
            </Link>
            <Link href="/pricing" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 999,
              background: "var(--cta)", color: "var(--cta-text)",
              fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              See the plan →
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
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Before you start</div>
            {[
              "A FinalPing account. No plan needed to start: feeding earns one",
              "A Raspberry Pi on your Wi-Fi or network",
              "FlightAware Pro Stick Plus + 1090MHz antenna",
            ].map(i => (
              <div key={i} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4, display: "flex", gap: 8 }}>
                <span style={{ color: "var(--good)" }}>✓</span> {i}
              </div>
            ))}
            <div style={{ fontSize: 13, color: "var(--warn)", marginTop: 10, display: "flex", gap: 8 }}>
              <Lightbulb size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }} /> Place the antenna near a window for best range — the Pi can sit anywhere nearby.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>What happens automatically</div>
            {[
              "Pulls your airport and aircraft from your account",
              "Feeds adsb.lol, which earns the free plan",
              "Keeps its own software up to date",
              "Starts on every boot",
            ].map(i => (
              <div key={i} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4, display: "flex", gap: 8 }}>
                <span style={{ color: "var(--good)" }}>✓</span> {i}
              </div>
            ))}
          </div>
        </div>

        {/* ── Pre-flashed Pi Kit ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 40, paddingBottom: 40 }}>
          {sectionTag("Raspberry Pi Kit — Pre-flashed", "rgba(255,255,255,0.06)", "rgba(255,255,255,0.16)", "var(--text)")}
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
            "The Pi reboots and starts tracking. Open finalpingapp.com/app and go to Ground Station: it shows Online within 60 seconds.",
          ], "var(--text)")}
          {note("Use your phone — not a laptop or desktop. iPhones and Android phones open the setup page automatically when joining FinalPing-Setup. Laptops typically do not.")}
          {success("That's it. The Pi runs silently in the background on every boot. No further setup needed.")}
        </div>

        {/* ── DIY Pi Kit ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 40, paddingBottom: 40 }}>
          {sectionTag("Your own Raspberry Pi: one command", "rgba(255,255,255,0.06)", "rgba(255,255,255,0.16)", "var(--text)")}
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 8px" }}>
            For any Raspberry Pi with an ADS-B radio, and for kits that did not come pre-flashed. You need a Windows PC or Mac for a few minutes, to prepare the SD card and paste one command. There is no phone or hotspot step.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "24px 0 8px" }}>Step 1 — Flash the SD card</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 8px" }}>
            Download and install <strong style={{ color: "var(--text)" }}>Raspberry Pi Imager</strong> from <a href="https://www.raspberrypi.com/software/" target="_blank" style={{ color: "var(--text)" }}>raspberrypi.com/software</a>. Insert your microSD card, then open the Imager and configure:
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
                <span style={{ color: "var(--text)", fontWeight: 700, minWidth: 160 }}>{row.label}</span>
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
                <span style={{ color: "var(--good)", fontWeight: 700, minWidth: 160 }}>{row.label}</span>
                <span style={{ color: "var(--muted)" }}>{row.value}</span>
              </div>
            ))}
          </div>
          {tip("This is the Wi-Fi the Pi stays on, so use the network at the place the receiver will live.")}
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "12px 0" }}>
            Click <strong style={{ color: "var(--text)" }}>Save → Write → Yes</strong> to flash. When done, eject the card and insert it into your Pi.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "28px 0 8px" }}>Step 2 — Connect to the Pi</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            Plug your Pro Stick Plus into the Pi, then power it on. Wait about 60 seconds for it to boot and connect to your WiFi.
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 8px" }}>
            Next, find the Pi&apos;s IP address. Use whichever method works for your router:
          </p>
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "16px 20px", margin: "12px 0",
            display: "flex", flexDirection: "column" as const, gap: 12,
          }}>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              <span style={{ color: "var(--good)", fontWeight: 700 }}>Router app</span> — If your router has an app (Eero, Google Home, Orbi, Netgear, etc.) open it and look at the connected devices list. Find the device named <strong style={{ color: "var(--text)" }}>raspberrypi</strong> and note its IP address.
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              <span style={{ color: "var(--good)", fontWeight: 700 }}>Router admin page</span> — Check the sticker on the back or bottom of your router for the admin login address and credentials. Open that address in a browser, log in, and find the connected devices list. Look for <strong style={{ color: "var(--text)" }}>raspberrypi</strong> and note its IP.
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              <span style={{ color: "var(--good)", fontWeight: 700 }}>Windows (find your router address)</span> — Open PowerShell and run <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>ipconfig</code> — look for <strong style={{ color: "var(--text)" }}>Default Gateway</strong>. Type that address into a browser to open your router admin page, then find raspberrypi in the connected devices list.
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

          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "28px 0 8px" }}>Step 3 — Paste the install command</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            Open <Link href="/app/ground-station" style={{ color: "var(--text)" }}>Ground Station in the web app</Link> and press <strong style={{ color: "var(--text)" }}>Copy command</strong>. It is this line with your own device key on the end:
          </p>
          {codeBlock(`curl -fsSL https://finalpingapp.com/install.sh | sudo bash -s -- YOUR_DEVICE_KEY`)}
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            Paste it into the SSH window and press Enter. It installs the ADS-B decoder, the adsb.lol feed and the FinalPing receiver, starts them on every boot, and asks no questions. Running it again is safe: it only does what is missing.
          </p>
          {tip("On a Pi Zero 2 W the first install takes 15 to 30 minutes, most of it building the decoder. It prints a line every two minutes so you can see it is still working.")}
          {success("When it says \"Done. Your receiver is online.\" the Ground Station page shows it within a minute.")}
          {note("Treat the device key like a password. If someone else has seen it, replace it on the Ground Station page and run the command again with the new key.")}

          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "28px 0 8px" }}>Feeding adsb.lol, and the free plan</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            The installer sets the Pi up to feed <a href="https://adsb.lol" target="_blank" rel="noreferrer" style={{ color: "var(--text)" }}>adsb.lol</a>, the community-run open network FinalPing draws on. A receiver that feeds on 5 of any 7 days earns the whole FinalPing plan for free, for as long as it keeps feeding, and a new receiver gets it from its first report. The Ground Station page shows where you stand.
          </p>

          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "28px 0 8px" }}>Optional — MLAT</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, margin: "0 0 12px" }}>
            adsb.lol can also use your receiver to help locate aircraft that do not broadcast a position (MLAT). That needs the antenna&apos;s exact position and height, so it is off unless you give them on the first install: latitude, longitude, and altitude in metres above sea level, after the key.
          </p>
          {codeBlock(`curl -fsSL https://finalpingapp.com/install.sh | sudo bash -s -- YOUR_DEVICE_KEY 33.09376 -97.25061 206`)}
          {tip("Without a position, MLAT stays off and the decoder is only given your airport's location, rounded to about a kilometre.")}
        </div>

        {/* ── Windows and macOS ── */}
        <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 40, paddingBottom: 40 }}>
          {sectionTag("Windows and macOS", "rgba(255,255,255,0.06)", "rgba(255,255,255,0.16)", "var(--text)")}
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, margin: 0 }}>
            The receiver installs on Raspberry Pi OS and other Debian-based Linux. The earlier Windows and macOS installers signed in the way the desktop app did, which has been retired, so they are not offered for now.
          </p>
        </div>

        {/* After setup */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>After setup</h2>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {[
              { title: "Ground Station status", body: "Open finalpingapp.com/app and go to Ground Station. It shows whether the receiver is online, how many aircraft it hears, its range, and where you stand on the free plan for feeding. If it shows Offline, check that the Pi has power and internet." },
              { title: "Alerts", body: "Takeoff, approach and landing alerts go out through your FinalPing notification channels: Discord, Slack, SMS, email, or any other you have connected. Nothing extra to configure." },
              { title: "Live Map", body: "The Live Map in the web app shows your aircraft in real time. The range outline is the area your antenna can actually hear. It fills in over time as aircraft are received in different directions." },
              { title: "Changing aircraft or airport", body: "Change them in the web app. The receiver picks the change up within 10 minutes." },
              { title: "Updates", body: "The receiver checks for new software by itself and installs it. There is nothing to do." },
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
            { q: "Ground Station shows Offline", a: "Check that the Pi is powered on and online. Then SSH in and run: sudo systemctl status finalping-ground — look for errors. The last lines of its log: sudo journalctl -u finalping-ground -n 40" },
            { q: "The installer stopped, or a step reported a problem", a: "Run the same command again: it only does what is still missing. Everything the install did is in /var/log/finalping-install.log on the Pi." },
            { q: "\"FinalPing did not accept that device key\"", a: "The key in the command is not the current one. Copy the command again from the Ground Station page in the web app. If you replaced the key, the old one no longer works." },
            { q: "\"The decoder is not running yet\"", a: "The radio is not plugged in or was not detected. Plug the Pro Stick Plus in and restart the Pi: sudo reboot. To look closer: sudo systemctl status readsb (on kits flashed before November 2026: sudo systemctl status finalping-dump1090)." },
            { q: "The Ground Station page says adsb.lol is not being fed", a: "Run the install command again, which adds the feed if it is missing, and check it: sudo systemctl status adsblol-feed. The decoder has to be running for there to be anything to feed." },
            { q: "SSH gives \"host key changed\" warning", a: "You previously connected to a different Pi at this IP address. Clear the old key (replace the IP with your Pi's actual IP) and try again:\n\nssh-keygen -R 192.168.1.45" },
            { q: "Pre-flashed kit: \"Ground station not enabled\" during phone setup", a: "The phone setup needs the email of a FinalPing account with a plan. To redo it, delete the config and reboot, and the Pi will broadcast FinalPing-Setup again:\n\nsudo rm /home/pi/finalping-ground/config.json && sudo reboot" },
            { q: "Pre-flashed kit: the Pi won't connect to my WiFi after setup", a: "The SSID or password entered during phone setup may have been wrong. To redo setup, delete the config and reboot:\n\nsudo rm /home/pi/finalping-ground/config.json && sudo reboot\n\nThen connect to FinalPing-Setup again and re-enter your WiFi credentials and email." },
            { q: "No aircraft appearing", a: "Make sure your antenna is connected and has a view of the sky. Indoor antennas near windows work but outdoor antennas give much better range. Confirm your aircraft are added in the web app under Aircraft." },
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
            Buy a Receiver
          </Link>
          <Link href="/groundstationkit" style={{
            padding: "11px 24px", borderRadius: 999,
            background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
            color: "var(--text)", fontSize: 14, fontWeight: 600, textDecoration: "none",
          }}>
            Buy a Pi Kit
          </Link>
          <Link href="/pricing" style={{
            padding: "11px 24px", borderRadius: 999,
            background: "var(--cta)", color: "var(--cta-text)",
            fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}>
            See the plan →
          </Link>
        </div>

      </div>
    </main>
  );
}
