export default function CheckoutSuccessPage() {
  return (
    <div className="panel" style={{ maxWidth: 520, margin: "40px auto", textAlign: "center", padding: 36 }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
      <h1 style={{ marginBottom: 8 }}>Purchase successful!</h1>
      <p>Your license key is on its way to your email. Check your inbox (and spam folder just in case).</p>
      <p>Once you have your key, download the app and activate it.</p>
      <div className="btn-row" style={{ justifyContent: "center", marginTop: 20 }}>
        <a className="btn btn-solid" href="/download">Download App</a>
        <a className="btn btn-outline" href="/dashboard">View Dashboard</a>
      </div>
    </div>
  );
}
