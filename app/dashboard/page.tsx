"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

type License = {
  id: string;
  licenseKey: string;
  tier: string;
  status: string;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

const tierLabels: Record<string, string> = {
  starter: "Starter",
  premium: "Premium",
  pro: "Pro",
  "team-starter": "Team Starter",
  "team-premium": "Team Premium",
  "team-pro": "Team Pro",
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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
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
      .finally(() => setLoading(false));
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

  if (status === "loading" || loading) {
    return (
      <>
        <div style={{ marginBottom: 24 }}>
          <div style={{ height: 32, width: 160, background: "rgba(255,255,255,0.07)", borderRadius: 8, marginBottom: 8 }} />
          <div style={{ height: 14, width: 220, background: "rgba(255,255,255,0.04)", borderRadius: 6 }} />
        </div>
        {[0, 1].map(i => (
          <div key={i} className="panel" style={{ padding: 22, marginBottom: 14 }}>
            <div style={{ height: 12, width: 120, background: "rgba(255,255,255,0.06)", borderRadius: 4, marginBottom: 16 }} />
            <div style={{ height: 20, width: 200, background: "rgba(255,255,255,0.08)", borderRadius: 6 }} />
          </div>
        ))}
      </>
    );
  }

  const email = session?.user?.email ?? "";

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 4 }}>Dashboard</h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>Signed in as {email}</p>
      </div>

      {/* Manage Subscription */}
      <div className="panel" style={{ padding: 22, marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
          Manage your subscription, update payment methods, or view invoices.
        </p>
        {portalError && (
          <p style={{ fontSize: 13, color: "#ef4444", margin: 0, width: "100%" }}>{portalError}</p>
        )}
        <button
          onClick={handleManageBilling}
          disabled={portalLoading}
          className="btn btn-outline"
          style={{ fontSize: 13, opacity: portalLoading ? 0.6 : 1, cursor: portalLoading ? "not-allowed" : "pointer", flexShrink: 0 }}
        >
          {portalLoading ? "Opening..." : "Manage Subscription →"}
        </button>
      </div>

      {/* Licenses */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Your Licenses</h2>

      {licenses.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
          <h2 style={{ marginBottom: 8 }}>No licenses yet</h2>
          <p style={{ color: "var(--muted)", marginBottom: 16 }}>Purchase a license to start tracking aircraft.</p>
          <Link className="btn btn-outline" href="/pricing">Purchase a License</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
          {licenses.map((license) => {
            const statusInfo = getLicenseStatus(license);
            return (
              <div className="panel" key={license.id} style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                  <div className="small" style={{ letterSpacing: "0.07em" }}>
                    {tierLabels[license.tier] ?? license.tier} LICENSE
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: statusInfo.color }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusInfo.color, display: "inline-block" }} />
                    {statusInfo.label}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>License Key</div>
                    <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, background: "rgba(255,255,255,0.06)", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", letterSpacing: "0.05em" }}>
                      {license.licenseKey}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Purchased</div>
                    <div style={{ fontSize: 14 }}>{new Date(license.createdAt).toLocaleDateString()}</div>
                  </div>
                  {license.activatedAt && (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Activated</div>
                      <div style={{ fontSize: 14 }}>{new Date(license.activatedAt).toLocaleDateString()}</div>
                    </div>
                  )}
                  {license.expiresAt && (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Expires</div>
                      <div style={{ fontSize: 14 }}>{new Date(license.expiresAt).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Account actions */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="btn btn-outline"
          style={{ fontSize: 13 }}
        >
          Sign out
        </button>
      </div>
    </>
  );
}
