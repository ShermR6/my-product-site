// app/components/TestimonialsCarousel.tsx
"use client";

import { useRef } from "react";

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

const ArrowBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    style={{
      flexShrink: 0, width: 36, height: 36, borderRadius: "50%",
      background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)",
      color: "#0ea5e9", fontSize: 20, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background 0.15s",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = "rgba(14,165,233,0.3)"; }}
    onMouseLeave={e => { e.currentTarget.style.background = "rgba(14,165,233,0.15)"; }}
  >{children}</button>
);

export default function TestimonialsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "right" ? 380 : -380, behavior: "smooth" });
  };

  return (
    <section style={{
      position: "relative", zIndex: 1, paddingTop: 72, paddingBottom: 72,
      borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div className="small" style={{ letterSpacing: "0.1em", marginBottom: 8, color: "var(--accent)" }}>TESTIMONIALS</div>
        <h2 style={{ fontSize: 32, letterSpacing: "-0.02em" }}>Trusted by pilots & operators</h2>
        <p style={{ maxWidth: 480, margin: "10px auto 0", fontSize: 15 }}>See what FinalPing users are saying.</p>
      </div>

      {/* Arrow left | cards | Arrow right */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 16, paddingRight: 16 }}>
        <ArrowBtn onClick={() => scroll("left")}>‹</ArrowBtn>

        <div
          ref={scrollRef}
          style={{
            display: "flex", gap: 16, overflowX: "auto", flex: 1,
            paddingBottom: 4,
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none", scrollbarWidth: "none",
          }}
        >
          {testimonials.map((t) => (
            <div className="panel" key={t.name} style={{
              padding: 24, position: "relative", flexShrink: 0,
              width: "clamp(260px, 30vw, 340px)",
              scrollSnapAlign: "start",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{
                position: "absolute", top: 16, right: 20,
                fontSize: 56, color: "rgba(14,165,233,0.12)",
                fontFamily: "Georgia, serif", lineHeight: 1, userSelect: "none",
              }}>&ldquo;</div>
              <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ color: "#f59e0b", fontSize: 13 }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 20, flex: 1 }}>
                &ldquo;{t.text}&rdquo;
              </p>
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

        <ArrowBtn onClick={() => scroll("right")}>›</ArrowBtn>
      </div>

      <style>{`
        .testimonials-hide-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
