export default function DownloadPage() {
  return (
    <>
      <h1>Download</h1>
      <p>Download the SkyPing desktop app for your platform.</p>

      <div className="grid-3" style={{ marginTop: 18 }}>
        {/* Windows — available */}
        <div className="panel-white">
          <div style={{ fontSize: 28, marginBottom: 8 }}>🪟</div>
          <h2 style={{ marginBottom: 4 }}>Windows</h2>
          <p style={{ marginTop: 0, color: "#333", fontSize: 13 }}>.exe installer</p>
          <a
            className="btn btn-solid"
            style={{ width: "100%", display: "block", textAlign: "center", marginTop: 12 }}
            href={process.env.NEXT_PUBLIC_DOWNLOAD_URL_WINDOWS ?? "#"}
          >
            Download for Windows
          </a>
        </div>

        {/* macOS — coming soon */}
        <div className="panel-white" style={{ opacity: 0.55 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🍎</div>
          <h2 style={{ marginBottom: 4 }}>macOS</h2>
          <p style={{ marginTop: 0, color: "#333", fontSize: 13 }}>.dmg installer</p>
          <div
            style={{
              width: "100%",
              textAlign: "center",
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.12)",
              fontSize: 13,
              fontWeight: 600,
              color: "#999",
            }}
          >
            Coming Soon
          </div>
        </div>

        {/* Linux — coming soon */}
        <div className="panel-white" style={{ opacity: 0.55 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🐧</div>
          <h2 style={{ marginBottom: 4 }}>Linux</h2>
          <p style={{ marginTop: 0, color: "#333", fontSize: 13 }}>AppImage / .deb</p>
          <div
            style={{
              width: "100%",
              textAlign: "center",
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.12)",
              fontSize: 13,
              fontWeight: 600,
              color: "#999",
            }}
          >
            Coming Soon
          </div>
        </div>
      </div>

      {/* Version info */}
      <div style={{ marginTop: 32 }}>
        <div className="panel" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>Current Version</h2>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 999,
              background: "rgba(35,199,107,0.15)",
              border: "1px solid rgba(35,199,107,0.3)",
              color: "rgba(35,199,107,1)",
            }}>
              Latest
            </span>
          </div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap", fontSize: 13 }}>
            <div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 2 }}>Version</div>
              <div style={{ fontWeight: 700 }}>1.0.0</div>
            </div>
            <div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 2 }}>Platform</div>
              <div style={{ fontWeight: 700 }}>Windows 10/11</div>
            </div>
            <div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 2 }}>Size</div>
              <div style={{ fontWeight: 700 }}>~85 MB</div>
            </div>
          </div>
        </div>
      </div>

      {/* Installation steps */}
      <div style={{ marginTop: 24 }}>
        <div className="panel" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>Installation Guide</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                num: "1",
                title: "Download the installer",
                desc: "Click the download button above to get the .exe installer file.",
              },
              {
                num: "2",
                title: "Run the installer",
                desc: "Double-click the downloaded file and follow the setup wizard. Windows may show a SmartScreen warning — click \"More info\" then \"Run anyway\" to proceed.",
              },
              {
                num: "3",
                title: "Activate with your license key",
                desc: "Open SkyPing and enter the license key from your purchase confirmation email along with the email you used to purchase.",
              },
              {
                num: "4",
                title: "Configure and start tracking",
                desc: "Set your airport or coordinates, add your aircraft tail numbers, connect your notification channels, and you're live.",
              },
            ].map((step) => (
              <div key={step.num} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "var(--accent)",
                  flexShrink: 0,
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
              { label: "Operating System", value: "Windows 10 or later (64-bit)" },
              { label: "RAM", value: "4 GB minimum" },
              { label: "Disk Space", value: "~200 MB" },
              { label: "Internet", value: "Required for live tracking and alerts" },
            ].map((req) => (
              <div key={req.label} style={{
                padding: "12px 16px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                border: "1px solid var(--border)",
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
