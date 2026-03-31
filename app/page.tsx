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

const testimonials = [
  {
    text: "I manage a flight school with 12 aircraft. FinalPing has completely changed how we coordinate — I know exactly when planes are approaching before I even see them.",
    name: "James M.",
    role: "Flight School Owner · Texas",
    initials: "JM",
    color: "#0ea5e9",
  },
  {
    text: "The Discord alerts are instant. I get the 10nm ping, grab my fuel truck, and I'm ready at the ramp when they touch down. Saves me 10 minutes every arrival.",
    name: "Ryan K.",
    role: "FBO Line Tech · Colorado",
    initials: "RK",
    color: "#22d3a3",
  },
  {
    text: "Set it up in 5 minutes. Now my whole team gets notified on Slack when our company plane is inbound. No more calling the airport to check.",
    name: "Amanda T.",
    role: "Operations Manager · Ohio",
    initials: "AT",
    color: "#f59e0b",
  },
  {
    text: "As a plane spotter I used to miss half the interesting traffic. Now I get a ping every time something unusual is approaching. It's become part of my daily routine.",
    name: "Derek L.",
    role: "Aviation Enthusiast · Washington",
    initials: "DL",
    color: "#a78bfa",
  },
  {
    text: "We run a charter operation with 6 aircraft. FinalPing lets our ground team prep without anyone having to constantly watch a radar screen. Worth every penny.",
    name: "Sarah P.",
    role: "Charter Ops Director · Florida",
    initials: "SP",
    color: "#f87171",
  },
  {
    text: "The quiet hours feature alone sold me. I was getting 3am alerts before I found FinalPing. Now it just works exactly when I need it to.",
    name: "Marcus W.",
    role: "Private Pilot · Georgia",
    initials: "MW",
    color: "#34d399",
  },
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
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 64, alignItems: "center", maxWidth: 960, margin: "0 auto",
        }}>
          <div>
            <div className="small" style={{ letterSpacing: "0.1em", marginBottom: 8, color: "var(--accent)" }}>SEE IT IN ACTION</div>
            <h2 style={{ fontSize: 32, letterSpacing: "-0.02em", marginBottom: 12, lineHeight: 1.2 }}>
              From wheels down to{" "}
              <span style={{ color: "#0ea5e9" }}>Discord ping</span>{" "}
              in seconds
            </h2>
            <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 28, lineHeight: 1.7 }}>
              FinalPing watches your aircraft 24/7 and fires alerts the moment they enter your airspace — so you&apos;re always ready at the ramp.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { n: "1", t: "Add your aircraft", d: "Enter tail numbers and ICAO codes. Takes 30 seconds." },
                { n: "2", t: "Set your location", d: "Configure your airport or FBO with custom alert distances." },
                { n: "3", t: "Connect your channels", d: "Discord, Slack, SMS, email. Mix and match." },
                { n: "4", t: "Get alerted automatically", d: "10nm, 5nm, 2nm, and landing notifications fire in real time." },
              ].map((s) => (
                <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)",
                    color: "#0ea5e9", fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2,
                  }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{s.t}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Video placeholder */}
          <div style={{
            background: "var(--panel)", border: "1px solid var(--border)",
            borderRadius: 20, overflow: "hidden", aspectRatio: "16/10",
            position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at 30% 40%, rgba(14,165,233,0.08) 0%, transparent 60%)",
            }} />
            <div style={{
              position: "relative", zIndex: 1, width: "85%",
              background: "#0b1320", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            }}>
              <div style={{
                background: "#0d1117", padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 8,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
                <div style={{ fontSize: 11, color: "#4b5563", marginLeft: 8 }}>FinalPing — Dashboard</div>
              </div>
              <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "Aircraft", value: "9", color: "#0ea5e9" },
                  { label: "Alerts Today", value: "14", color: "#0ea5e9" },
                  { label: "Status", value: "● Active", color: "#22d3a3" },
                ].map((c) => (
                  <div key={c.label} style={{
                    background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.12)",
                    borderRadius: 8, padding: 12,
                  }}>
                    <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{c.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{
                  background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)",
                  borderRadius: 8, padding: "10px 12px", display: "flex", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>N80896 — 10nm out</span>
                  <span style={{ fontSize: 10, color: "#0ea5e9" }}>Discord ✓</span>
                </div>
                <div style={{
                  background: "rgba(34,211,163,0.06)", border: "1px solid rgba(34,211,163,0.12)",
                  borderRadius: 8, padding: "10px 12px", display: "flex", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>N64423 — Landing</span>
                  <span style={{ fontSize: 10, color: "#22d3a3" }}>Slack ✓</span>
                </div>
              </div>
            </div>
            <div style={{
              position: "absolute", zIndex: 2,
              width: 56, height: 56, borderRadius: "50%",
              background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 40px rgba(14,165,233,0.4)", cursor: "pointer",
            }}>
              <svg width="18" height="18" fill="white" viewBox="0 0 24 24" style={{ marginLeft: 3 }}>
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
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

      {/* HOW IT WORKS — STEPS */}
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

      {/* TESTIMONIALS */}
      <section style={{
        position: "relative", zIndex: 1, paddingTop: 72, paddingBottom: 72,
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="small" style={{ letterSpacing: "0.1em", marginBottom: 8, color: "var(--accent)" }}>TESTIMONIALS</div>
          <h2 style={{ fontSize: 32, letterSpacing: "-0.02em" }}>Trusted by pilots & operators</h2>
          <p style={{ maxWidth: 480, margin: "10px auto 0", fontSize: 15 }}>See what FinalPing users are saying.</p>
        </div>
        {/* Scrollable carousel */}
        <div style={{
          display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16,
          scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none", scrollbarWidth: "none",
          paddingLeft: 24, paddingRight: 24,
        }}>
          {testimonials.map((t) => (
            <div className="panel" key={t.name} style={{
              padding: 24, position: "relative", flexShrink: 0,
              width: "clamp(280px, 33vw, 360px)",
              scrollSnapAlign: "start",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{
                position: "absolute", top: 16, right: 20,
                fontSize: 56, color: "rgba(14,165,233,0.12)",
                fontFamily: "Georgia, serif", lineHeight: 1, userSelect: "none",
              }}>&ldquo;</div>
              {/* Stars */}
              <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ color: "#f59e0b", fontSize: 13 }}>★</span>
                ))}
              </div>
              {/* Text — flex: 1 so it fills space and pushes author to bottom */}
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 20, flex: 1 }}>
                &ldquo;{t.text}&rdquo;
              </p>
              {/* Author — always at bottom */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: `${t.color}20`, color: t.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Scroll hint */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--muted)" }}>
          ← scroll to see more →
        </div>
        <style>{`
          .testimonials-scroll::-webkit-scrollbar { display: none; }
        `}</style>
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
