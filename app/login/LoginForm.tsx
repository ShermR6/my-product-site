"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }
      // Auto sign in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      setLoading(false);
      if (result?.error) {
        setError("Account created. Please sign in.");
        setTab("signin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    background: "#111827",
    border: "1px solid #374151",
    borderRadius: "10px",
    color: "#f9fafb",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div style={{
      maxWidth: 460,
      margin: "48px auto",
      background: "#0f1117",
      border: "1px solid #1f2937",
      borderRadius: "16px",
      padding: "32px 28px 24px",
      boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
    }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f9fafb", margin: "0 0 4px 0" }}>Welcome</h2>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px 0" }}>Sign in or create an account to get started</p>

      {/* Tabs */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        background: "#1f2937", borderRadius: "10px",
        padding: "4px", marginBottom: "24px",
      }}>
        {(["signin", "signup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(""); }}
            style={{
              padding: "9px",
              borderRadius: "8px",
              border: "none",
              background: tab === t ? "#111827" : "transparent",
              color: tab === t ? "#f9fafb" : "#6b7280",
              fontWeight: tab === t ? 600 : 400,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {t === "signin" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          padding: "10px 14px", background: "#ef444420", border: "1px solid #ef444440",
          borderRadius: "8px", color: "#fca5a5", fontSize: "13px", marginBottom: "16px",
        }}>
          {error}
        </div>
      )}

      <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
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
            onFocus={e => e.target.style.borderColor = "#3b82f6"}
            onBlur={e => e.target.style.borderColor = "#374151"}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
            Password
          </label>
          <input
            style={inputStyle}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            onFocus={e => e.target.style.borderColor = "#3b82f6"}
            onBlur={e => e.target.style.borderColor = "#374151"}
          />
          {tab === "signup" && (
            <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "5px" }}>Minimum 8 characters</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "10px",
            border: "none",
            background: loading ? "#1f2937" : "linear-gradient(135deg, #0ea5e9, #0284c7)",
            color: loading ? "#6b7280" : "#fff",
            fontSize: "15px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: loading ? "none" : "0 4px 20px rgba(14,165,233,0.3)",
            transition: "all 0.2s",
          }}
        >
          {loading ? "Please wait..." : tab === "signin" ? "🔒  Sign In" : "Create Account"}
        </button>
      </form>

      {tab === "signin" && (
        <div style={{ textAlign: "center", marginTop: "14px" }}>
          <a
            href="/login/forgot"
            style={{ fontSize: "13px", color: "#6b7280", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#9ca3af")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
          >
            Forgot your password?
          </a>
        </div>
      )}

      <div style={{
        marginTop: "20px", paddingTop: "16px",
        borderTop: "1px solid #1f2937",
        textAlign: "center", fontSize: "12px", color: "#6b7280",
      }}>
        By continuing, you agree to our{" "}
        <a href="/terms" style={{ color: "#60a5fa", textDecoration: "underline" }}>Terms of Service</a>
        {" "}and{" "}
        <a href="/privacy" style={{ color: "#60a5fa", textDecoration: "underline" }}>Privacy Policy</a>
      </div>
    </div>
  );
}
