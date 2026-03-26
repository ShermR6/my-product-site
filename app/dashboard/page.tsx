"use client";
// app/dashboard/page.tsx

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

type License = {
  id: string; licenseKey: string; tier: string; status: string;
  activatedAt: string | null; expiresAt: string | null; createdAt: string;
};
type NotificationLog = {
  id: string; aircraft_tail: string; alert_type: string; message: string;
  integration_type: string; status: string; sent_at: string;
};
type TwoFAStatus = { email: boolean; sms: boolean; totp: boolean; phone: string | null; };

const tierLabels: Record<string, string> = {
  starter: "Starter", premium: "Premium", pro: "Pro",
  "team-starter": "Team Starter", "team-premium": "Team Premium", "team-pro": "Team Pro",
};
const CHANNEL_ICONS: Record<string, string> = { discord: "💬", slack: "📱", teams: "👥", email: "✉️", sms: "📲", whatsapp: "🟢" };
const CHANNEL_COLORS: Record<string, string> = { discord: "#5865f2", slack: "#4a154b", teams: "#6264a7", email: "#0ea5e9", sms: "#10b981", whatsapp: "#25d366" };

function getLicenseStatus(license: License) {
  if (license.status === "expired") return { label: "Expired", color: "#ef4444" };
  if (license.status === "inactive" || !license.activatedAt) return { label: "Not Activated", color: "#f59e0b" };
  if (license.expiresAt) {
    const now = new Date(); const expires = new Date(license.expiresAt);
    if (now > expires) return { label: "Expired", color: "#ef4444" };
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) return { label: `Expiring in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`, color: "#f59e0b" };
    return { label: `Active — ${daysLeft} days left`, color: "#23c76b" };
  }
  return { label: "Active", color: "#23c76b" };
}
function formatAlertType(type: string) { return type === "landing" ? "🛬 Landing" : `📍 ${type} out`; }
function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
function exportToTxt(logs: NotificationLog[]) {
  const header = `FinalPing Alert History Export\nExported: ${new Date().toLocaleString()}\nTotal Alerts: ${logs.length}\n${"=".repeat(80)}\n\n`;
  const rows = logs.map(l => `[${formatDate(l.sent_at)}] ${l.aircraft_tail} — ${l.alert_type} — ${l.integration_type} — ${l.status}\n  ${l.message}`).join("\n\n");
  const blob = new Blob([header + rows], { type: "text/plain" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = `finalping-alerts-${new Date().toISOString().slice(0, 10)}.txt`; a.click(); URL.revokeObjectURL(url);
}

function StatusMsg({ msg }: { msg: { text: string; type: "success" | "error" } | null }) {
  if (!msg) return null;
  return (
    <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, fontSize: 13,
      background: msg.type === "success" ? "rgba(35,199,107,0.1)" : "rgba(239,68,68,0.1)",
      color: msg.type === "success" ? "#23c76b" : "#ef4444",
      border: `1px solid ${msg.type === "success" ? "rgba(35,199,107,0.3)" : "rgba(239,68,68,0.3)"}` }}>
      {msg.text}
    </div>
  );
}

function CodeInput({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit?: () => void }) {
  return (
    <input type="text" inputMode="numeric" maxLength={6} value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      onKeyDown={e => { if (e.key === "Enter" && onSubmit) onSubmit(); }}
      placeholder="000000"
      style={{ ...styles.input, letterSpacing: "0.3em", fontSize: 20, fontWeight: 700, textAlign: "center" as const }}
      onFocus={e => { e.currentTarget.style.borderColor = "#0ea5e9"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }} />
  );
}

function AccountTab({ email, session }: { email: string; session: any }) {
  return (
    <div>
      <div style={styles.tabHeader}><h2 style={styles.tabTitle}>Account Information</h2><p style={styles.tabSub}>Your profile and account details</p></div>
      <div style={styles.card}>
        <div style={styles.infoRow}><span style={styles.infoLabel}>Email Address</span><span style={styles.infoValue}>{email}</span></div>
        <div style={styles.infoRowLast}><span style={styles.infoLabel}>Member Since</span>
          <span style={styles.infoValue}>{session?.user?.createdAt ? new Date(session.user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}</span>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => signOut({ callbackUrl: "/" })} style={styles.dangerBtn}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}>Sign Out</button>
      </div>
    </div>
  );
}

function LicensesTab({ licenses, loading }: { licenses: License[]; loading: boolean }) {
  if (loading) return <div style={styles.loadingText}>Loading licenses...</div>;
  return (
    <div>
      <div style={styles.tabHeader}><h2 style={styles.tabTitle}>Your Licenses</h2><p style={styles.tabSub}>All license keys associated with your account</p></div>
      {licenses.length === 0 ? (
        <div style={{ ...styles.card, textAlign: "center" as const, padding: "40px 24px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
          <p style={{ color: "var(--muted)", margin: "0 0 16px" }}>No licenses yet.</p>
          <Link href="/pricing" style={styles.outlineBtn}>Browse Plans</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
          {licenses.map(license => {
            const s2 = getLicenseStatus(license);
            return (
              <div key={license.id} style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={styles.tierBadge}>{tierLabels[license.tier] ?? license.tier} LICENSE</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: s2.color }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: s2.color, display: "inline-block" }} />{s2.label}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 28, flexWrap: "wrap" as const }}>
                  <div><div style={styles.metaLabel}>License Key</div><div style={styles.licenseKey}>{license.licenseKey}</div></div>
                  <div><div style={styles.metaLabel}>Purchased</div><div style={styles.metaValue}>{new Date(license.createdAt).toLocaleDateString()}</div></div>
                  {license.activatedAt && <div><div style={styles.metaLabel}>Activated</div><div style={styles.metaValue}>{new Date(license.activatedAt).toLocaleDateString()}</div></div>}
                  {license.expiresAt && <div><div style={styles.metaLabel}>Expires</div><div style={styles.metaValue}>{new Date(license.expiresAt).toLocaleDateString()}</div></div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AlertsTab({ email }: { email: string }) {
  const [logs, setLogs] = useState<NotificationLog[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(false);
  useEffect(() => { fetch("/api/alerts-proxy").then(r => r.json()).then(d => setLogs(Array.isArray(d) ? d : [])).catch(() => setError(true)).finally(() => setLoading(false)); }, []);
  const now = new Date(); const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart); weekStart.setDate(todayStart.getDate() - todayStart.getDay());
  if (loading) return <div style={styles.loadingText}>Loading alert history...</div>;
  return (
    <div>
      <div style={{ ...styles.tabHeader, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div><h2 style={styles.tabTitle}>Alert History</h2><p style={styles.tabSub}>All notifications sent by the cloud tracker</p></div>
        {logs.length > 0 && <button onClick={() => exportToTxt(logs)} style={styles.exportBtn} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}>⬇ Export .txt</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[{ label: "Today", value: logs.filter(l => new Date(l.sent_at) >= todayStart).length }, { label: "This Week", value: logs.filter(l => new Date(l.sent_at) >= weekStart).length }, { label: "All Time", value: logs.length }].map(s => (
          <div key={s.label} style={styles.statCard}><div style={styles.statLabel}>{s.label}</div><div style={styles.statValue}>{s.value}</div></div>
        ))}
      </div>
      {error ? <div style={{ ...styles.card, textAlign: "center" as const, color: "var(--muted)" }}>Could not load alert history.</div>
        : logs.length === 0 ? <div style={{ ...styles.card, textAlign: "center" as const, padding: "40px 24px" }}><div style={{ fontSize: 32, marginBottom: 12 }}>📭</div><p style={{ color: "var(--muted)", margin: 0 }}>No alerts yet.</p></div>
        : <div style={styles.card}>
            <div style={styles.tableHeader}><div>Aircraft</div><div>Message</div><div>Type</div><div>Channel</div><div>Status</div><div>Time</div></div>
            {logs.map((log, i) => (
              <div key={log.id} style={{ ...styles.tableRow, borderBottom: i < logs.length - 1 ? "1px solid var(--border)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>{log.aircraft_tail}</div>
                <div style={{ color: "var(--muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{log.message}</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{formatAlertType(log.alert_type)}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span>{CHANNEL_ICONS[log.integration_type] ?? "🔔"}</span><span style={{ fontSize: 11, fontWeight: 700, color: CHANNEL_COLORS[log.integration_type] ?? "var(--muted)", textTransform: "capitalize" as const }}>{log.integration_type}</span></div>
                <div><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: log.status === "sent" ? "rgba(35,199,107,0.15)" : "rgba(239,68,68,0.15)", color: log.status === "sent" ? "#23c76b" : "#ef4444", border: `1px solid ${log.status === "sent" ? "rgba(35,199,107,0.3)" : "rgba(239,68,68,0.3)"}` }}>{log.status === "sent" ? "Sent" : "Failed"}</span></div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{formatDate(log.sent_at)}</div>
              </div>
            ))}
          </div>}
    </div>
  );
}

function BillingTab({ onManageBilling, portalLoading, portalError }: { onManageBilling: () => void; portalLoading: boolean; portalError: string }) {
  return (
    <div>
      <div style={styles.tabHeader}><h2 style={styles.tabTitle}>Billing & Subscription</h2><p style={styles.tabSub}>Manage your payment methods, invoices, and plan</p></div>
      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 16 }}>
          <div><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Stripe Billing Portal</div><div style={{ fontSize: 13, color: "var(--muted)" }}>Update payment methods, download invoices, or cancel your subscription.</div></div>
          <button onClick={onManageBilling} disabled={portalLoading} style={{ ...styles.primaryBtn, opacity: portalLoading ? 0.6 : 1, cursor: portalLoading ? "not-allowed" : "pointer" }} onMouseEnter={e => { if (!portalLoading) e.currentTarget.style.background = "#0284c7"; }} onMouseLeave={e => { e.currentTarget.style.background = "#0ea5e9"; }}>{portalLoading ? "Opening..." : "Manage Subscription →"}</button>
        </div>
        {portalError && <p style={{ fontSize: 13, color: "#ef4444", margin: "12px 0 0" }}>{portalError}</p>}
      </div>
      <div style={{ ...styles.card, marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Need a different plan?</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>View all available plans and pricing options.</div>
        <Link href="/pricing" style={styles.outlineBtn}>View Pricing →</Link>
      </div>
    </div>
  );
}

type PwStep = "form" | "choose-method" | "enter-code" | "totp-code" | "done";
type SetupStep = "idle" | "enter-phone" | "enter-code" | "totp-scan" | "totp-verify";

function TwoFAMethodRow({ label, enabled, onDisable }: { label: string; enabled: boolean; onDisable: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", background: enabled ? "#23c76b" : "#374151", boxShadow: enabled ? "0 0 6px #23c76b" : "none" }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      </div>
      {enabled ? (
        <button onClick={onDisable} style={styles.smallDangerBtn} onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}>Disable</button>
      ) : <span style={{ fontSize: 12, color: "var(--muted)" }}>Not enabled</span>}
    </div>
  );
}

function SecurityTab({ email }: { email: string }) {
  const [twoFA, setTwoFA] = useState<TwoFAStatus | null>(null);
  const [twoFALoading, setTwoFALoading] = useState(true);
  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [setupMethod, setSetupMethod] = useState<"email" | "sms" | "totp" | null>(null);
  const [setupPhone, setSetupPhone] = useState(""); const [setupCode, setSetupCode] = useState("");
  const [setupMsg, setSetupMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [totpUri, setTotpUri] = useState(""); const [totpSecret, setTotpSecret] = useState("");
  const [pwStep, setPwStep] = useState<PwStep>("form");
  const [newPassword, setNewPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMethod, setPwMethod] = useState<"email" | "sms" | "totp" | null>(null);
  const [pwCode, setPwCode] = useState("");
  const [pwMsg, setPwMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const load2FA = useCallback(async () => {
    setTwoFALoading(true);
    try { const r = await fetch("/api/auth/2fa/status"); if (r.ok) setTwoFA(await r.json()); } finally { setTwoFALoading(false); }
  }, []);
  useEffect(() => { load2FA(); }, [load2FA]);

  const activeMethods = twoFA ? [
    ...(twoFA.email ? [{ id: "email" as const, label: "Email" }] : []),
    ...(twoFA.sms ? [{ id: "sms" as const, label: `SMS (${twoFA.phone ?? ""})` }] : []),
    ...(twoFA.totp ? [{ id: "totp" as const, label: "Authenticator App" }] : []),
  ] : [];

  const startSetup = async (method: "email" | "sms" | "totp") => {
    setSetupMethod(method); setSetupMsg(null); setSetupCode("");
    if (method === "sms") { setSetupStep("enter-phone"); return; }
    setSetupLoading(true);
    try {
      const r = await fetch("/api/auth/2fa/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method }) });
      const d = await r.json();
      if (!r.ok) { setSetupMsg({ text: d.error, type: "error" }); return; }
      if (method === "totp") { setTotpUri(d.otpauthUrl); setTotpSecret(d.secret); setSetupStep("totp-scan"); }
      else setSetupStep("enter-code");
    } catch { setSetupMsg({ text: "Something went wrong.", type: "error" }); }
    finally { setSetupLoading(false); }
  };

  const submitPhone = async () => {
    if (!setupPhone.trim()) { setSetupMsg({ text: "Enter a phone number.", type: "error" }); return; }
    setSetupLoading(true); setSetupMsg(null);
    try {
      const r = await fetch("/api/auth/2fa/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method: "sms", phone: setupPhone.trim() }) });
      const d = await r.json();
      if (!r.ok) { setSetupMsg({ text: d.error, type: "error" }); return; }
      setSetupStep("enter-code");
    } catch { setSetupMsg({ text: "Something went wrong.", type: "error" }); }
    finally { setSetupLoading(false); }
  };

  const verifySetup = async () => {
    if (setupCode.length < 6) { setSetupMsg({ text: "Enter the 6-digit code.", type: "error" }); return; }
    setSetupLoading(true); setSetupMsg(null);
    try {
      const r = await fetch("/api/auth/2fa/verify-setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: setupCode }) });
      const d = await r.json();
      if (!r.ok) { setSetupMsg({ text: d.error, type: "error" }); return; }
      setSetupMsg({ text: `${setupMethod === "totp" ? "Authenticator" : setupMethod} 2FA enabled!`, type: "success" });
      setSetupStep("idle"); setSetupMethod(null); await load2FA();
    } catch { setSetupMsg({ text: "Something went wrong.", type: "error" }); }
    finally { setSetupLoading(false); }
  };

  const disable2FA = async (method: "email" | "sms" | "totp") => {
    if (!confirm(`Disable ${method === "totp" ? "authenticator" : method} 2FA?`)) return;
    await fetch("/api/auth/2fa/disable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method }) });
    await load2FA();
  };

  const resendCode = async (context: "setup" | "password-change") => {
    const method = context === "setup" ? setupMethod : pwMethod;
    await fetch("/api/auth/2fa/send-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method, context }) });
    context === "setup" ? setSetupMsg({ text: "New code sent.", type: "success" }) : setPwMsg({ text: "New code sent.", type: "success" });
  };

  const initiatePasswordChange = async () => {
    setPwMsg(null);
    if (!newPassword || !confirmPassword) { setPwMsg({ text: "Fill in all fields.", type: "error" }); return; }
    if (newPassword !== confirmPassword) { setPwMsg({ text: "Passwords do not match.", type: "error" }); return; }
    if (newPassword.length < 8) { setPwMsg({ text: "Password must be at least 8 characters.", type: "error" }); return; }
    if (!twoFA || activeMethods.length === 0) { setPwMsg({ text: "Set up at least one 2FA method before changing your password.", type: "error" }); return; }
    if (activeMethods.length === 1) { await sendPwCode(activeMethods[0].id); }
    else setPwStep("choose-method");
  };

  const sendPwCode = async (method: "email" | "sms" | "totp") => {
    setPwMethod(method); setPwLoading(true); setPwMsg(null);
    try {
      const r = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword, confirmPassword, method }) });
      const d = await r.json();
      if (!r.ok) { setPwMsg({ text: d.error, type: "error" }); return; }
      setPwStep(method === "totp" ? "totp-code" : "enter-code");
    } catch { setPwMsg({ text: "Something went wrong.", type: "error" }); }
    finally { setPwLoading(false); }
  };

  const confirmPasswordChange = async () => {
    if (pwCode.length < 6) { setPwMsg({ text: "Enter the 6-digit code.", type: "error" }); return; }
    setPwLoading(true); setPwMsg(null);
    try {
      const r = await fetch("/api/auth/confirm-password-change", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: pwCode }) });
      const d = await r.json();
      if (!r.ok) { setPwMsg({ text: d.error, type: "error" }); return; }
      setPwStep("done");
    } catch { setPwMsg({ text: "Something went wrong.", type: "error" }); }
    finally { setPwLoading(false); }
  };

  const resetPw = () => { setPwStep("form"); setPwMethod(null); setPwCode(""); setPwMsg(null); setNewPassword(""); setConfirmPassword(""); };

  return (
    <div>
      <div style={styles.tabHeader}><h2 style={styles.tabTitle}>Security</h2><p style={styles.tabSub}>Manage your password and two-factor authentication</p></div>

      <div style={styles.sectionLabel}>Two-Factor Authentication</div>
      <div style={styles.card}>
        {twoFALoading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading...</div> : <>
          <div style={{ marginBottom: 16 }}>
            <TwoFAMethodRow label="Email" enabled={twoFA?.email ?? false} onDisable={() => disable2FA("email")} />
            <TwoFAMethodRow label={`SMS${twoFA?.phone ? ` (${twoFA.phone})` : ""}`} enabled={twoFA?.sms ?? false} onDisable={() => disable2FA("sms")} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", background: twoFA?.totp ? "#23c76b" : "#374151", boxShadow: twoFA?.totp ? "0 0 6px #23c76b" : "none" }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Authenticator App (Google / Microsoft)</span>
              </div>
              {twoFA?.totp ? <button onClick={() => disable2FA("totp")} style={styles.smallDangerBtn} onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}>Disable</button>
                : <span style={{ fontSize: 12, color: "var(--muted)" }}>Not enabled</span>}
            </div>
          </div>

          {setupStep === "idle" && (
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Add a new 2FA method:</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                {!twoFA?.email && <button onClick={() => startSetup("email")} style={styles.smallBtn} onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.color = "#0ea5e9"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>+ Email</button>}
                {!twoFA?.sms && <button onClick={() => { setSetupMethod("sms"); setSetupStep("enter-phone"); }} style={styles.smallBtn} onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.color = "#0ea5e9"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>+ SMS</button>}
                {!twoFA?.totp && <button onClick={() => startSetup("totp")} style={styles.smallBtn} onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.color = "#0ea5e9"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>+ Authenticator</button>}
              </div>
              <StatusMsg msg={setupMsg} />
            </div>
          )}
          {setupStep === "enter-phone" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Enter your phone number</div>
              <input type="tel" value={setupPhone} onChange={e => setSetupPhone(e.target.value)} placeholder="+1 (555) 000-0000" style={{ ...styles.input, marginBottom: 8 }} onFocus={e => { e.currentTarget.style.borderColor = "#0ea5e9"; }} onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={submitPhone} disabled={setupLoading} style={{ ...styles.primaryBtn, opacity: setupLoading ? 0.6 : 1 }}>{setupLoading ? "Sending..." : "Send Code"}</button>
                <button onClick={() => setSetupStep("idle")} style={styles.ghostBtn}>Cancel</button>
              </div>
              <StatusMsg msg={setupMsg} />
            </div>
          )}
          {setupStep === "enter-code" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Enter verification code</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{setupMethod === "email" ? `Code sent to ${email}` : `Code sent to ${setupPhone}`}</div>
              <CodeInput value={setupCode} onChange={setSetupCode} onSubmit={verifySetup} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={verifySetup} disabled={setupLoading} style={{ ...styles.primaryBtn, opacity: setupLoading ? 0.6 : 1 }}>{setupLoading ? "Verifying..." : "Verify & Enable"}</button>
                <button onClick={() => resendCode("setup")} style={styles.ghostBtn}>Resend</button>
                <button onClick={() => setSetupStep("idle")} style={styles.ghostBtn}>Cancel</button>
              </div>
              <StatusMsg msg={setupMsg} />
            </div>
          )}
          {setupStep === "totp-scan" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Scan with your authenticator app</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Open Google Authenticator or Microsoft Authenticator and scan this QR code, or enter the key manually.</div>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpUri)}`} alt="TOTP QR Code" style={{ borderRadius: 8, marginBottom: 12, display: "block", background: "#fff", padding: 8 }} />
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Manual entry key:</div>
              <div style={{ fontFamily: "monospace", fontSize: 13, letterSpacing: "0.15em", background: "rgba(255,255,255,0.06)", padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", display: "inline-block", marginBottom: 16 }}>{totpSecret.match(/.{1,4}/g)?.join(" ")}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setSetupStep("totp-verify")} style={styles.primaryBtn}>Next — Enter Code</button>
                <button onClick={() => setSetupStep("idle")} style={styles.ghostBtn}>Cancel</button>
              </div>
            </div>
          )}
          {setupStep === "totp-verify" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Enter the code from your app</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Enter the 6-digit code shown in your authenticator app.</div>
              <CodeInput value={setupCode} onChange={setSetupCode} onSubmit={verifySetup} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={verifySetup} disabled={setupLoading} style={{ ...styles.primaryBtn, opacity: setupLoading ? 0.6 : 1 }}>{setupLoading ? "Verifying..." : "Verify & Enable"}</button>
                <button onClick={() => setSetupStep("totp-scan")} style={styles.ghostBtn}>Back</button>
              </div>
              <StatusMsg msg={setupMsg} />
            </div>
          )}
        </>}
      </div>

      <div style={{ ...styles.sectionLabel, marginTop: 28 }}>Change Password</div>
      <div style={styles.card}>
        {pwStep === "form" && (
          <div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>A verification code via your 2FA method will be required to confirm the change.</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
              <div><label style={styles.inputLabel}>New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" style={styles.input} onFocus={e => { e.currentTarget.style.borderColor = "#0ea5e9"; }} onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }} /></div>
              <div><label style={styles.inputLabel}>Confirm New Password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" style={styles.input} onFocus={e => { e.currentTarget.style.borderColor = "#0ea5e9"; }} onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }} /></div>
            </div>
            <StatusMsg msg={pwMsg} />
            <button onClick={initiatePasswordChange} disabled={pwLoading} style={{ ...styles.primaryBtn, marginTop: 16, opacity: pwLoading ? 0.6 : 1 }} onMouseEnter={e => { if (!pwLoading) e.currentTarget.style.background = "#0284c7"; }} onMouseLeave={e => { e.currentTarget.style.background = "#0ea5e9"; }}>{pwLoading ? "Please wait..." : "Continue →"}</button>
          </div>
        )}
        {pwStep === "choose-method" && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Choose verification method</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>Select how you'd like to verify this password change:</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {activeMethods.map(m => (
                <button key={m.id} onClick={() => sendPwCode(m.id)} style={styles.methodBtn} onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.background = "rgba(14,165,233,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                  {m.id === "email" ? "✉️" : m.id === "sms" ? "📲" : "🔐"} {m.label}
                </button>
              ))}
            </div>
            <button onClick={resetPw} style={{ ...styles.ghostBtn, marginTop: 12 }}>Cancel</button>
            <StatusMsg msg={pwMsg} />
          </div>
        )}
        {(pwStep === "enter-code" || pwStep === "totp-code") && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{pwStep === "totp-code" ? "Enter code from your authenticator app" : "Enter verification code"}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{pwStep === "totp-code" ? "Open your authenticator app and enter the 6-digit code." : pwMethod === "email" ? `Code sent to ${email}` : "Code sent to your phone"}</div>
            <CodeInput value={pwCode} onChange={setPwCode} onSubmit={confirmPasswordChange} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={confirmPasswordChange} disabled={pwLoading} style={{ ...styles.primaryBtn, opacity: pwLoading ? 0.6 : 1 }}>{pwLoading ? "Verifying..." : "Confirm Password Change"}</button>
              {pwStep !== "totp-code" && <button onClick={() => resendCode("password-change")} style={styles.ghostBtn}>Resend</button>}
              <button onClick={resetPw} style={styles.ghostBtn}>Cancel</button>
            </div>
            <StatusMsg msg={pwMsg} />
          </div>
        )}
        {pwStep === "done" && (
          <div style={{ textAlign: "center" as const, padding: "20px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Password changed successfully</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Your new password is now active.</div>
            <button onClick={resetPw} style={styles.primaryBtn}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  shell: { display: "flex", minHeight: "100vh" } as React.CSSProperties,
  sidebar: { width: 220, minWidth: 220, borderRight: "1px solid var(--border)", padding: "32px 0", display: "flex", flexDirection: "column" as const, gap: 2, background: "rgba(255,255,255,0.02)" } as React.CSSProperties,
  sidebarLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", padding: "8px 20px 4px" } as React.CSSProperties,
  navItem: (active: boolean) => ({ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "var(--text)" : "var(--muted)", background: active ? "rgba(14,165,233,0.08)" : "transparent", borderRight: active ? "2px solid #0ea5e9" : "2px solid transparent", cursor: "pointer", transition: "all 0.15s", border: "none", width: "100%", textAlign: "left" as const }),
  main: { flex: 1, padding: "40px 48px", maxWidth: 900 } as React.CSSProperties,
  tabHeader: { marginBottom: 24 } as React.CSSProperties,
  tabTitle: { fontSize: 22, fontWeight: 700, margin: "0 0 4px" } as React.CSSProperties,
  tabSub: { fontSize: 14, color: "var(--muted)", margin: 0 } as React.CSSProperties,
  sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: 8 } as React.CSSProperties,
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" } as React.CSSProperties,
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" } as React.CSSProperties,
  infoRowLast: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" } as React.CSSProperties,
  infoLabel: { fontSize: 13, color: "var(--muted)" } as React.CSSProperties,
  infoValue: { fontSize: 13, fontWeight: 600 } as React.CSSProperties,
  tierBadge: { fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: "var(--muted)", textTransform: "uppercase" as const },
  licenseKey: { fontFamily: "monospace", fontSize: 14, fontWeight: 700, background: "rgba(255,255,255,0.06)", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", letterSpacing: "0.05em", display: "inline-block" } as React.CSSProperties,
  metaLabel: { fontSize: 12, color: "var(--muted)", marginBottom: 4 } as React.CSSProperties,
  metaValue: { fontSize: 14 } as React.CSSProperties,
  statCard: { background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" } as React.CSSProperties,
  statLabel: { fontSize: 12, color: "var(--muted)", marginBottom: 4 } as React.CSSProperties,
  statValue: { fontSize: 28, fontWeight: 800 } as React.CSSProperties,
  tableHeader: { display: "grid", gridTemplateColumns: "90px 1fr 120px 100px 80px 160px", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" } as React.CSSProperties,
  tableRow: { display: "grid", gridTemplateColumns: "90px 1fr 120px 100px 80px 160px", gap: 12, padding: "13px 20px", fontSize: 13, alignItems: "center" } as React.CSSProperties,
  primaryBtn: { padding: "9px 18px", borderRadius: 8, background: "#0ea5e9", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", transition: "background 0.15s", display: "inline-block" } as React.CSSProperties,
  outlineBtn: { padding: "9px 18px", borderRadius: 8, background: "transparent", color: "var(--text)", fontSize: 13, fontWeight: 600, border: "1px solid var(--border)", cursor: "pointer", textDecoration: "none", display: "inline-block" } as React.CSSProperties,
  ghostBtn: { padding: "9px 14px", borderRadius: 8, background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 500, border: "1px solid var(--border)", cursor: "pointer" } as React.CSSProperties,
  dangerBtn: { padding: "9px 18px", borderRadius: 8, background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 13, fontWeight: 600, border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer", transition: "background 0.15s" } as React.CSSProperties,
  smallDangerBtn: { padding: "5px 12px", borderRadius: 6, background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 12, fontWeight: 600, border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer", transition: "background 0.15s" } as React.CSSProperties,
  smallBtn: { padding: "6px 14px", borderRadius: 6, background: "transparent", color: "var(--muted)", fontSize: 12, fontWeight: 600, border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.15s" } as React.CSSProperties,
  methodBtn: { padding: "12px 16px", borderRadius: 8, background: "rgba(255,255,255,0.03)", color: "var(--text)", fontSize: 13, fontWeight: 600, textAlign: "left" as const, border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.15s", width: "100%" } as React.CSSProperties,
  exportBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" as const } as React.CSSProperties,
  inputLabel: { display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 } as React.CSSProperties,
  input: { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, outline: "none", transition: "border-color 0.15s", boxSizing: "border-box" as const } as React.CSSProperties,
  loadingText: { color: "var(--muted)", fontSize: 14, padding: "40px 0" } as React.CSSProperties,
};

const NAV_ITEMS = [
  { id: "account", label: "Account", icon: "👤" },
  { id: "licenses", label: "Licenses", icon: "🔑" },
  { id: "alerts", label: "Alert History", icon: "🔔" },
  { id: "billing", label: "Billing", icon: "💳" },
  { id: "security", label: "Security", icon: "🔒" },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("account");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  useEffect(() => { if (status === "unauthenticated") window.location.href = "/login"; }, [status]);
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch("/api/licenses").then(r => r.json()).then(d => setLicenses(d)).catch(() => {}).finally(() => setLicensesLoading(false));
  }, [session]);

  const handleManageBilling = async () => {
    setPortalLoading(true); setPortalError("");
    try {
      const res = await fetch("/api/portal", { method: "POST" }); const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setPortalError("No billing account found. Please purchase a license first.");
    } catch { setPortalError("Failed to open billing portal. Please try again."); }
    finally { setPortalLoading(false); }
  };

  if (status === "loading") return <div style={{ padding: 40, color: "var(--muted)", fontSize: 14 }}>Loading...</div>;
  const email = session?.user?.email ?? "";

  return (
    <div style={styles.shell}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarLabel}>Dashboard</div>
        {NAV_ITEMS.map(item => (
          <button key={item.id} style={styles.navItem(activeTab === item.id)} onClick={() => setActiveTab(item.id)}
            onMouseEnter={e => { if (activeTab !== item.id) { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
            onMouseLeave={e => { if (activeTab !== item.id) { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; } }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>{item.label}
          </button>
        ))}
      </div>
      <div style={styles.main}>
        {activeTab === "account" && <AccountTab email={email} session={session} />}
        {activeTab === "licenses" && <LicensesTab licenses={licenses} loading={licensesLoading} />}
        {activeTab === "alerts" && <AlertsTab email={email} />}
        {activeTab === "billing" && <BillingTab onManageBilling={handleManageBilling} portalLoading={portalLoading} portalError={portalError} />}
        {activeTab === "security" && <SecurityTab email={email} />}
      </div>
    </div>
  );
}
