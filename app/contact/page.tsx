// app/contact/page.tsx
"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to send");
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <h1>Contact us</h1>
      <p>Questions about licensing, installation, or support? Send a message.</p>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="panel-white">
          <h2 style={{ marginBottom: 6 }}>Send a message</h2>

          {status === "sent" ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <h3 style={{ marginBottom: 8 }}>Message sent!</h3>
              <p style={{ color: "#555", fontSize: 14 }}>
                We'll get back to you within 1 business day.
              </p>
              <p style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
                Please check your spam or junk folder if you don't see our reply.
              </p>
              <button
                className="btn btn-outline"
                style={{ marginTop: 16 }}
                onClick={() => setStatus("idle")}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Name</label>
                <input
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label>Message</label>
                <textarea
                  placeholder="How can we help?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={5}
                />
              </div>

              {status === "error" && (
                <div style={{
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8,
                  color: "#dc2626",
                  fontSize: 13,
                  marginBottom: 14,
                }}>
                  Something went wrong. Please try again.
                </div>
              )}

              <button
                type="submit"
                className="btn btn-solid"
                style={{ width: "100%" }}
                disabled={status === "sending"}
              >
                {status === "sending" ? "Sending..." : "Send message"}
              </button>
            </form>
          )}
        </div>

        <div className="panel-white">
          <h2 style={{ marginBottom: 6 }}>Other ways to reach us</h2>

          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, marginTop: 10 }}>Email</div>
            <div>support@skyping.xyz</div>

            <div style={{ fontWeight: 700, marginTop: 10 }}>Hours</div>
            <div>Mon–Fri, 9am–5pm CT</div>

            <div style={{ fontWeight: 700, marginTop: 10 }}>Response time</div>
            <div>Usually within 1 business day</div>
          </div>
        </div>
      </div>
    </>
  );
}
