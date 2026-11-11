"use client";
import { MailCheck } from "lucide-react";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    background: "var(--panel)",
    border: "1px solid var(--border-strong)",
    borderRadius: "10px",
    color: "var(--text)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  if (sent) {
    return (
      <div style={{
        maxWidth: 460, margin: "48px auto",
        background: "var(--panel)", border: "1px solid var(--border)",
        borderRadius: "16px", padding: "32px 28px 24px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4)", textAlign: "center",
      }}>
        <div style={{ marginBottom: 16, lineHeight: 0, color: "var(--text-2)" }}><MailCheck size={40} strokeWidth={1.5} aria-hidden="true" /></div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 8px 0" }}>Check your email</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 24px 0" }}>
          If an account exists for <strong style={{ color: "var(--muted)" }}>{email}</strong>, we sent a password reset link. Check your spam folder if you don't see it.
        </p>
        <a href="/login" style={{
          display: "inline-block", padding: "11px 24px",
          background: "var(--cta)",
          color: "var(--cta-text)", borderRadius: "10px", fontSize: "14px",
          fontWeight: 600, textDecoration: "none",
        }}>
          Back to Sign In
        </a>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 460, margin: "48px auto",
      background: "var(--panel)", border: "1px solid var(--border)",
      borderRadius: "16px", padding: "32px 28px 24px",
      boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
    }}>
      <a href="/login" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
        ← Back to Sign In
      </a>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 4px 0" }}>Reset your password</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 24px 0" }}>Enter your email and we'll send you a reset link.</p>

      {error && (
        <div style={{
          padding: "10px 14px", background: "#ef444420", border: "1px solid #ef444440",
          borderRadius: "8px", color: "var(--bad)", fontSize: "13px", marginBottom: "16px",
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
            Email
          </label>
          <input
            style={inputStyle}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            onFocus={e => e.target.style.borderColor = "#A3A3A3"}
            onBlur={e => e.target.style.borderColor = "#2E2E2E"}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", padding: "13px", borderRadius: "10px", border: "none",
            background: loading ? "var(--panel)" : "var(--cta)",
            color: loading ? "var(--muted)" : "var(--cta-text)", fontSize: "15px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 4px 20px rgba(0,0,0,0)",
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
