"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type License = {
  id: string;
  licenseKey: string;
  tier: string;
  status: string;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

type NotificationLog = {
  id: string;
  aircraft_tail: string;
  alert_type: string;
  message: string;
  integration_type: string;
  status: string;
  sent_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tierLabels: Record<string, string> = {
  starter: "Starter",
  premium: "Premium",
  pro: "Pro",
  "team-starter": "Team Starter",
  "team-premium": "Team Premium",
  "team-pro": "Team Pro",
};

const CHANNEL_ICONS: Record<string, string> = {
  discord: "💬", slack: "📱", teams: "👥", email: "✉️", sms: "📲", whatsapp: "🟢",
};

const CHANNEL_COLORS: Record<string, string> = {
  discord: "#5865f2", slack: "#4a154b", teams: "#6264a7",
  email: "#0ea5e9", sms: "#10b981", whatsapp: "#25d366",
};

function getLicenseStatus(license: License) {
  if (license.status === "expired") return { label: "Expired", color: "#ef4444" };
  if (license.status === "inactive" || !license.activatedAt) return { label: "Not Activated", color: "#f59e0b" };
  if (license.expiresAt) {
    const now = new Date();
    const expires = new Date(license.expiresAt);
    if (now > expires) return { label: "Expired", color: "#ef4444" };
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) return { label: `Expiring in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`, color: "#f59e0b" };
    return { label: `Active — ${daysLeft} days left`, color: "#23c76b" };
  }
  return { label: "Active", color: "#23c76b" };
}

function formatAlertType(type: string) {
  if (type === "landing") return "🛬 Landing";
  return `📍 ${type} out`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function exportToTxt(logs: NotificationLog[]) {
  const header = "FinalPing Alert History Export\n" +
    `Exported: ${new Date().toLocaleString()}\n` +
    `Total Alerts: ${logs.length}\n` +
    "=".repeat(80) + "\n\n";
  const rows = logs.map(log =>
    `[${formatDate(log.sent_at)}] ${log.aircraft_tail} — ${log.alert_type} — ${log.integration_type} — ${log.status}\n  ${log.message}`
  ).join("\n\n");
  const blob = new Blob([header + rows], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finalping-alerts-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Tab Components ───────────────────────────────────────────────────────────

function AccountTab({ email, session }: { email: string; session: any }) {
  const joinDate = session?.user?.createdAt
    ? new Date(session.user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div>
      <div style={styles.tabHeader}>
        <h2 style={styles.tabTitle}>Account Information</h2>
        <p style={styles.tabSub}>Your profile and account details</p>
      </div>

      <div style={styles.card}>
        <div style={styles.cardSection}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Email Address</span>
            <span style={styles.infoValue}>{email}</span>
          </div>
          <div style={styles.infoRowLast}>
            <span style={styles.infoLabel}>Member Since</span>
            <span style={styles.infoValue}>{joinDate}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          style={styles.dangerBtn}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function LicensesTab({ licenses, loading, onManageBilling, portalLoading, portalError }: {
  licenses: License[];
  loading: boolean;
  onManageBilling: () => void;
  portalLoading: boolean;
  portalError: string;
}) {
  if (loading) return <div style={styles.loadingText}>Loading licenses...</div>;

  return (
    <div>
      <div style={styles.tabHeader}>
        <h2 style={styles.tabTitle}>Your Licenses</h2>
        <p style={styles.tabSub}>All license keys associated with your account</p>
      </div>

      {licenses.length === 0 ? (
        <div style={{ ...styles.card, textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
          <p style={{ color: "var(--muted)", marginBottom: 16, margin: "0 0 16px" }}>No licenses yet. Purchase one to get started.</p>
          <Link href="/pricing" style={styles.outlineBtn}>Browse Plans</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {licenses.map((license) => {
            const statusInfo = getLicenseStatus(license);
            return (
              <div key={license.id} style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={styles.tierBadge}>{tierLabels[license.tier] ?? license.tier} LICENSE</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: statusInfo.color }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusInfo.color, display: "inline-block" }} />
                    {statusInfo.label}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 28, flexWrap: "wrap" as const }}>
                  <div>
                    <div style={styles.metaLabel}>License Key</div>
                    <div style={styles.licenseKey}>{license.licenseKey}</div>
                  </div>
                  <div>
                    <div style={styles.metaLabel}>Purchased</div>
                    <div style={styles.metaValue}>{new Date(license.createdAt).toLocaleDateString()}</div>
                  </div>
                  {license.activatedAt && (
                    <div>
                      <div style={styles.metaLabel}>Activated</div>
                      <div style={styles.metaValue}>{new Date(license.activatedAt).toLocaleDateString()}</div>
                    </div>
                  )}
                  {license.expiresAt && (
                    <div>
                      <div style={styles.metaLabel}>Expires</div>
                      <div style={styles.metaValue}>{new Date(license.expiresAt).toLocaleDateString()}</div>
                    </div>
                  )}
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
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/alerts-proxy?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [email]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay());
  const todayCount = logs.filter(l => new Date(l.sent_at) >= todayStart).length;
  const weekCount = logs.filter(l => new Date(l.sent_at) >= weekStart).length;

  if (loading) return <div style={styles.loadingText}>Loading alert history...</div>;

  return (
    <div>
      <div style={{ ...styles.tabHeader, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={styles.tabTitle}>Alert History</h2>
          <p style={styles.tabSub}>All notifications sent by the cloud tracker</p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={() => exportToTxt(logs)}
            style={styles.exportBtn}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          >
            ⬇ Export .txt
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[{ label: "Today", value: todayCount }, { label: "This Week", value: weekCount }, { label: "All Time", value: logs.length }].map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={styles.statLabel}>{s.label}</div>
            <div style={styles.statValue}>{s.value}</div>
          </div>
        ))}
      </div>

      {error ? (
        <div style={{ ...styles.card, textAlign: "center", color: "var(--muted)" }}>Could not load alert history. Please try again later.</div>
      ) : logs.length === 0 ? (
        <div style={{ ...styles.card, textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <p style={{ color: "var(--muted)", margin: 0 }}>No alerts yet. They'll appear here once the tracker sends notifications.</p>
        </div>
      ) : (
        <div style={styles.card}>
          {/* Table header */}
          <div style={styles.tableHeader}>
            <div>Aircraft</div>
            <div>Message</div>
            <div>Type</div>
            <div>Channel</div>
            <div>Status</div>
            <div>Time</div>
          </div>
          {logs.map((log, i) => (
            <div key={log.id} style={{
              ...styles.tableRow,
              borderBottom: i < logs.length - 1 ? "1px solid var(--border)" : "none",
              background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
            }}>
              <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>{log.aircraft_tail}</div>
              <div style={{ color: "var(--muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{log.message}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{formatAlertType(log.alert_type)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span>{CHANNEL_ICONS[log.integration_type] ?? "🔔"}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: CHANNEL_COLORS[log.integration_type] ?? "var(--muted)", textTransform: "capitalize" as const }}>{log.integration_type}</span>
              </div>
              <div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                  background: log.status === "sent" ? "rgba(35,199,107,0.15)" : "rgba(239,68,68,0.15)",
                  color: log.status === "sent" ? "#23c76b" : "#ef4444",
                  border: `1px solid ${log.status === "sent" ? "rgba(35,199,107,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}>
                  {log.status === "sent" ? "Sent" : "Failed"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{formatDate(log.sent_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BillingTab({ onManageBilling, portalLoading, portalError }: {
  onManageBilling: () => void;
  portalLoading: boolean;
  portalError: string;
}) {
  return (
    <div>
      <div style={styles.tabHeader}>
        <h2 style={styles.tabTitle}>Billing & Subscription</h2>
        <p style={styles.tabSub}>Manage your payment methods, invoices, and plan</p>
      </div>

      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Stripe Billing Portal</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Update payment methods, download invoices, or cancel your subscription.</div>
          </div>
          <button
            onClick={onManageBilling}
            disabled={portalLoading}
            style={{ ...styles.primaryBtn, opacity: portalLoading ? 0.6 : 1, cursor: portalLoading ? "not-allowed" : "pointer" }}
            onMouseEnter={e => { if (!portalLoading) e.currentTarget.style.background = "#0284c7"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#0ea5e9"; }}
          >
            {portalLoading ? "Opening..." : "Manage Subscription →"}
          </button>
        </div>
        {portalError && <p style={{ fontSize: 13, color: "#ef4444", margin: "12px 0 0" }}>{portalError}</p>}
      </div>

      <div style={{ ...styles.card, marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Need a different plan?</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>View all available plans and pricing options.</div>
        <Link href="/pricing" style={styles.outlineBtn}>View Pricing →</Link>
      </div>
    </div>
  );
}

function SecurityTab({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ text: "Please fill in all fields.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ text: "Password must be at least 8 characters.", type: "error" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Password changed successfully.", type: "success" });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        setMessage({ text: data.error || "Failed to change password.", type: "error" });
      }
    } catch {
      setMessage({ text: "Something went wrong. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={styles.tabHeader}>
        <h2 style={styles.tabTitle}>Security</h2>
        <p style={styles.tabSub}>Manage your password and account security</p>
      </div>

      <div style={styles.card}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Signed in as</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>{email}</div>

        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Change Password</div>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
          <div>
            <label style={styles.inputLabel}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              style={styles.input}
              onFocus={e => { e.currentTarget.style.borderColor = "#0ea5e9"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </div>
          <div>
            <label style={styles.inputLabel}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              style={styles.input}
              onFocus={e => { e.currentTarget.style.borderColor = "#0ea5e9"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </div>
          <div>
            <label style={styles.inputLabel}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={styles.input}
              onFocus={e => { e.currentTarget.style.borderColor = "#0ea5e9"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </div>
        </div>

        {message && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 8, fontSize: 13,
            background: message.type === "success" ? "rgba(35,199,107,0.1)" : "rgba(239,68,68,0.1)",
            color: message.type === "success" ? "#23c76b" : "#ef4444",
            border: `1px solid ${message.type === "success" ? "rgba(35,199,107,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}>
            {message.text}
          </div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={saving}
          style={{ ...styles.primaryBtn, marginTop: 16, opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer" }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = "#0284c7"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#0ea5e9"; }}
        >
          {saving ? "Saving..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  } as React.CSSProperties,
  sidebar: {
    width: 220,
    minWidth: 220,
    borderRight: "1px solid var(--border)",
    padding: "32px 0",
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    background: "rgba(255,255,255,0.02)",
  } as React.CSSProperties,
  sidebarLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase" as const, color: "var(--muted)",
    padding: "8px 20px 4px",
  } as React.CSSProperties,
  navItem: (active: boolean) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 20px", fontSize: 13,
    fontWeight: active ? 600 : 500,
    color: active ? "var(--text)" : "var(--muted)",
    background: active ? "rgba(14,165,233,0.08)" : "transparent",
    borderRight: active ? "2px solid #0ea5e9" : "2px solid transparent",
    cursor: "pointer", transition: "all 0.15s",
    border: "none", width: "100%", textAlign: "left" as const,
  }),
  main: {
    flex: 1,
    padding: "40px 48px",
    maxWidth: 860,
  } as React.CSSProperties,
  tabHeader: {
    marginBottom: 24,
  } as React.CSSProperties,
  tabTitle: {
    fontSize: 22, fontWeight: 700, margin: "0 0 4px",
  } as React.CSSProperties,
  tabSub: {
    fontSize: 14, color: "var(--muted)", margin: 0,
  } as React.CSSProperties,
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "20px 24px",
  } as React.CSSProperties,
  cardSection: {
    display: "flex", flexDirection: "column" as const,
  },
  infoRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 0", borderBottom: "1px solid var(--border)",
  } as React.CSSProperties,
  infoRowLast: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 0",
  } as React.CSSProperties,
  infoLabel: {
    fontSize: 13, color: "var(--muted)",
  } as React.CSSProperties,
  infoValue: {
    fontSize: 13, fontWeight: 600,
  } as React.CSSProperties,
  tierBadge: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
    color: "var(--muted)", textTransform: "uppercase" as const,
  },
  licenseKey: {
    fontFamily: "monospace", fontSize: 14, fontWeight: 700,
    background: "rgba(255,255,255,0.06)", padding: "4px 10px",
    borderRadius: 6, border: "1px solid var(--border)", letterSpacing: "0.05em",
    display: "inline-block",
  } as React.CSSProperties,
  metaLabel: {
    fontSize: 12, color: "var(--muted)", marginBottom: 4,
  } as React.CSSProperties,
  metaValue: {
    fontSize: 14,
  } as React.CSSProperties,
  statCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid var(--border)",
    borderRadius: 10, padding: "16px 20px",
  } as React.CSSProperties,
  statLabel: {
    fontSize: 12, color: "var(--muted)", marginBottom: 4,
  } as React.CSSProperties,
  statValue: {
    fontSize: 28, fontWeight: 800,
  } as React.CSSProperties,
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "90px 1fr 120px 100px 80px 160px",
    gap: 12, padding: "12px 20px",
    borderBottom: "1px solid var(--border)",
    fontSize: 11, fontWeight: 700,
    color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em",
  } as React.CSSProperties,
  tableRow: {
    display: "grid",
    gridTemplateColumns: "90px 1fr 120px 100px 80px 160px",
    gap: 12, padding: "13px 20px",
    fontSize: 13, alignItems: "center",
  } as React.CSSProperties,
  primaryBtn: {
    padding: "9px 18px", borderRadius: 8,
    background: "#0ea5e9", color: "#fff",
    fontSize: 13, fontWeight: 600, border: "none",
    cursor: "pointer", transition: "background 0.15s",
    display: "inline-block",
  } as React.CSSProperties,
  outlineBtn: {
    padding: "9px 18px", borderRadius: 8,
    background: "transparent", color: "var(--text)",
    fontSize: 13, fontWeight: 600,
    border: "1px solid var(--border)",
    cursor: "pointer", textDecoration: "none",
    display: "inline-block",
  } as React.CSSProperties,
  dangerBtn: {
    padding: "9px 18px", borderRadius: 8,
    background: "rgba(239,68,68,0.06)", color: "#f87171",
    fontSize: 13, fontWeight: 600,
    border: "1px solid rgba(239,68,68,0.2)",
    cursor: "pointer", transition: "background 0.15s",
  } as React.CSSProperties,
  exportBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid var(--border)",
    borderRadius: 8, color: "var(--text)",
    fontSize: 13, fontWeight: 600,
    cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  inputLabel: {
    display: "block", fontSize: 12,
    fontWeight: 600, color: "var(--muted)",
    marginBottom: 6,
  } as React.CSSProperties,
  input: {
    width: "100%", padding: "10px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border)",
    borderRadius: 8, color: "var(--text)",
    fontSize: 13, outline: "none",
    transition: "border-color 0.15s",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  loadingText: {
    color: "var(--muted)", fontSize: 14, padding: "40px 0",
  } as React.CSSProperties,
};

// ─── Nav Items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "account", label: "Account", icon: "👤" },
  { id: "licenses", label: "Licenses", icon: "🔑" },
  { id: "alerts", label: "Alert History", icon: "🔔" },
  { id: "billing", label: "Billing", icon: "💳" },
  { id: "security", label: "Security", icon: "🔒" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("account");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") window.location.href = "/login";
  }, [status]);

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch("/api/licenses")
      .then(r => r.json())
      .then(data => setLicenses(data))
      .catch(() => {})
      .finally(() => setLicensesLoading(false));
  }, [session]);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setPortalError("");
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPortalError("No billing account found. Please purchase a license first.");
      }
    } catch {
      setPortalError("Failed to open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  if (status === "loading") {
    return <div style={{ padding: 40, color: "var(--muted)", fontSize: 14 }}>Loading...</div>;
  }

  const email = session?.user?.email ?? "";

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarLabel}>Dashboard</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            style={styles.navItem(activeTab === item.id)}
            onClick={() => setActiveTab(item.id)}
            onMouseEnter={e => {
              if (activeTab !== item.id) {
                e.currentTarget.style.color = "var(--text)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== item.id) {
                e.currentTarget.style.color = "var(--muted)";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={styles.main}>
        {activeTab === "account" && <AccountTab email={email} session={session} />}
        {activeTab === "licenses" && (
          <LicensesTab
            licenses={licenses}
            loading={licensesLoading}
            onManageBilling={handleManageBilling}
            portalLoading={portalLoading}
            portalError={portalError}
          />
        )}
        {activeTab === "alerts" && <AlertsTab email={email} />}
        {activeTab === "billing" && (
          <BillingTab
            onManageBilling={handleManageBilling}
            portalLoading={portalLoading}
            portalError={portalError}
          />
        )}
        {activeTab === "security" && <SecurityTab email={email} />}
      </div>
    </div>
  );
}
