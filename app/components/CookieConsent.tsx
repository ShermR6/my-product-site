"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import Link from "next/link";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setVisible(false);
    if (posthog && posthog.__loaded) {
      posthog.opt_in_capturing();
    }
  };

  const decline = () => {
    localStorage.setItem("cookieConsent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999,
      background: "var(--panel-bg, #141414)",
      border: "1px solid var(--border, rgba(255,255,255,0.08))",
      borderRadius: 12,
      padding: "14px 20px",
      display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px 20px",
      maxWidth: 680, width: "calc(100vw - 32px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", flex: 1, minWidth: 200, lineHeight: 1.6 }}>
        We use cookies and analytics to improve your experience. See our{" "}
        <Link href="/privacy" style={{ color: "var(--accent, #0ea5e9)" }}>Privacy Policy</Link>.
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
            background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
            color: "var(--muted)", transition: "border-color 0.15s",
          }}
        >
          Decline
        </button>
        <button
          onClick={accept}
          style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
            background: "#0ea5e9", border: "none", color: "#fff", fontWeight: 600,
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
