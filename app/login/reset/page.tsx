"use client";
import { CircleCheck } from "lucide-react";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token || !email) setError("Invalid or missing reset link.");
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed.");
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", background: "var(--panel)",
    border: "1px solid var(--border-strong)", borderRadius: "10px", color: "var(--text)",
    fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  if (done) return (
    <div style={{ maxWidth: 460, margin: "48px auto", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "16px", padding: "32px 28px", boxShadow: "0 8px 40px rgba(0,0,0,0.4)", textAlign: "center" }}>
      <div style={{ marginBottom: 16, lineHeight: 0, color: "var(--text-2)" }}><CircleCheck size={40} strokeWidth={1.5} aria-hidden="true" /></div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 8px 0" }}>Password updated!</h2>
      <p style={{ fontSize: 14, color: "var(--muted)" }}>Redirecting you to sign in...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 460, margin: "48px auto", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "16px", padding: "32px 28px 24px", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 4px 0" }}>Set a new password</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 24px 0" }}>Enter your new password below.</p>

      {error && <div style={{ padding: "10px 14px", background: "#ef444420", border: "1px solid #ef444440", borderRadius: "8px", color: "var(--bad)", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>New Password</label>
          <input style={inputStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
            onFocus={e => e.target.style.borderColor = "#A3A3A3"} onBlur={e => e.target.style.borderColor = "#2E2E2E"} />
          <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "5px" }}>Minimum 8 characters</p>
        </div>
        <button type="submit" disabled={loading || !!error && !password} style={{
          width: "100%", padding: "13px", borderRadius: "10px", border: "none",
          background: loading ? "var(--panel)" : "var(--cta)",
          color: loading ? "var(--muted)" : "var(--cta-text)", fontSize: "15px", fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 4px 20px rgba(0,0,0,0)",
        }}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div style={{ padding: 40, color: "var(--muted)" }}>Loading...</div>}><ResetForm /></Suspense>;
}
