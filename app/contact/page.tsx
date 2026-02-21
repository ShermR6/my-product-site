// app/contact/page.tsx
export default function ContactPage() {
  return (
    <>
      <h1>Contact us</h1>
      <p>Questions about licensing, installation, or support? Send a message.</p>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="panel-white">
          <h2 style={{ marginBottom: 6 }}>Send a message</h2>
          <p style={{ marginTop: 0, color: "#333" }}>
            Placeholder form for now. Later you can connect email/SaaS support tooling.
          </p>

          <div className="field">
            <label>Email</label>
            <input placeholder="Email" />
          </div>

          <div className="field">
            <label>Password</label>
            <input placeholder="Password" type="password" />
          </div>

          <div className="field">
            <label>Message</label>
            <textarea placeholder="How can we help?" />
          </div>

          <button className="btn btn-solid" style={{ width: "100%" }}>
            Send (placeholder)
          </button>
        </div>

        <div className="panel-white">
          <h2 style={{ marginBottom: 6 }}>Other ways to reach us</h2>

          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, marginTop: 10 }}>Email</div>
            <div>support@yourdomain.com</div>

            <div style={{ fontWeight: 700, marginTop: 10 }}>Hours</div>
            <div>Mon–Fri, 9am–5pm</div>

            <div style={{ fontWeight: 700, marginTop: 10 }}>Response time</div>
            <div>Usually within 1 business day</div>

            <div className="note" style={{ marginTop: 14 }}>
              Replace these placeholders with your real support details later.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}