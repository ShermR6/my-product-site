"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("email", { email, redirect: false, callbackUrl: "/dashboard" });
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="panel" style={{ maxWidth: 480, margin: "40px auto", textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
        <h2 style={{ marginBottom: 8 }}>Check your email</h2>
        <p>We sent a sign-in link to <strong>{email}</strong>. Click the link in the email to sign in.</p>
        <p style={{ fontSize: 12 }}>You can close this tab.</p>
      </div>
    );
  }

  return (
    <>
      <h1>Log in</h1>
      <p>Enter your email and we'll send you a sign-in link — no password needed.</p>

      <div className="panel-white" style={{ maxWidth: 480, marginTop: 18 }}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-solid"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send sign-in link"}
          </button>
        </form>

        <div className="note" style={{ marginTop: 14, textAlign: "center" }}>
          Don't have an account? Just enter your email — one will be created automatically when you purchase.
        </div>

        <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "#6b7280", borderTop: "1px solid #1f2937", paddingTop: 14 }}>
          By continuing, you agree to our{" "}
          <a href="/terms" style={{ color: "#60a5fa", textDecoration: "underline" }}>Terms of Service</a>
          {" "}and{" "}
          <a href="/privacy" style={{ color: "#60a5fa", textDecoration: "underline" }}>Privacy Policy</a>
        </div>
      </div>
    </>
  );
}
