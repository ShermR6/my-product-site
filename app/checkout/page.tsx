import { PartyPopper } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <div className="panel" style={{ maxWidth: 520, margin: "40px auto", textAlign: "center", padding: 36 }}>
      <div style={{ marginBottom: 16, lineHeight: 0, color: "var(--text-2)" }}><PartyPopper size={40} strokeWidth={1.5} aria-hidden="true" /></div>
      <h1 style={{ marginBottom: 8 }}>Purchase successful!</h1>
      <p>Your license key is on its way to your email. Check your inbox (and spam folder just in case).</p>
      <p>FinalPing runs in your browser, so there is nothing to install. Sign in to start tracking.</p>
      <div className="btn-row" style={{ justifyContent: "center", marginTop: 20 }}>
        <a className="btn btn-solid" href="/app">Open FinalPing</a>
        <a className="btn btn-outline" href="/dashboard">View Dashboard</a>
      </div>
    </div>
  );
}
