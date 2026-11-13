import type { Metadata } from "next";
import Link from "next/link";

// The desktop apps were retired on 13 November 2026. This address stays so
// that old links and emails still land somewhere useful.

export const metadata: Metadata = {
  title: "No download needed",
  description: "FinalPing runs in your browser. Sign in to track your aircraft and get arrival alerts, with nothing to install.",
};

export default function DownloadPage() {
  return (
    <div style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 720 }}>
      <h1>No download needed</h1>
      <p>
        FinalPing now runs in your browser. Sign in and your aircraft, airport and alerts are ready, with nothing to install or update.
      </p>
      <div className="btn-row" style={{ marginTop: 20 }}>
        <Link className="btn btn-solid" href="/app">Open FinalPing</Link>
        <Link className="btn btn-outline" href="/pricing">View pricing</Link>
      </div>

      <div className="panel" style={{ padding: 20, marginTop: 40 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Used the desktop app?</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>
          The Windows and macOS apps were retired on 13 November 2026 and no longer sign in. Nothing is lost: your aircraft, airport,
          alert settings, integrations and history are stored with your account. Sign in to the web app with the same email, and
          uninstall the desktop app whenever you like. Alerts keep arriving either way.
        </p>
      </div>

      <div className="panel" style={{ padding: 20, marginTop: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>FinalPing for Teams</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>
          The Teams edition for FBOs, ramp crews and flight schools is in development.{" "}
          <Link href="/waitlist" style={{ color: "var(--text)" }}>Get notified when it launches</Link>.
        </p>
      </div>
    </div>
  );
}
