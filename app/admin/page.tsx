"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import React from "react";

type Stats = {
  totalUsers: number;
  activeLicenses: number;
  recentSignups: number;
  recentLicenses: number;
};

type User = {
  id: string;
  email: string;
  createdAt: string;
  licenseCount: number;
  activeLicenseCount: number;
};

type License = {
  id: string;
  licenseKey: string;
  tier: string;
  status: string;
  purchaseEmail: string;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  userId: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  active: "#23c76b",
  inactive: "#f59e0b",
  expired: "#ef4444",
  revoked: "#6b7280",
};

const TIER_COLORS: Record<string, string> = {
  starter: "#0ea5e9",
  premium: "#a855f7",
  pro: "#f5b400",
  "team-starter": "#22d3a3",
  "team-premium": "#818cf8",
  "team-pro": "#fb923c",
};

function statusBadge(status: string) {
  const color = STATUS_COLORS[status] ?? "#6b7280";
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
      background: `${color}22`, color, border: `1px solid ${color}55`,
      textTransform: "capitalize" as const,
    }}>
      {status}
    </span>
  );
}

function tierBadge(tier: string) {
  const color = TIER_COLORS[tier] ?? "#6b7280";
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
      background: `${color}22`, color, border: `1px solid ${color}55`,
      textTransform: "capitalize" as const,
    }}>
      {tier}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

const s = {
  shell: { display: "flex", minHeight: "100vh" } as React.CSSProperties,
  sidebar: { width: 220, minWidth: 220, borderRight: "1px solid #1f2937", padding: "32px 0", display: "flex", flexDirection: "column" as const, gap: 2, background: "rgba(255,255,255,0.02)" } as React.CSSProperties,
  sidebarLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#6b7280", padding: "8px 20px 4px" } as React.CSSProperties,
  navItem: (active: boolean): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "#f9fafb" : "#6b7280", background: active ? "rgba(14,165,233,0.08)" : "transparent", borderRight: active ? "2px solid #0ea5e9" : "2px solid transparent", cursor: "pointer", transition: "all 0.15s", border: "none", width: "100%", textAlign: "left" as const }),
  main: { flex: 1, padding: "40px 48px", maxWidth: 1100 } as React.CSSProperties,
  tabHeader: { marginBottom: 24 } as React.CSSProperties,
  tabTitle: { fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#f9fafb" } as React.CSSProperties,
  tabSub: { fontSize: 14, color: "#6b7280", margin: 0 } as React.CSSProperties,
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid #1f2937", borderRadius: 12, padding: "20px 24px" } as React.CSSProperties,
  statCard: { background: "rgba(255,255,255,0.03)", border: "1px solid #1f2937", borderRadius: 10, padding: "20px 24px" } as React.CSSProperties,
  statValue: { fontSize: 36, fontWeight: 800, color: "#f9fafb", lineHeight: 1 } as React.CSSProperties,
  statLabel: { fontSize: 13, color: "#6b7280", marginTop: 6 } as React.CSSProperties,
  input: { width: "100%", padding: "9px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid #1f2937", borderRadius: 8, color: "#f9fafb", fontSize: 13, outline: "none", boxSizing: "border-box" as const } as React.CSSProperties,
  select: { padding: "9px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid #1f2937", borderRadius: 8, color: "#f9fafb", fontSize: 13, outline: "none", cursor: "pointer" } as React.CSSProperties,
  primaryBtn: { padding: "9px 18px", borderRadius: 8, background: "#0ea5e9", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" } as React.CSSProperties,
  dangerBtn: { padding: "5px 12px", borderRadius: 6, background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 12, fontWeight: 600, border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer" } as React.CSSProperties,
  tableHeader: (cols: string): React.CSSProperties => ({ display: "grid", gridTemplateColumns: cols, gap: 12, padding: "10px 20px", borderBottom: "1px solid #1f2937", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.06em" }),
  tableRow: (cols: string): React.CSSProperties => ({ display: "grid", gridTemplateColumns: cols, gap: 12, padding: "12px 20px", fontSize: 13, alignItems: "center", color: "#f9fafb" }),
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 } as React.CSSProperties,
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "licenses", label: "Licenses", icon: "🔑" },
  { id: "create", label: "Create License", icon: "➕" },
  { id: "waitlist", label: "Waitlist", icon: "📋" },
  { id: "orders", label: "Orders", icon: "📦" },
  { id: "ground-stations", label: "Ground Stations", icon: "📡" },
];

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: Stats }) {
  const [revenue, setRevenue] = React.useState<any>(null);
  const [revenueLoading, setRevenueLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/admin/revenue")
      .then(r => r.json())
      .then(d => setRevenue(d))
      .finally(() => setRevenueLoading(false));
  }, []);

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const userCards = [
    { label: "Total Users", value: stats.totalUsers },
    { label: "Active Licenses", value: stats.activeLicenses },
    { label: "Signups (7d)", value: stats.recentSignups },
    { label: "New Licenses (7d)", value: stats.recentLicenses },
  ];

  const revenueCards = revenue ? [
    { label: "Revenue (12mo)", value: fmt(revenue.totalRevenue), sub: "All successful charges" },
    { label: "This Month", value: fmt(revenue.revenueThisMonth), sub: "Charges this calendar month" },
    { label: "Hardware (12mo)", value: fmt(revenue.hardwareRevenue), sub: "One-time kit sales" },
    { label: "Active Subscribers", value: revenue.activeSubscribers, sub: "Paying subscriptions" },
    { label: "New Subs (mo)", value: revenue.newThisMonth, sub: `Churn: ${revenue.churnThisMonth}` },
  ] : [];

  return (
    <div>
      <div style={s.tabHeader}>
        <h2 style={s.tabTitle}>Overview</h2>
        <p style={s.tabSub}>Platform-wide stats</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
        {userCards.map((c) => (
          <div key={c.label} style={s.statCard}>
            <div style={s.statValue}>{c.value}</div>
            <div style={s.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Revenue</div>
      {revenueLoading ? (
        <div style={{ color: "#6b7280", fontSize: 13 }}>Loading revenue data...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {revenueCards.map((c) => (
            <div key={c.label} style={s.statCard}>
              <div style={{ ...s.statValue, color: typeof c.value === "string" ? "#f5b400" : "#f9fafb" }}>{c.value}</div>
              <div style={s.statLabel}>{c.label}</div>
              {c.sub && <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>{c.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userLicenses, setUserLicenses] = useState<Record<string, License[]>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users${q ? `?search=${encodeURIComponent(q)}` : ""}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(""); }, [fetchUsers]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(val), 300);
  };

  const toggleUser = async (user: User) => {
    if (expandedUser === user.id) { setExpandedUser(null); return; }
    setExpandedUser(user.id);
    if (!userLicenses[user.id]) {
      const res = await fetch(`/api/admin/licenses?search=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setUserLicenses((prev) => ({ ...prev, [user.id]: Array.isArray(data) ? data : [] }));
    }
  };

  const cols = "1fr 140px 80px 80px 60px";

  return (
    <div>
      <div style={s.tabHeader}>
        <h2 style={s.tabTitle}>Users</h2>
        <p style={s.tabSub}>All registered accounts</p>
      </div>
      <div style={{ marginBottom: 16 }}>
        <input
          style={s.input}
          placeholder="Search by email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div style={{ color: "#6b7280", fontSize: 14, padding: "24px 0" }}>Loading...</div>
      ) : (
        <div style={s.card}>
          <div style={s.tableHeader(cols)}>
            <div>Email</div><div>Member Since</div><div>Licenses</div><div>Active</div><div></div>
          </div>
          {users.length === 0 && (
            <div style={{ padding: "24px 20px", color: "#6b7280", fontSize: 13 }}>No users found.</div>
          )}
          {users.map((user, i) => (
            <div key={user.id}>
              <div
                style={{
                  ...s.tableRow(cols),
                  borderBottom: expandedUser === user.id ? "none" : i < users.length - 1 ? "1px solid #1f2937" : "none",
                  cursor: "pointer",
                  background: expandedUser === user.id ? "rgba(14,165,233,0.05)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                }}
                onClick={() => toggleUser(user)}
              >
                <div style={{ fontWeight: 500 }}>{user.email}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>{formatDate(user.createdAt)}</div>
                <div>{user.licenseCount}</div>
                <div style={{ color: "#23c76b" }}>{user.activeLicenseCount}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>{expandedUser === user.id ? "▲" : "▼"}</div>
              </div>
              {expandedUser === user.id && (
                <div style={{ padding: "12px 20px 16px", borderBottom: i < users.length - 1 ? "1px solid #1f2937" : "none", background: "rgba(14,165,233,0.03)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Licenses</div>
                  {!userLicenses[user.id] ? (
                    <div style={{ color: "#6b7280", fontSize: 13 }}>Loading...</div>
                  ) : userLicenses[user.id].length === 0 ? (
                    <div style={{ color: "#6b7280", fontSize: 13 }}>No licenses.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {userLicenses[user.id].map((lic) => (
                        <div key={lic.id} style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 12 }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#f9fafb", letterSpacing: "0.05em" }}>{lic.licenseKey}</span>
                          {tierBadge(lic.tier)}
                          {statusBadge(lic.status)}
                          <span style={{ color: "#6b7280" }}>Created {formatDate(lic.createdAt)}</span>
                          {lic.expiresAt && <span style={{ color: "#6b7280" }}>Expires {formatDate(lic.expiresAt)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Licenses Tab ──────────────────────────────────────────────────────────────
function LicensesTab() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLicenses = useCallback(async (q: string, st: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (st) params.set("status", st);
      const res = await fetch(`/api/admin/licenses${params.toString() ? `?${params}` : ""}`);
      const data = await res.json();
      setLicenses(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLicenses("", ""); }, [fetchLicenses]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchLicenses(val, status), 300);
  };

  const handleStatus = (val: string) => {
    setStatus(val);
    fetchLicenses(search, val);
  };

  const revoke = async (licenseKey: string) => {
    if (!confirm(`Revoke license ${licenseKey}?`)) return;
    await fetch(`/api/admin/licenses/${licenseKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke" }),
    });
    fetchLicenses(search, status);
  };

  const cols = "160px 80px 90px 1fr 110px 110px 80px";

  return (
    <div>
      <div style={s.tabHeader}>
        <h2 style={s.tabTitle}>Licenses</h2>
        <p style={s.tabSub}>All license keys</p>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          style={{ ...s.input, flex: 1 }}
          placeholder="Search by license key or email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select style={s.select} value={status} onChange={(e) => handleStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>
      {loading ? (
        <div style={{ color: "#6b7280", fontSize: 14, padding: "24px 0" }}>Loading...</div>
      ) : (
        <div style={s.card}>
          <div style={s.tableHeader(cols)}>
            <div>License Key</div><div>Tier</div><div>Status</div><div>Email</div><div>Created</div><div>Expires</div><div></div>
          </div>
          {licenses.length === 0 && (
            <div style={{ padding: "24px 20px", color: "#6b7280", fontSize: 13 }}>No licenses found.</div>
          )}
          {licenses.map((lic, i) => (
            <div key={lic.id} style={{ ...s.tableRow(cols), borderBottom: i < licenses.length - 1 ? "1px solid #1f2937" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
              <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, letterSpacing: "0.05em" }}>{lic.licenseKey}</div>
              <div>{tierBadge(lic.tier)}</div>
              <div>{statusBadge(lic.status)}</div>
              <div style={{ color: "#6b7280", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{lic.purchaseEmail}</div>
              <div style={{ color: "#6b7280", fontSize: 12 }}>{formatDate(lic.createdAt)}</div>
              <div style={{ color: "#6b7280", fontSize: 12 }}>{lic.expiresAt ? formatDate(lic.expiresAt) : "—"}</div>
              <div>
                {lic.status !== "revoked" && (
                  <button
                    style={s.dangerBtn}
                    onClick={() => revoke(lic.licenseKey)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Create License Tab ────────────────────────────────────────────────────────
function CreateLicenseTab() {
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState("starter");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<License | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setResult(null); setLoading(true);
    try {
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tier }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setResult(data);
      setEmail(""); setTier("starter");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={s.tabHeader}>
        <h2 style={s.tabTitle}>Create License</h2>
        <p style={s.tabSub}>Manually generate a license key</p>
      </div>
      <div style={{ ...s.card, maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>Tier</label>
            <select style={{ ...s.select, width: "100%" }} value={tier} onChange={(e) => setTier(e.target.value)}>
              <optgroup label="Personal (FP-)">
                <option value="starter">Starter</option>
                <option value="premium">Premium</option>
                <option value="pro">Pro</option>
              </optgroup>
              <optgroup label="Teams (FPT-)">
                <option value="team-starter">Team Starter</option>
                <option value="team-premium">Team Premium</option>
                <option value="team-pro">Team Pro</option>
              </optgroup>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ ...s.primaryBtn, opacity: loading ? 0.6 : 1 }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#0284c7"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0ea5e9"; }}
          >
            {loading ? "Generating..." : "Generate License"}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, fontSize: 13, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 10, background: "rgba(35,199,107,0.07)", border: "1px solid rgba(35,199,107,0.25)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#23c76b", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>License Created</div>
            <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 900, letterSpacing: "0.08em", color: "#f9fafb", marginBottom: 8 }}>{result.licenseKey}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {result.tier} &bull; {result.purchaseEmail} &bull; {result.status}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/admin/stats")
      .then(async (res) => {
        if (res.status === 403) { setAccessDenied(true); return; }
        const data = await res.json();
        setStats(data);
      })
      .catch(() => setAccessDenied(true));
  }, [status]);

  if (status === "loading") {
    return <div style={{ padding: 40, color: "#6b7280", fontSize: 14 }}>Loading...</div>;
  }

  // ── Waitlist Tab ────────────────────────────────────────────────────────────
  function WaitlistTab() {
    const [entries, setEntries] = React.useState<{ id: string; email: string; source: string | null; createdAt: string }[]>([]);
    const [loading, setLoading] = React.useState(true);

    const load = React.useCallback(() => {
      setLoading(true);
      fetch("/api/admin/waitlist")
        .then(r => r.json())
        .then(d => { setEntries(d.entries ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    }, []);

    React.useEffect(() => { load(); }, [load]);

    const handleDelete = async (id: string) => {
      await fetch("/api/admin/waitlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      load();
    };

    return (
      <div>
        <div style={{ ...s.tabHeader, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={s.tabTitle}>Teams Waitlist</div>
            <div style={s.tabSub}>{entries.length} signup{entries.length !== 1 ? "s" : ""}</div>
          </div>
          <a
            href="/api/admin/waitlist?format=csv"
            download
            style={{ ...s.primaryBtn, textDecoration: "none", display: "inline-block" }}
          >
            Export CSV ↓
          </a>
        </div>

        <div style={s.card}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>Loading…</div>
          ) : entries.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>No signups yet.</div>
          ) : (
            <>
              <div style={s.tableHeader("2fr 1fr 1fr 80px")}>
                <span>Email</span><span>Source</span><span>Joined</span><span></span>
              </div>
              {entries.map(e => (
                <div key={e.id} style={{ ...s.tableRow("2fr 1fr 1fr 80px"), borderTop: "1px solid #1f2937" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12 }}>{e.email}</span>
                  <span style={{ color: "#6b7280", fontSize: 12 }}>{e.source ?? "—"}</span>
                  <span style={{ color: "#6b7280", fontSize: 12 }}>{formatDate(e.createdAt)}</span>
                  <button style={s.dangerBtn} onClick={() => handleDelete(e.id)}>Remove</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div style={{ padding: 80, textAlign: "center", color: "#6b7280" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#f9fafb", marginBottom: 8 }}>Access Denied</div>
        <div style={{ fontSize: 14 }}>You do not have permission to view this page.</div>
      </div>
    );
  }

  // ── Orders Tab ──────────────────────────────────────────────────────────────
  function OrdersTab() {
    const [orders, setOrders] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [trackingInputs, setTrackingInputs] = React.useState<Record<string, string>>({});
    const [carrierInputs, setCarrierInputs] = React.useState<Record<string, string>>({});
    const [actionLoading, setActionLoading] = React.useState<string | null>(null);
    const [messages, setMessages] = React.useState<Record<string, { ok: boolean; msg: string }>>({});
    const [filter, setFilter] = React.useState<"all" | "pending" | "shipped" | "completed">("all");

    const fetchOrders = React.useCallback(async () => {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
      setLoading(false);
    }, []);

    React.useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const doAction = async (id: string, action: string, trackingNumber?: string, carrier?: string) => {
      setActionLoading(id + action);
      setMessages(m => ({ ...m, [id]: { ok: false, msg: "" } }));
      try {
        const res = await fetch(`/api/admin/orders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, trackingNumber, carrier }),
        });
        const data = await res.json();
        if (res.ok) {
          setOrders(prev => prev.map(o => o.id === id ? data.order : o));
          if (action === "ship") {
            setMessages(m => ({ ...m, [id]: { ok: true, msg: "Tracking email sent!" } }));
            setTrackingInputs(t => ({ ...t, [id]: "" }));
          }
        } else {
          setMessages(m => ({ ...m, [id]: { ok: false, msg: data.error || "Failed" } }));
        }
      } catch {
        setMessages(m => ({ ...m, [id]: { ok: false, msg: "Network error" } }));
      } finally {
        setActionLoading(null);
      }
    };

    const statusColor: Record<string, string> = {
      pending: "#f59e0b",
      shipped: "#0ea5e9",
      completed: "#22d3a3",
    };

    const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
    const counts = { all: orders.length, pending: orders.filter(o => o.status === "pending").length, shipped: orders.filter(o => o.status === "shipped").length, completed: orders.filter(o => o.status === "completed").length };

    return (
      <div>
        <div style={s.tabHeader}>
          <h2 style={s.tabTitle}>Orders</h2>
          <p style={s.tabSub}>Manage hardware orders and send tracking numbers</p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["all", "pending", "shipped", "completed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: filter === f ? "#0ea5e920" : "transparent",
              borderColor: filter === f ? "#0ea5e9" : "#1f2937",
              color: filter === f ? "#0ea5e9" : "#6b7280",
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: "#6b7280", fontSize: 13 }}>Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "#6b7280", fontSize: 13, padding: "40px 0", textAlign: "center" }}>
            No {filter === "all" ? "" : filter} orders yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(order => {
              const items: any[] = Array.isArray(order.items) ? order.items : [];
              const msg = messages[order.id];
              const isActing = actionLoading?.startsWith(order.id);
              return (
                <div key={order.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1f2937", borderRadius: 12, padding: "20px 24px" }}>
                  {/* Header row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f9fafb" }}>{order.customerName || order.customerEmail}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{order.customerEmail}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{order.shippingAddress}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: `${statusColor[order.status]}20`, color: statusColor[order.status], border: `1px solid ${statusColor[order.status]}50` }}>
                        {order.status.toUpperCase()}
                      </span>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                    {items.map((item: any, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#d1d5db", padding: "3px 0", borderBottom: i < items.length - 1 ? "1px solid #1f293740" : "none" }}>
                        <span>{item.quantity > 1 ? `${item.quantity}× ` : ""}{item.description}</span>
                        <span>{item.amount}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#f9fafb", marginTop: 8, paddingTop: 8, borderTop: "1px solid #1f2937" }}>
                      <span>Total</span><span>{order.totalFormatted}</span>
                    </div>
                  </div>

                  {/* Tracking number (if shipped) */}
                  {order.trackingNumber && (() => {
                    const carrierUrls: Record<string, string> = { UPS: "https://www.ups.com/track?tracknum=", USPS: "https://tools.usps.com/go/TrackConfirmAction?tLabels=", FedEx: "https://www.fedex.com/fedextrack/?trknbr=" };
                    const carrierLabel = order.carrier || "UPS";
                    const trackUrl = (carrierUrls[carrierLabel] ?? carrierUrls["UPS"]) + order.trackingNumber;
                    return (
                      <div style={{ fontSize: 12, color: "#0ea5e9", marginBottom: 12 }}>
                        📦 {carrierLabel}: <a href={trackUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>{order.trackingNumber}</a>
                        {order.shippedAt && <span style={{ color: "#6b7280", marginLeft: 8 }}>· Shipped {new Date(order.shippedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                      </div>
                    );
                  })()}

                  {/* Actions */}
                  {order.status === "pending" && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        value={carrierInputs[order.id] || "UPS"}
                        onChange={e => setCarrierInputs(c => ({ ...c, [order.id]: e.target.value }))}
                        style={{ ...s.select, fontSize: 13 }}
                      >
                        <option value="UPS">UPS</option>
                        <option value="USPS">USPS</option>
                        <option value="FedEx">FedEx</option>
                      </select>
                      <input
                        style={{ ...s.input, maxWidth: 220, flex: 1 }}
                        type="text"
                        placeholder="Tracking number"
                        value={trackingInputs[order.id] || ""}
                        onChange={e => setTrackingInputs(t => ({ ...t, [order.id]: e.target.value.replace(/\s/g, "") }))}
                      />
                      <button
                        onClick={() => doAction(order.id, "ship", trackingInputs[order.id], carrierInputs[order.id] || "UPS")}
                        disabled={isActing || !trackingInputs[order.id]}
                        style={{ ...s.primaryBtn, opacity: isActing || !trackingInputs[order.id] ? 0.5 : 1, whiteSpace: "nowrap" }}
                      >
                        {isActing ? "Sending..." : "Ship & Notify →"}
                      </button>
                    </div>
                  )}

                  {order.status === "shipped" && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        onClick={() => doAction(order.id, "complete")}
                        disabled={!!isActing}
                        style={{ padding: "7px 16px", borderRadius: 8, background: "#22d3a320", color: "#22d3a3", border: "1px solid #22d3a350", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        ✓ Mark Completed
                      </button>
                      <button
                        onClick={() => doAction(order.id, "pending")}
                        disabled={!!isActing}
                        style={{ padding: "7px 16px", borderRadius: 8, background: "transparent", color: "#6b7280", border: "1px solid #1f2937", fontSize: 12, cursor: "pointer" }}
                      >
                        ↩ Revert to Pending
                      </button>
                    </div>
                  )}

                  {order.status === "completed" && (
                    <div style={{ fontSize: 12, color: "#22d3a3" }}>
                      ✓ Completed {order.completedAt ? new Date(order.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                    </div>
                  )}

                  {msg?.msg && (
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: msg.ok ? "#22d3a3" : "#f87171" }}>
                      {msg.ok ? "✓" : "✕"} {msg.msg}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Manual send fallback */}
        <div style={{ marginTop: 32, borderTop: "1px solid #1f2937", paddingTop: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb", marginBottom: 4 }}>Send Tracking Email Manually</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>For past orders or any order not listed above.</div>
          <ManualShipForm />
        </div>
      </div>
    );
  }

  function ManualShipForm() {
    const [email, setEmail] = React.useState("");
    const [trackingNumber, setTrackingNumber] = React.useState("");
    const [customerName, setCustomerName] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState<{ ok: boolean; msg: string } | null>(null);

    const handleSend = async () => {
      if (!email || !trackingNumber) return;
      setLoading(true);
      setResult(null);
      try {
        const res = await fetch("/api/admin/ship-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, trackingNumber, customerName }),
        });
        if (res.ok) {
          setResult({ ok: true, msg: `Shipping email sent to ${email}` });
          setEmail(""); setTrackingNumber(""); setCustomerName("");
        } else {
          setResult({ ok: false, msg: "Failed to send email" });
        }
      } catch {
        setResult({ ok: false, msg: "Network error" });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{ ...s.card, maxWidth: 480 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={s.label}>Customer Email *</label>
            <input style={s.input} type="email" placeholder="customer@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={s.label}>Customer Name (optional)</label>
            <input style={s.input} type="text" placeholder="John Smith" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label style={s.label}>UPS Tracking Number *</label>
            <input style={s.input} type="text" placeholder="1Z999AA10123456784" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value.replace(/\s/g, ""))} />
          </div>
          <button
            onClick={handleSend}
            disabled={loading || !email || !trackingNumber}
            style={{ ...s.primaryBtn, opacity: loading || !email || !trackingNumber ? 0.5 : 1, marginTop: 4 }}
          >
            {loading ? "Sending..." : "Send Shipping Email"}
          </button>
          {result && (
            <div style={{ fontSize: 12, fontWeight: 600, color: result.ok ? "#22d3a3" : "#f87171" }}>
              {result.ok ? "✓" : "✕"} {result.msg}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Ground Stations Tab ──────────────────────────────────────────────────────
  function GroundStationsTab() {
    const [devices, setDevices] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      fetch("/api/admin/ground-devices")
        .then(r => r.json())
        .then(d => { if (d.devices) setDevices(d.devices); })
        .finally(() => setLoading(false));
    }, []);

    const fmtLastSeen = (iso: string | null) => {
      if (!iso) return "Never";
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
      <div>
        <div style={s.tabHeader}>
          <h2 style={s.tabTitle}>Ground Stations</h2>
          <p style={s.tabSub}>{devices.length} device{devices.length !== 1 ? "s" : ""} registered</p>
        </div>
        {loading ? (
          <div style={{ color: "#6b7280", fontSize: 13 }}>Loading devices...</div>
        ) : devices.length === 0 ? (
          <div style={{ color: "#6b7280", fontSize: 13, padding: "40px 0", textAlign: "center" }}>No ground station devices registered yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {devices.map((d, i) => (
              <div key={i} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f9fafb", marginBottom: 2 }}>{d.email}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>
                    Key: {d.gs_device_key ? `${d.gs_device_key.slice(0, 8)}...${d.gs_device_key.slice(-8)}` : "Not assigned"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 12, color: "#6b7280", textAlign: "right" }}>
                    <div>Last seen</div>
                    <div style={{ color: "#d1d5db", fontWeight: 600 }}>{fmtLastSeen(d.last_seen)}</div>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
                    borderRadius: 999, fontSize: 12, fontWeight: 700,
                    background: d.online ? "rgba(34,211,163,0.1)" : "rgba(107,114,128,0.1)",
                    border: `1px solid ${d.online ? "rgba(34,211,163,0.3)" : "rgba(107,114,128,0.3)"}`,
                    color: d.online ? "#22d3a3" : "#6b7280",
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.online ? "#22d3a3" : "#6b7280" }} />
                    {d.online ? "Online" : "Offline"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!stats) {
    return <div style={{ padding: 40, color: "#6b7280", fontSize: 14 }}>Loading admin panel...</div>;
  }

  return (
    <div style={s.shell}>
      <div style={s.sidebar}>
        <div style={s.sidebarLabel}>Admin</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            style={s.navItem(activeTab === item.id)}
            onClick={() => setActiveTab(item.id)}
            onMouseEnter={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.color = "#f9fafb";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.color = "#6b7280";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
      <div style={s.main}>
        {activeTab === "overview" && <OverviewTab stats={stats} />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "licenses" && <LicensesTab />}
        {activeTab === "create" && <CreateLicenseTab />}
        {activeTab === "waitlist" && <WaitlistTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "ground-stations" && <GroundStationsTab />}
      </div>
    </div>
  );
}
