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
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const pwStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#0ea5e9", "#23c76b"];
  const strength = tab === "signup" ? pwStrength(password) : 0;

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
    if (rememberMe && !result?.error) {
      document.cookie = "next-auth.remember-me=true; max-age=2592000; path=/";
    }
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
          <div style={{ position: "relative" }}>
            <input
              style={{ ...inputStyle, paddingRight: "42px" }}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#374151"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "13px", padding: 0, lineHeight: 1 }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {tab === "signup" && password.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: strength >= i ? strengthColor[strength] : "#374151", transition: "background 0.2s" }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: strengthColor[strength] || "#6b7280" }}>{strengthLabel[strength] || "Too weak"}</span>
              </div>
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column" as const, gap: 2 }}>
                {[
                  { label: "8+ characters", met: password.length >= 8 },
                  { label: "Uppercase letter", met: /[A-Z]/.test(password) },
                  { label: "Number", met: /[0-9]/.test(password) },
                ].map(r => (
                  <span key={r.label} style={{ fontSize: 11, color: r.met ? "#23c76b" : "#6b7280" }}>
                    {r.met ? "✓" : "○"} {r.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {tab === "signin" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div
              onClick={() => setRememberMe(r => !r)}
              style={{
                width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0,
                border: `2px solid ${rememberMe ? "#0ea5e9" : "#374151"}`,
                background: rememberMe ? "#0ea5e9" : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              {rememberMe && <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>✓</span>}
            </div>
            <span
              onClick={() => setRememberMe(r => !r)}
              style={{ fontSize: "13px", color: "#9ca3af", cursor: "pointer", userSelect: "none" as const }}
            >
              Remember me for 30 days
            </span>
          </div>
        )}

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
