import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download",
  description: "Download FinalPing for Windows or macOS. Personal and Teams editions available.",
};

const PERSONAL_BASE = `https://github.com/ShermR6/aircraft-tracker-desktop/releases/latest/download`;
const TEAMS_BASE = `https://github.com/ShermR6/aircraft-tracker-teams/releases/latest/download`;

function PlatformCard({
  emoji,
  name,
  ext,
  href,
  label,
}: {
  emoji: string;
  name: string;
  ext: string;
  href?: string;
  label: string;
}) {
  return (
    <div className="panel-white">
      <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
      <h2 style={{ marginBottom: 4 }}>{name}</h2>
      <p style={{ marginTop: 0, color: "#333", fontSize: 13 }}>{ext}</p>
      {href ? (
        <a
          className="btn btn-solid"
          style={{ width: "100%", display: "block", textAlign: "center", marginTop: 12 }}
          href={href}
        >
          {label}
        </a>
      ) : (
        <div style={{
          width: "100%", textAlign: "center", marginTop: 12,
          padding: "10px 14px", borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.12)",
          fontSize: 13, fontWeight: 600, color: "#999",
        }}>
          Coming Soon
        </div>
      )}
    </div>
  );
}

function AppSection({
  tag,
  title,
  tagline,
  version,
  winHref,
  macHref,
  accent,
}: {
  tag: string;
  title: string;
  tagline: string;
  version: string;
  winHref: string;
  macHref: string;
  accent?: boolean;
}) {
  return (
    <div style={{
      borderRadius: 16,
      border: accent ? "1px solid rgba(14,165,233,0.25)" : "1px solid var(--border)",
      background: accent ? "linear-gradient(135deg, rgba(14,165,233,0.06), transparent)" : "rgba(255,255,255,0.02)",
      padding: "28px 28px 24px",
      marginTop: 32,
    }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: "inline-block",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", padding: "3px 10px", borderRadius: 999,
          background: accent ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.08)",
          color: accent ? "var(--accent)" : "var(--muted)",
          border: accent ? "1px solid rgba(14,165,233,0.3)" : "1px solid var(--border)",
          marginBottom: 10,
        }}>
          {tag}
        </div>
        <h2 style={{ fontSize: 20, margin: "0 0 4px", fontWeight: 800 }}>{title}</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{tagline}</p>
      </div>

      <div className="grid-3">
        <PlatformCard emoji="🖥️" name="Windows" ext=".exe installer" href={winHref} label="Download for Windows" />
        <PlatformCard emoji="🍎" name="macOS" ext=".dmg installer" href={macHref} label="Download for macOS" />
        <div className="panel-white" style={{ opacity: 0.55 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🐧</div>
          <h2 style={{ marginBottom: 4 }}>Linux</h2>
          <p style={{ marginTop: 0, color: "#333", fontSize: 13 }}>AppImage / .deb</p>
          <div style={{
            width: "100%", textAlign: "center", marginTop: 12,
            padding: "10px 14px", borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.12)",
            fontSize: 13, fontWeight: 600, color: "#999",
          }}>
            Coming Soon
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 16, display: "flex", gap: 24, flexWrap: "wrap",
        borderTop: "1px solid var(--border)", paddingTop: 16,
        fontSize: 12, color: "var(--muted)",
      }}>
        <span><strong style={{ color: "var(--text)" }}>v{version}</strong> · Latest</span>
        <span>Windows 10/11 · macOS 12+</span>
        <span>~101 MB</span>
      </div>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <>
      <h1>Download</h1>
      <p>Choose the edition that matches your license. Not sure which one? <a href="/pricing" style={{ color: "var(--accent)" }}>Compare plans →</a></p>

      <AppSection
        tag="Personal"
        title="FinalPing"
        tagline="For individual pilots and operators. Activate with your FP- license key."
        version="1.0.9"
        winHref={`${PERSONAL_BASE}/FinalPingSetup.exe`}
        macHref={`${PERSONAL_BASE}/FinalPingSetup.dmg`}
      />

      {/* Teams — coming soon */}
      <div style={{
        borderRadius: 16,
        border: "1px solid rgba(14,165,233,0.2)",
        background: "linear-gradient(135deg, rgba(14,165,233,0.04), transparent)",
        padding: "28px 28px 24px",
        marginTop: 32,
      }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "3px 10px", borderRadius: 999,
            background: "rgba(14,165,233,0.15)", color: "var(--accent)",
            border: "1px solid rgba(14,165,233,0.3)", marginBottom: 10,
          }}>
            Teams
          </div>
          <h2 style={{ fontSize: 20, margin: "0 0 4px", fontWeight: 800 }}>FinalPing for Teams</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>For FBOs, ramp crews, and flight schools.</p>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 12,
          padding: "36px 24px",
          borderRadius: 12,
          border: "1px dashed rgba(14,165,233,0.2)",
          background: "rgba(14,165,233,0.03)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 36 }}>🏗️</div>
          <div style={{
            fontSize: 14, fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#fbbf24",
          }}>Coming Soon</div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, maxWidth: 380, lineHeight: 1.6 }}>
            The Teams edition is currently in development. Download links will appear here when it launches.
          </p>
          <a
            href="/waitlist"
            style={{
              marginTop: 4, fontSize: 13, fontWeight: 600,
              color: "var(--accent)", textDecoration: "none",
            }}
          >
            Get notified when it launches →
          </a>
        </div>
      </div>

      {/* Installation steps */}
      <div style={{ marginTop: 32 }}>
        <div className="panel" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>Installation Guide</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                num: "1",
                title: "Download the installer",
                desc: "Click the download button for your platform and edition above.",
              },
              {
                num: "2",
                title: "Run the installer",
                desc: "Windows: Double-click the .exe and follow the setup wizard. You may need to click \"More info\" then \"Run anyway\" for SmartScreen. macOS: Open the .dmg and drag the app to your Applications folder.",
              },
              {
                num: "3",
                title: "Activate with your license key",
                desc: "Open the app and enter your license key (FP- for Personal, FPT- for Teams) along with the email you used to purchase.",
              },
              {
                num: "4",
                title: "Configure and start tracking",
                desc: "Set your airport or coordinates, add your aircraft tail numbers, connect your notification channels, and you're live.",
              },
            ].map((step) => (
              <div key={step.num} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "var(--accent)", flexShrink: 0,
                }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{step.title}</div>
                  <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System requirements */}
      <div style={{ marginTop: 24 }}>
        <div className="panel" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>System Requirements</h2>
          <div className="grid-2" style={{ gap: 12 }}>
            {[
              { label: "Operating System", value: "Windows 10+ (64-bit) or macOS 12+" },
              { label: "RAM", value: "4 GB minimum" },
              { label: "Disk Space", value: "~200 MB" },
              { label: "Internet", value: "Required for live tracking and alerts" },
            ].map((req) => (
              <div key={req.label} style={{
                padding: "12px 16px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10, border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>{req.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{req.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
