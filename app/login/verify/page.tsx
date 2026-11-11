import { MailCheck } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="panel" style={{ maxWidth: 480, margin: "40px auto", textAlign: "center", padding: 32 }}>
      <div style={{ marginBottom: 12, lineHeight: 0, color: "var(--text-2)" }}><MailCheck size={32} strokeWidth={1.5} aria-hidden="true" /></div>
      <h2 style={{ marginBottom: 8 }}>Check your email</h2>
      <p>We sent a sign-in link to your email. Click it to sign in.</p>
    </div>
  );
}