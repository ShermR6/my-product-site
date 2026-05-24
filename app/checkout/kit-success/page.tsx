export default function KitSuccessPage() {
  return (
    <div className="panel" style={{ maxWidth: 520, margin: "80px auto", textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 44, marginBottom: 16 }}>📦</div>
      <h1 style={{ marginBottom: 8 }}>Order received!</h1>
      <p style={{ lineHeight: 1.7 }}>
        Thanks for your order. We&apos;ll email you within 1 business day to confirm your shipping details and estimated delivery.
      </p>
      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginTop: 12 }}>
        Check your inbox for a payment receipt from Stripe. If you have any questions, reach out via the Contact page.
      </p>
      <div className="btn-row" style={{ justifyContent: "center", marginTop: 24 }}>
        <a className="btn btn-solid" href="/groundstationsetup">View Setup Guide</a>
        <a className="btn btn-outline" href="/contact">Contact Us</a>
      </div>
    </div>
  );
}
