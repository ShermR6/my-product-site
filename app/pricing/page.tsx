// app/pricing/page.tsx
export default function PricingPage() {
  return (
    <>
      <h1>Purchase a License</h1>
      <p>Placeholder page. Later, these buttons will start Stripe Checkout.</p>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="panel-white">
          <h2 style={{ marginBottom: 2 }}>Personal</h2>
          <p style={{ marginTop: 0, color: "#333" }}>Best for individuals.</p>

          <div style={{ fontSize: 32, fontWeight: 800, margin: "10px 0" }}>$XX</div>

          <ul style={{ margin: 0, paddingLeft: 18, color: "#111", fontSize: 13, lineHeight: 1.7 }}>
            <li>1 device</li>
            <li>Updates for 12 months</li>
            <li>Email support</li>
          </ul>

          <div style={{ height: 14 }} />

          <button className="btn btn-solid" style={{ width: "100%" }}>
            Buy Personal (Stripe later)
          </button>
        </div>

        <div className="panel-white">
          <h2 style={{ marginBottom: 2 }}>Team</h2>
          <p style={{ marginTop: 0, color: "#333" }}>Best for small teams.</p>

          <div style={{ fontSize: 32, fontWeight: 800, margin: "10px 0" }}>$XX</div>

          <ul style={{ margin: 0, paddingLeft: 18, color: "#111", fontSize: 13, lineHeight: 1.7 }}>
            <li>Up to 5 seats</li>
            <li>Updates for 12 months</li>
            <li>Priority support</li>
          </ul>

          <div style={{ height: 14 }} />

          <button className="btn btn-outline" style={{ width: "100%" }}>
            Buy Team (Stripe later)
          </button>
        </div>
      </div>
    </>
  );
}