"use client";

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
    width: "100%", padding: "11px 14px", background: "#111827",
    border: "1px solid #374151", borderRadius: "10px", color: "#f9fafb",
    fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  if (done) return (
    <div style={{ maxWidth: 460, margin: "48px auto", background: "#0f1117", border: "1px solid #1f2937", borderRadius: "16px", padding: "32px 28px", boxShadow: "0 8px 40px rgba(0,0,0,0.4)", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f9fafb", margin: "0 0 8px 0" }}>Password updated!</h2>
      <p style={{ fontSize: 14, color: "#6b7280" }}>Redirecting you to sign in...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 460, margin: "48px auto", background: "#0f1117", border: "1px solid #1f2937", borderRadius: "16px", padding: "32px 28px 24px", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f9fafb", margin: "0 0 4px 0" }}>Set a new password</h2>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px 0" }}>Enter your new password below.</p>

      {error && <div style={{ padding: "10px 14px", background: "#ef444420", border: "1px solid #ef444440", borderRadius: "8px", color: "#fca5a5", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>New Password</label>
          <input style={inputStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
            onFocus={e => e.target.style.borderColor = "#3b82f6"} onBlur={e => e.target.style.borderColor = "#374151"} />
          <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "5px" }}>Minimum 8 characters</p>
        </div>
        <button type="submit" disabled={loading || !!error && !password} style={{
          width: "100%", padding: "13px", borderRadius: "10px", border: "none",
          background: loading ? "#1f2937" : "linear-gradient(135deg, #0ea5e9, #0284c7)",
          color: loading ? "#6b7280" : "#fff", fontSize: "15px", fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 4px 20px rgba(14,165,233,0.3)",
        }}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div style={{ padding: 40, color: "#6b7280" }}>Loading...</div>}><ResetForm /></Suspense>;
}
