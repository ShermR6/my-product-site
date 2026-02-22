import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { license: true },
  });

  const license = user?.license;

  const tierLabels: Record<string, string> = {
    starter: "Starter — License Tier 1",
    premium: "Premium — License Tier 2",
    pro: "Pro — License Tier 3",
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 4 }}>Dashboard</h1>
        <p style={{ margin: 0 }}>Signed in as {session.user.email}</p>
      </div>

      {!license ? (
        <div className="panel" style={{ marginBottom: 18, textAlign: "center", padding: 32 }}>
          <h2 style={{ marginBottom: 8 }}>No license found</h2>
          <p>You don't have an active license yet.</p>
          <Link className="btn btn-outline" href="/pricing">Purchase a License</Link>
        </div>
      ) : (
        <>
          <div className="panel" style={{ marginBottom: 14, padding: 22 }}>
            <div className="small" style={{ marginBottom: 8, letterSpacing: "0.07em" }}>YOUR LICENSE</div>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Tier</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{tierLabels[license.tier] ?? license.tier}</div>
              </div>
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
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Status</div>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(35,199,107,1)",
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(35,199,107,1)", display: "inline-block" }} />
                  Active
                </span>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Purchased</div>
                <div style={{ fontSize: 14 }}>{new Date(license.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 14, padding: 22 }}>
            <div className="small" style={{ marginBottom: 12, letterSpacing: "0.07em" }}>DOWNLOAD THE APP</div>
            <div className="grid-3">
              {[
                { os: "Windows", ext: ".exe installer", icon: "🪟", url: process.env.DOWNLOAD_URL_WINDOWS ?? "#" },
                { os: "macOS", ext: ".dmg installer", icon: "🍎", url: process.env.DOWNLOAD_URL_MAC ?? "#" },
                { os: "Linux", ext: "AppImage / .deb", icon: "🐧", url: process.env.DOWNLOAD_URL_LINUX ?? "#" },
              ].map(({ os, ext, icon, url }) => (
                <div key={os} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}>
                  <div style={{ fontSize: 24 }}>{icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{os}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{ext}</div>
                  <a href={url} className="btn btn-solid" style={{ marginTop: 4, fontSize: 12 }}>
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <Link href="/api/auth/signout" className="btn btn-outline" style={{ fontSize: 12 }}>
          Sign out
        </Link>
      </div>
    </>
  );
}
