// app/components/NewsletterSignup.tsx
"use client";

import { useState } from "react";

export default function NewsletterSignup({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "newsletter" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const inputBg = dark ? "rgba(255,255,255,0.06)" : "var(--panel)";
  const inputBorder = dark ? "rgba(255,255,255,0.12)" : "var(--border)";
  const inputText = dark ? "#fff" : "var(--text)";

  if (status === "success") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 13, fontWeight: 600,
        color: dark ? "#4ADE80" : "var(--good)",
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        You&apos;re subscribed — check your inbox.
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ position: "relative", maxWidth: 320 }}>
      <input
        type="email"
        required
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email address"
        style={{
          width: "100%", padding: "11px 48px 11px 14px",
          borderRadius: 12, border: `1px solid ${inputBorder}`,
          background: inputBg, color: inputText,
          fontSize: 13, fontFamily: "inherit", outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        aria-label="Subscribe"
        style={{
          position: "absolute", right: 5, top: 5,
          width: 32, height: 32, borderRadius: "50%",
          border: "none", background: "#0EA5E9", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: status === "loading" ? "wait" : "pointer",
          opacity: status === "loading" ? 0.6 : 1,
          transition: "transform .15s, opacity .15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
      </button>
      {status === "error" && (
        <div style={{ fontSize: 12, color: dark ? "#F87171" : "var(--bad)", marginTop: 8 }}>{error}</div>
      )}
    </form>
  );
}
