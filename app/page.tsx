// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <div className="panel" style={{ padding: 22 }}>
        <div className="small" style={{ letterSpacing: "0.08em" }}>
          SkyPing
        </div>

        <h1 style={{ marginTop: 8 }}>
          Real-time aircraft tracking with proximity alerts near any coordinate.
        </h1>

        <p>
          Replace this text with what your product does and the main benefit. Keep it short:
          who it’s for, what it fixes, and why it’s better.
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

      <div className="grid-3">
        <div className="panel">
          <h2 className="section-title">What it does</h2>
          <p className="section-sub">Tracks aircraft live, calculates distance from your saved location, and sends alerts when aircraft enter your zone.</p>
        </div>
        <div className="panel">
          <h2 className="section-title">Who it’s for</h2>
          <p className="section-sub">Aviation enthusiasts, Plane Spotters, Ramp Agents, Fuel Trucks, and anyone monitoring specific flights.</p>
        </div>
        <div className="panel">
          <h2 className="section-title">Why it’s better</h2>
          <p className="section-sub">Fast alerts for when a selected aircraft enters your area.</p>
        </div>
      </div>
    </>
  );
}