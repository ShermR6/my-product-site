import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function getLicenseStatus(license: { status: string; activatedAt: Date | null; expiresAt: Date | null }) {
  if (license.status === "expired") return { label: "Expired", color: "#ef4444" };
  if (license.status === "inactive" || !license.activatedAt) return { label: "Not Activated", color: "#f59e0b" };

  if (license.expiresAt) {
    const now = new Date();
    if (now > license.expiresAt) return { label: "Expired", color: "#ef4444" };

    const msLeft = license.expiresAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    return { label: `Active — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`, color: "#23c76b" };
  }

  return { label: "Active", color: "#23c76b" };
}

const tierLabels: Record<string, string> = {
  starter: "Starter",
  premium: "Premium",
  pro: "Pro",
  "team-starter": "Team Starter",
  "team-premium": "Team Premium",
  "team-pro": "Team Pro",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  // Link any unlinked licenses purchased with this email to this user
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (user) {
    await prisma.license.updateMany({
      where: {
        purchaseEmail: session.user.email,
        userId: null,
      },
      data: {
        userId: user.id,
      },
    });
  }

  // Fetch all licenses for this email
  const licenses = await prisma.license.findMany({
    where: { purchaseEmail: session.user.email },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 4 }}>Dashboard</h1>
        <p style={{ margin: 0 }}>Signed in as {session.user.email}</p>
      </div>

      {licenses.length === 0 ? (
        <div className="panel" style={{ marginBottom: 18, textAlign: "center", padding: 32 }}>
          <h2 style={{ marginBottom: 8 }}>No licenses found</h2>
          <p>You don't have any licenses yet.</p>
          <Link className="btn btn-outline" href="/pricing">Purchase a License</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
          {licenses.map((license) => {
            const statusInfo = getLicenseStatus(license);
            return (
              <div className="panel" key={license.id} style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div className="small" style={{ letterSpacing: "0.07em" }}>
                    {tierLabels[license.tier] ?? license.tier} LICENSE
                  </div>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: statusInfo.color,
                  }}>
                    <span style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: statusInfo.color,
                      display: "inline-block",
                    }} />
                    {statusInfo.label}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginTop: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>License Key</div>
                    <div style={{
                      fontFamily: "monospace",
                      fontSize: 15,
                      fontWeight: 700,
                      background: "rgba(255,255,255,0.06)",
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      letterSpacing: "0.05em",
                    }}>
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

              {[
            { os: "Windows", ext: ".exe installer", icon: "🪟", url: process.env.NEXT_PUBLIC_DOWNLOAD_URL_WINDOWS ?? "#", available: true },
            { os: "macOS", ext: ".dmg installer", icon: "🍎", url: "#", available: false },
            { os: "Linux", ext: "AppImage / .deb", icon: "🐧", url: "#", available: false },
          ].map(({ os, ext, icon, url, available }) => (
            <div key={os} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              opacity: available ? 1 : 0.5,
            }}>
              <div style={{ fontSize: 24 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{os}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{ext}</div>
              {available ? (
                <a href={url} className="btn btn-solid" style={{ marginTop: 4, fontSize: 12 }}>
                  Download
                </a>
              ) : (
                <div style={{
                  marginTop: 4,
                  textAlign: "center",
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--muted)",
                }}>
                  Coming Soon
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <Link href="/pricing" className="btn btn-outline" style={{ fontSize: 12 }}>
          Purchase another license
        </Link>
        <Link href="/api/auth/signout" className="btn btn-outline" style={{ fontSize: 12 }}>
          Sign out
        </Link>
      </div>
    </>
  );
}
