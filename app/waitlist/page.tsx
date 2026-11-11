"use client";

import { useState } from "react";
import type { Metadata } from "next";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "teams-waitlist" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "48px 0 64px" }}>
      <div style={{
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(0,0,0,0))",
        padding: "40px 36px",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 800, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--text)", marginBottom: 12,
        }}>
          Coming Soon
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 10px" }}>
          FinalPing for Teams
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, margin: "0 0 32px" }}>
          Multi-seat aircraft tracking for FBOs, fuel services, and flight schools.
          Join the waitlist and we&apos;ll email you the moment it launches.
        </p>

        {status === "success" ? (
          <div style={{
            padding: "20px 24px", borderRadius: 12,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
            color: "var(--good)", fontSize: 15, fontWeight: 600,
          }}>
            ✓ You&apos;re on the list! We&apos;ll reach out when Teams launches.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "12px 16px",
                borderRadius: 10, fontSize: 14, boxSizing: "border-box",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "var(--text)", outline: "none",
              }}
            />
            {status === "error" && (
              <p style={{ fontSize: 13, color: "var(--bad)", margin: 0 }}>{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                padding: "13px", borderRadius: 10, border: "none",
                background: "var(--cta)",
                color: "var(--cta-text)", fontSize: 14, fontWeight: 700, cursor: "pointer",
                opacity: status === "loading" ? 0.7 : 1,
              }}
            >
              {status === "loading" ? "Joining…" : "Notify me at launch →"}
            </button>
          </form>
        )}

        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 20 }}>
          No spam. One email when it&apos;s ready.
        </p>
      </div>
    </div>
  );
}
