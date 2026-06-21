"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "credentials" | "method-select" | "enter-code";

export default function LoginForm() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const router = useRouter();

  // 2FA state
  const [step, setStep] = useState<Step>("credentials");
  const [twoFAMethods, setTwoFAMethods] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

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

    try {
      const res = await fetch("/api/auth/pre-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (!data.requires2FA) {
        // No 2FA — sign in directly
        const result = await signIn("credentials", { email, password, redirect: false });
        setLoading(false);
        if (rememberMe && !result?.error) {
          document.cookie = "next-auth.remember-me=true; max-age=2592000; path=/";
        }
        if (result?.error) {
          setError("Invalid email or password.");
        } else {
          router.push("/dashboard");
        }
        return;
      }

      // 2FA required
      setTwoFAMethods(data.methods);
      setLoading(false);

      if (data.methods.length === 1) {
        await selectMethod(data.methods[0]);
      } else {
        setStep("method-select");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const selectMethod = async (method: string) => {
    setSelectedMethod(method);
    setError("");
    setCode("");
    setCodeSent(false);

    if (method === "totp") {
      setStep("enter-code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-2fa-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send code.");
        setLoading(false);
        return;
      }
      setCodeSent(true);
      setStep("enter-code");
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) { setError("Enter the 6-digit code."); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/complete-2fa-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code, method: selectedMethod }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", { email, loginToken: data.loginToken, redirect: false });
      setLoading(false);
      if (result?.error) {
        setError("Verification failed. Please try again.");
      } else {
        if (rememberMe) {
          document.cookie = "next-auth.remember-me=true; max-age=2592000; path=/";
        }
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }
      const result = await signIn("credentials", { email, password, redirect: false });
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

  const resetToCredentials = () => {
    setStep("credentials");
    setTwoFAMethods([]);
    setSelectedMethod("");
    setCode("");
    setCodeSent(false);
    setError("");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", background: "#111827",
    border: "1px solid #374151", borderRadius: "10px", color: "#f9fafb",
    fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  const methodLabel: Record<string, string> = {
    email: "✉️  Email",
    sms: "📲  SMS",
    totp: "🔐  Authenticator App",
  };

  return (
    <div style={{
      maxWidth: 460, margin: "48px auto", background: "#0f1117",
      border: "1px solid #1f2937", borderRadius: "16px",
      padding: "32px 28px 24px", boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
    }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f9fafb", margin: "0 0 4px 0" }}>Welcome</h2>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px 0" }}>Sign in or create an account to get started</p>

      {/* Tabs — only show on credentials step */}
      {step === "credentials" && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          background: "#1f2937", borderRadius: "10px",
          padding: "4px", marginBottom: "24px",
        }}>
          {(["signin", "signup"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); setAgreedToTerms(false); }}
              style={{
                padding: "9px", borderRadius: "8px", border: "none",
                background: tab === t ? "#111827" : "transparent",
                color: tab === t ? "#f9fafb" : "#6b7280",
                fontWeight: tab === t ? 600 : 400, fontSize: "14px",
                cursor: "pointer", transition: "all 0.15s",
              }}>
              {t === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div style={{
          padding: "10px 14px", background: "#ef444420", border: "1px solid #ef444440",
          borderRadius: "8px", color: "#fca5a5", fontSize: "13px", marginBottom: "16px",
        }}>
          {error}
        </div>
      )}

      {/* ── CREDENTIALS STEP ── */}
      {step === "credentials" && (
        <>
          <button type="button" onClick={handleGoogleSignIn} style={{
            width: "100%", padding: "11px", borderRadius: "10px",
            border: "1px solid #374151", background: "rgba(255,255,255,0.03)",
            color: "#f9fafb", fontSize: "14px", fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            marginBottom: "16px", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#6b7280"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#374151"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ flex: 1, height: "1px", background: "#1f2937" }} />
            <span style={{ fontSize: "12px", color: "#4b5563" }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "#1f2937" }} />
          </div>
        </>
      )}

      {step === "credentials" && (
        <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp}>
          {tab === "signup" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Full Name</label>
              <input style={inputStyle} type="text" placeholder="Your name" value={name}
                onChange={e => setName(e.target.value)} autoFocus
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = "#374151"} />
            </div>
          )}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Email</label>
            <input style={inputStyle} type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} required autoFocus={tab === "signin"}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#374151"} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...inputStyle, paddingRight: "42px" }}
                type={showPassword ? "text" : "password"} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = "#374151"} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "13px", padding: 0, lineHeight: 1 }}>
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
                <span style={{ fontSize: 11, color: strengthColor[strength] || "#6b7280" }}>{strengthLabel[strength] || "Too weak"}</span>
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
              <div onClick={() => setRememberMe(r => !r)} style={{
                width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0,
                border: `2px solid ${rememberMe ? "#0ea5e9" : "#374151"}`,
                background: rememberMe ? "#0ea5e9" : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>
                {rememberMe && <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>✓</span>}
              </div>
              <span onClick={() => setRememberMe(r => !r)} style={{ fontSize: "13px", color: "#9ca3af", cursor: "pointer", userSelect: "none" as const }}>
                Remember me for 30 days
              </span>
            </div>
          )}

          {tab === "signup" && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "16px" }}>
              <div onClick={() => setAgreedToTerms(v => !v)} style={{
                width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0, marginTop: "1px",
                border: `2px solid ${agreedToTerms ? "#0ea5e9" : "#374151"}`,
                background: agreedToTerms ? "#0ea5e9" : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>
                {agreedToTerms && <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>✓</span>}
              </div>
              <span onClick={() => setAgreedToTerms(v => !v)} style={{ fontSize: "13px", color: "#9ca3af", cursor: "pointer", userSelect: "none" as const, lineHeight: "1.5" }}>
                I agree to the{" "}
                <a href="/terms" onClick={e => e.stopPropagation()} style={{ color: "#60a5fa", textDecoration: "underline" }}>Terms of Service</a>
                {" "}and{" "}
                <a href="/privacy" onClick={e => e.stopPropagation()} style={{ color: "#60a5fa", textDecoration: "underline" }}>Privacy Policy</a>
              </span>
            </div>
          )}

          <button type="submit" disabled={loading || (tab === "signup" && !agreedToTerms)} style={{
            width: "100%", padding: "13px", borderRadius: "10px", border: "none",
            background: loading || (tab === "signup" && !agreedToTerms) ? "#1f2937" : "linear-gradient(135deg, #0ea5e9, #0284c7)",
            color: loading || (tab === "signup" && !agreedToTerms) ? "#6b7280" : "#fff", fontSize: "15px", fontWeight: 600,
            cursor: loading || (tab === "signup" && !agreedToTerms) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            boxShadow: loading || (tab === "signup" && !agreedToTerms) ? "none" : "0 4px 20px rgba(14,165,233,0.3)",
            transition: "all 0.2s",
          }}>
            {loading ? "Please wait..." : tab === "signin" ? "🔒  Sign In" : "Create Account"}
          </button>
        </form>
      )}

      {/* ── METHOD SELECT STEP ── */}
      {step === "method-select" && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Two-factor verification</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Choose how you'd like to verify your identity:</div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {twoFAMethods.map(m => (
              <button key={m} onClick={() => selectMethod(m)} disabled={loading}
                style={{
                  padding: "13px 16px", borderRadius: "10px", border: "1px solid #374151",
                  background: "rgba(255,255,255,0.03)", color: "#f9fafb",
                  fontSize: "14px", fontWeight: 600, textAlign: "left" as const,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1, transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.background = "rgba(14,165,233,0.08)"; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#374151"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                {methodLabel[m] ?? m}
              </button>
            ))}
          </div>
          <button onClick={resetToCredentials} style={{ marginTop: 12, background: "none", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", padding: 0 }}>
            ← Back
          </button>
        </div>
      )}

      {/* ── ENTER CODE STEP ── */}
      {step === "enter-code" && (
        <form onSubmit={handleVerifyCode}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            {selectedMethod === "totp" ? "Enter authenticator code" : "Enter verification code"}
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
            {selectedMethod === "totp"
              ? "Open your authenticator app and enter the 6-digit code."
              : codeSent
                ? `Code sent to your ${selectedMethod === "email" ? "email" : "phone"}.`
                : "Sending code..."}
          </div>

          <input type="text" inputMode="numeric" maxLength={6} value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000" autoFocus
            style={{ ...inputStyle, letterSpacing: "0.3em", fontSize: 22, fontWeight: 700, textAlign: "center" as const, marginBottom: 16 }}
            onFocus={e => e.target.style.borderColor = "#3b82f6"}
            onBlur={e => e.target.style.borderColor = "#374151"} />

          <button type="submit" disabled={loading || code.length < 6} style={{
            width: "100%", padding: "13px", borderRadius: "10px", border: "none",
            background: loading || code.length < 6 ? "#1f2937" : "linear-gradient(135deg, #0ea5e9, #0284c7)",
            color: loading || code.length < 6 ? "#6b7280" : "#fff",
            fontSize: "15px", fontWeight: 600,
            cursor: loading || code.length < 6 ? "not-allowed" : "pointer",
            boxShadow: loading || code.length < 6 ? "none" : "0 4px 20px rgba(14,165,233,0.3)",
            transition: "all 0.2s",
          }}>
            {loading ? "Verifying..." : "Verify & Sign In"}
          </button>

          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            {selectedMethod !== "totp" && (
              <button type="button" onClick={() => selectMethod(selectedMethod)}
                style={{ background: "none", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", padding: 0 }}>
                Resend code
              </button>
            )}
            <button type="button" onClick={twoFAMethods.length > 1 ? () => setStep("method-select") : resetToCredentials}
              style={{ background: "none", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", padding: 0 }}>
              ← Back
            </button>
          </div>
        </form>
      )}

      {step === "credentials" && tab === "signin" && (
        <div style={{ textAlign: "center", marginTop: "14px" }}>
          <a href="/login/forgot" style={{ fontSize: "13px", color: "#6b7280", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#9ca3af")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}>
            Forgot your password?
          </a>
        </div>
      )}

      {step === "credentials" && tab === "signin" && (
        <div style={{
          marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #1f2937",
          textAlign: "center", fontSize: "12px", color: "#6b7280",
        }}>
          By signing in, you agree to our{" "}
          <a href="/terms" style={{ color: "#60a5fa", textDecoration: "underline" }}>Terms of Service</a>
          {" "}and{" "}
          <a href="/privacy" style={{ color: "#60a5fa", textDecoration: "underline" }}>Privacy Policy</a>
        </div>
      )}
    </div>
  );
}
