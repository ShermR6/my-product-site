"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verify") === "1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await signIn("email", { email, redirect: false });
      if (res?.error) {
        setError("Something went wrong. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (justVerified || sent) {
    return (
      <div className="panel" style={{ maxWidth: 480, margin: "40px auto", textAlign: "center", padding: "48px 32px" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
        <h2 style={{ margin: "0 0 10px" }}>Check your email</h2>
        <p style={{ margin: 0 }}>
          We sent a sign-in link to <strong>{email || "your email"}</strong>. Click the link to log in — no password needed.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1>Log in</h1>
      <p>Enter your email and we'll send you a sign-in link.</p>

      <div className="panel-white" style={{ maxWidth: 480, marginTop: 18 }}>
        {error && (
          <div style={{
            padding: "10px 14px",
            background: "rgba(255,71,87,0.1)",
            border: "1px solid rgba(255,71,87,0.3)",
            borderRadius: 8,
            color: "#ff4757",
            fontSize: 13,
            marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label style={{ color: "#555" }}>Email address</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ background: "#f9f9f9" }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-solid"
            style={{ width: "100%", marginTop: 4 }}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send sign-in link"}
          </button>
        </form>

        <div className="note" style={{ textAlign: "center", marginTop: 14 }}>
          Don't have a license yet?{" "}
          <a href="/pricing" style={{ color: "#000", fontWeight: 600 }}>View pricing</a>
        </div>
      </div>
    </>
  );
}
