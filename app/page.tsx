// app/page.tsx
import Link from "next/link";

const features = [
  {
    icon: "📡",
    title: "Live ADS-B Tracking",
    desc: "Monitors real-time aircraft transponder data to track exact positions, altitude, and speed of your selected aircraft.",
  },
  {
    icon: "🔔",
    title: "Proximity Alerts",
    desc: "Set custom distance zones — get notified at 10nm, 5nm, 2nm, or any distance you choose as aircraft approach.",
  },
  {
    icon: "💬",
    title: "Discord, Slack & Teams",
    desc: "Send alerts directly to your team's channels via webhook integrations. No extra apps needed.",
  },
  {
    icon: "✈️",
    title: "Multi-Aircraft Tracking",
    desc: "Track multiple tail numbers simultaneously. Each aircraft gets its own alert chain as it approaches.",
  },
  {
    icon: "🌙",
    title: "Quiet Hours",
    desc: "Automatically pause notifications during off-hours. No 3am alerts — unless you want them.",
  },
  {
    icon: "🔑",
    title: "License Key Activation",
    desc: "Purchase once, activate instantly. Your license key is delivered by email and works across reinstalls.",
  },
];

const steps = [
  {
    num: "01",
    title: "Purchase & Download",
    desc: "Pick a plan, get your license key by email, and download the Windows installer.",
  },
  {
    num: "02",
    title: "Activate & Configure",
    desc: "Enter your license key, set your airport location or coordinates, and connect Discord/Slack/Teams.",
  },
  {
    num: "03",
    title: "Add Aircraft",
    desc: "Add tail numbers or ICAO24 codes for the aircraft you want to monitor.",
  },
  {
    num: "04",
    title: "Get Alerts",
    desc: "SkyPing runs in the background and sends you real-time notifications as aircraft enter your zones.",
  },
];

const faqs = [
  {
    q: "What data source does SkyPing use?",
    a: "SkyPing uses ADS-B (Automatic Dependent Surveillance-Broadcast) data, which is publicly broadcast by aircraft transponders. This is the same data used by services like FlightAware and Flightradar24.",
  },
  {
    q: "Does it work outside the United States?",
    a: "Yes — SkyPing works with any coordinates worldwide. As long as ADS-B coverage exists in your area, you can track aircraft near any location on the globe.",
  },
  {
    q: "How many aircraft can I track?",
    a: "It depends on your plan. The Starter tier supports tracking a limited number of aircraft, while Premium and Pro tiers allow more. Check the pricing page for exact limits.",
  },
  {
    q: "Do I need to keep the app open for alerts to work?",
    a: "The desktop app needs to be running, but it works quietly in the background. You don't need to keep it in the foreground — it will send notifications to your configured channels automatically.",
  },
  {
    q: "What platforms are supported?",
    a: "SkyPing is currently available as a Windows desktop application. macOS and Linux support are planned for future releases.",
  },
  {
    q: "Can I customize the alert messages?",
    a: "Absolutely. Each distance alert has a fully customizable message template with variables like {tail_number}, {airport}, {distance}, and {altitude} that get replaced with real data.",
  },
  {
    q: "What happens if I reinstall or switch computers?",
    a: "Your license key works across reinstalls. Just enter the same key on your new setup and you're good to go.",
  },
  {
    q: "Is there a free trial?",
    a: "There isn't a free trial at this time, but all plans come with support. If something isn't working as expected, reach out via the contact page and we'll help.",
  },
];

const useCases = [
  {
    icon: "🛫",
    title: "Ramp Agents & Ground Crews",
    desc: "Know exactly when inbound aircraft are approaching so you can prep the gate, fuel truck, or equipment ahead of time.",
  },
  {
    icon: "🔭",
    title: "Plane Spotters & Enthusiasts",
    desc: "Get alerts when rare or interesting aircraft enter your area — never miss a flyover again.",
  },
  {
    icon: "🏫",
    title: "Flight Schools & FBOs",
    desc: "Track your fleet and training aircraft in real time. Know when students are returning before they call in.",
  },
  {
    icon: "📦",
    title: "Cargo & Logistics Teams",
    desc: "Monitor inbound cargo flights to coordinate ground handling and minimize turnaround time.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <div className="panel" style={{ padding: 22 }}>
        <div className="small" style={{ letterSpacing: "0.08em" }}>
          SkyPing
        </div>

        <h1 style={{ marginTop: 8 }}>
          Real-time aircraft tracking with proximity alerts near any coordinate.
        </h1>

        <p>
          Get live notifications on your device when your aircraft enters your
          defined proximity zone. Great for knowing how far away the plane is
          and when it will arrive.
        </p>

        <div className="btn-row">
          <Link className="btn btn-outline" href="/pricing">
            Purchase a License
          </Link>
          <Link className="btn btn-solid" href="/download">
            Download Installer
          </Link>
        </div>

        <div className="chips">
          <span className="chip">Instant delivery</span>
          <span className="chip">License keys</span>
          <span className="chip">Updates</span>
          <span className="chip">Support</span>
        </div>
      </div>

      <div style={{ height: 18 }} />

      {/* What / Who / Why */}
      <div className="grid-3">
        <div className="panel">
          <h2 className="section-title">What it does</h2>
          <p className="section-sub">
            Tracks aircraft live, calculates distance from your saved location,
            and sends alerts when aircraft enter your zone.
          </p>
        </div>
        <div className="panel">
          <h2 className="section-title">Who it&apos;s for</h2>
          <p className="section-sub">
            Aviation enthusiasts, Plane Spotters, Ramp Agents, Fuel Trucks, and
            anyone monitoring specific flights.
          </p>
        </div>
        <div className="panel">
          <h2 className="section-title">Why it&apos;s better</h2>
          <p className="section-sub">
            Fast alerts for when a selected aircraft enters your area.
          </p>
        </div>
      </div>

      {/* Features */}
      <section style={{ marginTop: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="small" style={{ letterSpacing: "0.08em", marginBottom: 6 }}>FEATURES</div>
          <h2 style={{ fontSize: 26 }}>Everything you need to track aircraft</h2>
          <p style={{ maxWidth: 520, margin: "8px auto 0" }}>
            SkyPing combines live ADS-B data with customizable alerts and team integrations — all in one lightweight desktop app.
          </p>
        </div>
        <div className="grid-3">
          {features.map((f) => (
            <div className="panel" key={f.title} style={{ padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <h2 style={{ fontSize: 15, marginBottom: 6 }}>{f.title}</h2>
              <p style={{ fontSize: 13, marginBottom: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ marginTop: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="small" style={{ letterSpacing: "0.08em", marginBottom: 6 }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: 26 }}>Up and running in minutes</h2>
          <p style={{ maxWidth: 480, margin: "8px auto 0" }}>
            From purchase to your first alert — four simple steps.
          </p>
        </div>
        <div className="grid-2" style={{ maxWidth: 720, margin: "0 auto" }}>
          {steps.map((s) => (
            <div className="panel" key={s.num} style={{ padding: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{
                fontSize: 20,
                fontWeight: 900,
                color: "var(--accent)",
                lineHeight: 1,
                flexShrink: 0,
                width: 32,
              }}>
                {s.num}
              </div>
              <div>
                <h2 style={{ fontSize: 15, marginBottom: 4 }}>{s.title}</h2>
                <p style={{ fontSize: 13, marginBottom: 0 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section style={{ marginTop: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="small" style={{ letterSpacing: "0.08em", marginBottom: 6 }}>USE CASES</div>
          <h2 style={{ fontSize: 26 }}>Built for people who need to know</h2>
          <p style={{ maxWidth: 520, margin: "8px auto 0" }}>
            Whether you&apos;re on the ramp, in the tower, or just watching the skies — SkyPing keeps you informed.
          </p>
        </div>
        <div className="grid-2">
          {useCases.map((u) => (
            <div className="panel" key={u.title} style={{ padding: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{u.icon}</div>
              <div>
                <h2 style={{ fontSize: 15, marginBottom: 4 }}>{u.title}</h2>
                <p style={{ fontSize: 13, marginBottom: 0 }}>{u.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ marginTop: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="small" style={{ letterSpacing: "0.08em", marginBottom: 6 }}>FAQ</div>
          <h2 style={{ fontSize: 26 }}>Frequently asked questions</h2>
          <p style={{ maxWidth: 480, margin: "8px auto 0" }}>
            Everything you need to know before getting started.
          </p>
        </div>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((f) => (
            <div className="panel" key={f.q} style={{ padding: 20 }}>
              <h2 style={{ fontSize: 14, marginBottom: 6, color: "var(--text)" }}>{f.q}</h2>
              <p style={{ fontSize: 13, marginBottom: 0, lineHeight: 1.7 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ marginTop: 48, marginBottom: 8 }}>
        <div className="panel" style={{ padding: 32, textAlign: "center" }}>
          <h2 style={{ fontSize: 24, marginBottom: 6 }}>Ready to start tracking?</h2>
          <p style={{ maxWidth: 440, margin: "0 auto 18px", fontSize: 14 }}>
            Get SkyPing today and never miss an aircraft arrival again.
          </p>
          <div className="btn-row" style={{ justifyContent: "center" }}>
            <Link className="btn btn-outline" href="/pricing">
              View Pricing
            </Link>
            <Link className="btn btn-solid" href="/download">
              Download Now
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
