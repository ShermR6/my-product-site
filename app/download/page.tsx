// app/download/page.tsx
export default function DownloadPage() {
  return (
    <>
      <h1>Download</h1>
      <p>Placeholder links for now. Replace the # with your real installer URLs later.</p>

      <div className="grid-3" style={{ marginTop: 18 }}>
        <div className="panel-white">
          <h2 style={{ marginBottom: 6 }}>Windows</h2>
          <p style={{ marginTop: 0, color: "#333" }}>.exe installer</p>
          <button className="btn btn-solid" style={{ width: "100%" }}>
            Download (placeholder)
          </button>
          <div className="note">Tip: later you can restrict downloads to paid users.</div>
        </div>

        <div className="panel-white">
          <h2 style={{ marginBottom: 6 }}>macOS</h2>
          <p style={{ marginTop: 0, color: "#333" }}>.dmg installer</p>
          <button className="btn btn-solid" style={{ width: "100%" }}>
            Download (placeholder)
          </button>
          <div className="note">Tip: later you can restrict downloads to paid users.</div>
        </div>

        <div className="panel-white">
          <h2 style={{ marginBottom: 6 }}>Linux</h2>
          <p style={{ marginTop: 0, color: "#333" }}>AppImage / .deb</p>
          <button className="btn btn-solid" style={{ width: "100%" }}>
            Download (placeholder)
          </button>
          <div className="note">Tip: later you can restrict downloads to paid users.</div>
        </div>
      </div>
    </>
  );
}