// app/page.tsx
import Link from "next/link";
import AirplaneBackground from "./components/AirplaneBackground";

const features = [
  { icon: "📡", title: "Live ADS-B Tracking", desc: "Monitors real-time aircraft transponder data to track exact positions, altitude, and speed of your selected aircraft." },
  { icon: "🔔", title: "Proximity Alerts", desc: "Set custom distance zones — get notified at 10nm, 5nm, 2nm, or any distance you choose as aircraft approach." },
  { icon: "💬", title: "Discord, Slack & Teams", desc: "Send alerts directly to your team's channels via webhook integrations. No extra apps needed." },
  { icon: "✈️", title: "Multi-Aircraft Tracking", desc: "Track multiple tail numbers simultaneously. Each aircraft gets its own alert chain as it approaches." },
  { icon: "🌙", title: "Quiet Hours", desc: "Automatically pause notifications during off-hours. No 3am alerts — unless you want them." },
  { icon: "🔑", title: "License Key Activation", desc: "Purchase once, activate instantly. Your license key is delivered by email and works across reinstalls." },
];

const steps = [
  { num: "01", title: "Purchase & Download", desc: "Pick a plan, get your license key by email, and download the Windows installer." },
  { num: "02", title: "Activate & Configure", desc: "Enter your license key, set your airport location coordinates, and connect Discord/Slack/Teams." },
  { num: "03", title: "Add Aircraft", desc: "Add tail numbers and ICAO24 codes for the aircraft you want to monitor." },
  { num: "04", title: "Get Alerts", desc: "FinalPing runs in the background and sends you real-time notifications as aircraft enter your zones." },
];

const useCases = [
  { icon: "🛫", title: "Ramp Agents & Ground Crews", desc: "Know exactly when inbound aircraft are approaching so you can prep the gate, fuel truck, or equipment ahead of time." },
  { icon: "🔭", title: "Plane Spotters & Enthusiasts", desc: "Get alerts when rare or interesting aircraft enter your area — never miss a flyover again." },
  { icon: "🏫", title: "Flight Schools & FBOs", desc: "Track your fleet and training aircraft in real time. Know when students are returning before they call in." },
  { icon: "📦", title: "Cargo & Logistics Teams", desc: "Monitor inbound cargo flights to coordinate ground handling and minimize turnaround time." },
];

const faqs = [
  { q: "What data source does FinalPing use?", a: "FinalPing uses ADS-B (Automatic Dependent Surveillance-Broadcast) data, which is publicly broadcast by aircraft transponders. This is the same data used by services like FlightAware and Flightradar24." },
  { q: "Does it work outside the United States?", a: "Yes — FinalPing works with any coordinates worldwide. As long as ADS-B coverage exists in your area, you can track aircraft near any location on the globe." },
  { q: "How many aircraft can I track?", a: "It depends on your plan. The Starter tier supports tracking a limited number of aircraft, while Premium and Pro tiers allow more. Check the pricing page for exact limits." },
  { q: "Do I need to keep the app open for alerts to work?", a: "The desktop app needs to be running, but it works quietly in the background. You don't need to keep it in the foreground — it will send notifications to your configured channels automatically." },
  { q: "What platforms are supported?", a: "FinalPing is currently available as a Windows desktop application. macOS and Linux support are planned for future releases." },
  { q: "Can I customize the alert messages?", a: "Absolutely. Each distance alert has a fully customizable message template with variables like {tail_number}, {airport}, {distance}, and {altitude} that get replaced with real data." },
  { q: "What happens if I reinstall or switch computers?", a: "Your license key works across reinstalls. Just enter the same key on your new setup and you're good to go." },
  { q: "Is there a free trial?", a: "There isn't a free trial at this time, but all plans come with support. If something isn't working as expected, reach out via the contact page and we'll help." },
];

export default function HomePage() {
  return (
    <>
      <AirplaneBackground />

      {/* HERO */}
      <section style={{
        position: "relative", zIndex: 1,
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center",
        padding: "80px 24px 60px",
        marginTop: "-40px",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 14px", borderRadius: "999px",
          background: "rgba(14, 165, 233, 0.1)",
          border: "1px solid rgba(14, 165, 233, 0.25)",
          color: "#0ea5e9", fontSize: 12, fontWeight: 500,
          marginBottom: 28,
        }}>
          ✈ Real-time ADS-B tracking
        </div>

        <h1 style={{
          fontSize: "clamp(38px, 7vw, 72px)",
          fontWeight: 800, letterSpacing: "-0.03em",
          lineHeight: 1.05, marginBottom: 20, maxWidth: 800,
        }}>
          Know when your aircraft<br />is on{" "}
          <span style={{ color: "#0ea5e9" }}>final.</span>
        </h1>

        <p style={{ fontSize: 16, color: "var(--muted)", maxWidth: 480, lineHeight: 1.7, marginBottom: 36 }}>
          Instant Discord, Slack, and Teams alerts the moment your aircraft enters your airspace.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
          <Link href="/download" className="btn btn-solid" style={{
            padding: "13px 28px", borderRadius: "999px", fontSize: 14,
            boxShadow: "0 0 32px rgba(14,165,233,0.3)",
          }}>
            Download Now
          </Link>
          <Link href="/pricing" className="btn btn-outline" style={{ padding: "13px 28px", borderRadius: "999px", fontSize: 14 }}>
            View Pricing
          </Link>
        </div>

        <div className="chips" style={{ justifyContent: "center" }}>
          <span className="chip">Instant delivery</span>
          <span className="chip">License keys</span>
          <span className="chip">Updates</span>
          <span className="chip">Support</span>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ position: "relative", zIndex: 1, paddingTop: 72, paddingBottom: 72 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="small" style={{ letterSpacing: "0.1em", marginBottom: 8, color: "var(--accent)" }}>FEATURES</div>
          <h2 style={{ fontSize: 32, letterSpacing: "-0.02em" }}>Everything you need to track aircraft</h2>
          <p style={{ maxWidth: 520, margin: "10px auto 0", fontSize: 15 }}>
            FinalPing combines live ADS-B data with customizable alerts and team integrations — all in one lightweight desktop app.
          </p>
        </div>
        <div className="grid-3">
          {features.map((f) => (
            <div className="panel" key={f.title} style={{ padding: 24 }}>
              <div style={{ fontSize: 30, marginBottom: 12 }}>{f.icon}</div>
              <h2 style={{ fontSize: 15, marginBottom: 6 }}>{f.title}</h2>
              <p style={{ fontSize: 13, marginBottom: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: "relative", zIndex: 1, paddingTop: 72, paddingBottom: 72 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="small" style={{ letterSpacing: "0.1em", marginBottom: 8, color: "var(--accent)" }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: 32, letterSpacing: "-0.02em" }}>Up and running in minutes</h2>
          <p style={{ maxWidth: 480, margin: "10px auto 0", fontSize: 15 }}>From purchase to your first alert — four simple steps.</p>
        </div>
        <div className="grid-2" style={{ maxWidth: 720, margin: "0 auto" }}>
          {steps.map((s) => (
            <div className="panel" key={s.num} style={{ padding: 24, display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--accent)", lineHeight: 1, flexShrink: 0, width: 36 }}>
                {s.num}
              </div>
              <div>
                <h2 style={{ fontSize: 15, marginBottom: 6 }}>{s.title}</h2>
                <p style={{ fontSize: 13, marginBottom: 0 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section style={{ position: "relative", zIndex: 1, paddingTop: 72, paddingBottom: 72 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="small" style={{ letterSpacing: "0.1em", marginBottom: 8, color: "var(--accent)" }}>USE CASES</div>
          <h2 style={{ fontSize: 32, letterSpacing: "-0.02em" }}>Built for people who need to know</h2>
          <p style={{ maxWidth: 520, margin: "10px auto 0", fontSize: 15 }}>
            Whether you&apos;re on the ramp, in the tower, or just watching the skies — FinalPing keeps you informed.
          </p>
        </div>
        <div className="grid-2">
          {useCases.map((u) => (
            <div className="panel" key={u.title} style={{ padding: 24, display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ fontSize: 30, flexShrink: 0 }}>{u.icon}</div>
              <div>
                <h2 style={{ fontSize: 15, marginBottom: 6 }}>{u.title}</h2>
                <p style={{ fontSize: 13, marginBottom: 0 }}>{u.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ position: "relative", zIndex: 1, paddingTop: 72, paddingBottom: 72 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="small" style={{ letterSpacing: "0.1em", marginBottom: 8, color: "var(--accent)" }}>FAQ</div>
          <h2 style={{ fontSize: 32, letterSpacing: "-0.02em" }}>Frequently asked questions</h2>
          <p style={{ maxWidth: 480, margin: "10px auto 0", fontSize: 15 }}>Everything you need to know before getting started.</p>
        </div>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((f) => (
            <div className="panel" key={f.q} style={{ padding: 22 }}>
              <h2 style={{ fontSize: 14, marginBottom: 8, color: "var(--text)" }}>{f.q}</h2>
              <p style={{ fontSize: 13, marginBottom: 0, lineHeight: 1.7 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ position: "relative", zIndex: 1, paddingTop: 40, paddingBottom: 16 }}>
        <div className="panel" style={{ padding: 40, textAlign: "center" }}>
          <h2 style={{ fontSize: 28, marginBottom: 8, letterSpacing: "-0.02em" }}>Ready to start tracking?</h2>
          <p style={{ maxWidth: 440, margin: "0 auto 24px", fontSize: 15 }}>
            Get FinalPing today and never miss an aircraft arrival again.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="btn btn-outline" href="/pricing" style={{ padding: "12px 24px", borderRadius: "999px" }}>
              View Pricing
            </Link>
            <Link className="btn btn-solid" href="/download" style={{
              padding: "12px 24px", borderRadius: "999px",
              boxShadow: "0 0 24px rgba(14,165,233,0.25)",
            }}>
              Download Now
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
