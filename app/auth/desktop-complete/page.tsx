"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function DesktopCompleteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const error = searchParams.get("error");
  const [status, setStatus] = useState<"opening" | "error">("opening");

  useEffect(() => {
    if (error || !token || !email) {
      setStatus("error");
      return;
    }
    const scheme = searchParams.get("scheme") || "finalpingapp";
    const deepLink = `${scheme}://auth?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    window.location.href = deepLink;
  }, [token, email, error, searchParams]);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "80px 24px", fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "20px",
        padding: "48px 40px", maxWidth: "420px", width: "100%",
        textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        {/* Logo */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "4px" }}>
            Aircraft Alerts
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
            FinalPing
          </div>
          <div style={{ width: "40px", height: "2px", background: "linear-gradient(90deg, var(--cta), transparent)", borderRadius: "999px", margin: "6px auto 0" }} />
        </div>

        {status === "error" ? (
          <>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="#F87171" strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px 0" }}>Sign-in failed</h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 28px 0", lineHeight: 1.6 }}>
              Something went wrong during Google sign-in. Please close this tab and try again.
            </p>
          </>
        ) : (
          <>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="#FAFAFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px 0" }}>Signed in successfully</h2>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 6px 0", lineHeight: 1.6 }}>
              FinalPing should open automatically. You can close this tab.
            </p>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 28px 0", lineHeight: 1.6 }}>
              If the app didn&apos;t open, make sure FinalPing is installed and try again.
            </p>
          </>
        )}

        <Link href="/" style={{
          display: "inline-block", fontSize: "13px", color: "var(--text)",
          textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.22)",
          paddingBottom: "1px",
        }}>
          Back to finalpingapp.com
        </Link>
      </div>
    </div>
  );
}

export default function DesktopCompletePage() {
  return (
    <Suspense fallback={null}>
      <DesktopCompleteContent />
    </Suspense>
  );
}
