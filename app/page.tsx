// app/page.tsx
import Link from "next/link";
import AirplaneBackground from "./components/AirplaneBackground";
import TestimonialsCarousel from "./components/TestimonialsCarousel";
import VideoPlayer from "./components/VideoPlayer";

const features = [
  { icon: "📡", title: "Live ADS-B Tracking", desc: "Monitors real-time aircraft transponder data to track exact positions, altitude, and speed of your selected aircraft." },
  { icon: "🔔", title: "Proximity Alerts", desc: "Set custom distance zones — get notified at 10nm, 5nm, 2nm, or any distance you choose as aircraft approach." },
  { icon: "📲", title: "SMS & Push Alerts", desc: "Get notified instantly via SMS, push notifications, email, and more. Alerts go where you are — no extra apps needed." },
  { icon: "✈️", title: "Multi-Aircraft Tracking", desc: "Track multiple tail numbers simultaneously. Each aircraft gets its own alert chain as it approaches." },
  { icon: "🌙", title: "Quiet Hours", desc: "Automatically pause notifications during off-hours. No 3am alerts — unless you want them." },
  { icon: "🔑", title: "License Key Activation", desc: "Purchase once, activate instantly. Your license key is delivered by email and works across reinstalls." },
];

const steps = [
  { num: "01", title: "Purchase & Download", desc: "Pick a plan, get your license key by email, and download the Windows installer." },
  { num: "02", title: "Activate & Configure", desc: "Enter your license key, set your airport location coordinates, and connect your notification channel." },
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
  { q: "Is there a free trial?", a: "Yes — all plans include a 7-day free trial. Your 30-day access period begins when you activate your license key in the app, not when you purchase. There's also a 30-day money-back guarantee if FinalPing isn't the right fit." },
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
          Instant SMS and push alerts the moment your aircraft enters your airspace.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <Link href="/pricing" className="btn btn-solid" style={{
            padding: "13px 28px", borderRadius: "999px", fontSize: 14,
            boxShadow: "0 0 32px rgba(14,165,233,0.3)",
          }}>
            Start Free Trial
          </Link>
          <Link href="/download" className="btn btn-outline" style={{ padding: "13px 28px", borderRadius: "999px", fontSize: 14 }}>
            Download Now
          </Link>
        </div>

        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 28 }}>
          7-day free trial · 30-day money-back guarantee · No commitment
        </p>

        <div className="chips" style={{ justifyContent: "center" }}>
          <span className="chip">Instant delivery</span>
          <span className="chip">License keys</span>
          <span className="chip">Updates</span>
          <span className="chip">Support</span>
        </div>

        <div style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          color: "var(--muted)", fontSize: 11, fontWeight: 500,
          letterSpacing: "0.12em", textTransform: "uppercase",
          animation: "scrollBounce 2s ease-in-out infinite", cursor: "pointer", opacity: 0.6,
        }}>
          <span>Scroll to explore</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </div>
      </section>

      {/* HOW IT WORKS — VIDEO SECTION */}
      <section style={{
        position: "relative", zIndex: 1, paddingTop: 72, paddingBottom: 72,
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="small" style={{ letterSpacing: "0.1em", marginBottom: 8, color: "var(--accent)" }}>SEE IT IN ACTION</div>
            <h2 style={{ fontSize: 32, letterSpacing: "-0.02em", marginBottom: 12, lineHeight: 1.2 }}>
              From wheels down to{" "}
              <span style={{ color: "#0ea5e9" }}>instant alert</span>{" "}
              in seconds
            </h2>
            <p style={{ fontSize: 15, color: "var(--muted)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              FinalPing watches your aircraft 24/7 and fires alerts the moment they enter your airspace — so you&apos;re always ready at the ramp.
            </p>
          </div>

          {/* Full-width video */}
          <div style={{
            border: "1px solid var(--border)",
            borderRadius: 20, overflow: "hidden", aspectRatio: "16/9",
            position: "relative",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            marginBottom: 40,
          }}>
            <VideoPlayer src="/videos/FinalPingSAAS.mp4" />
          </div>

          {/* Steps below */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { n: "1", t: "Add your aircraft", d: "Enter tail numbers and ICAO codes. Takes 30 seconds." },
              { n: "2", t: "Set your location", d: "Configure your airport or FBO with custom alert distances." },
              { n: "3", t: "Connect your channels", d: "SMS, push alerts, email, and more. Mix and match." },
              { n: "4", t: "Get alerted automatically", d: "10nm, 5nm, 2nm, and landing notifications fire in real time." },
            ].map((s) => (
              <div key={s.n} className="panel" style={{ padding: 18 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)",
                  color: "#0ea5e9", fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 10,
                }}>{s.n}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{s.t}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{s.d}</div>
              </div>
            ))}
          </div>
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

      <TestimonialsCarousel />

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
          <h2 style={{ fontSize: 28, marginBottom: 8, letterSpacing: "-0.02em" }}>Try FinalPing free for 7 days</h2>
          <p style={{ maxWidth: 440, margin: "0 auto 8px", fontSize: 15 }}>
            No commitment. Cancel anytime. 30-day money-back guarantee.
          </p>
          <p style={{ maxWidth: 440, margin: "0 auto 24px", fontSize: 13, color: "var(--muted)" }}>
            Your 30-day access period begins when you activate your license — not when you purchase.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="btn btn-solid" href="/pricing" style={{
              padding: "12px 24px", borderRadius: "999px",
              boxShadow: "0 0 24px rgba(14,165,233,0.25)",
            }}>
              Start Free Trial
            </Link>
            <Link className="btn btn-outline" href="/download" style={{ padding: "12px 24px", borderRadius: "999px" }}>
              Download Now
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
