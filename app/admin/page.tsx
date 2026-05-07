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
];

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Total Users", value: stats.totalUsers },
    { label: "Active Licenses", value: stats.activeLicenses },
    { label: "Signups (7d)", value: stats.recentSignups },
    { label: "New Licenses (7d)", value: stats.recentLicenses },
  ];
  return (
    <div>
      <div style={s.tabHeader}>
        <h2 style={s.tabTitle}>Overview</h2>
        <p style={s.tabSub}>Platform-wide stats</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
        {cards.map((c) => (
          <div key={c.label} style={s.statCard}>
            <div style={s.statValue}>{c.value}</div>
            <div style={s.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>
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
              <option value="starter">Starter</option>
              <option value="premium">Premium</option>
              <option value="pro">Pro</option>
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

  if (accessDenied) {
    return (
      <div style={{ padding: 80, textAlign: "center", color: "#6b7280" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#f9fafb", marginBottom: 8 }}>Access Denied</div>
        <div style={{ fontSize: 14 }}>You do not have permission to view this page.</div>
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
      </div>
    </div>
  );
}
