export default function DownloadPage() {
  return (
    <>
      <h1>Download</h1>
      <p>Download the SkyPing desktop app for your platform.</p>

      <div className="grid-3" style={{ marginTop: 18 }}>
        <div className="panel-white">
          <h2 style={{ marginBottom: 6 }}>Windows</h2>
          <p style={{ marginTop: 0, color: "#333" }}>.exe installer</p>
          <a 
            className="btn btn-solid" 
            style={{ width: "100%", display: "block", textAlign: "center" }}
            href={process.env.NEXT_PUBLIC_DOWNLOAD_URL_WINDOWS ?? "#"}
          >
            Download
          </a>
        </div>

        <div className="panel-white">
          <h2 style={{ marginBottom: 6 }}>macOS</h2>
          <p style={{ marginTop: 0, color: "#333" }}>.dmg installer</p>
          <a 
            className="btn btn-solid"
            style={{ width: "100%", display: "block", textAlign: "center" }}
            href={process.env.NEXT_PUBLIC_DOWNLOAD_URL_MAC ?? "#"}
          >
            Download
          </a>
        </div>

        <div className="panel-white">
          <h2 style={{ marginBottom: 6 }}>Linux</h2>
          <p style={{ marginTop: 0, color: "#333" }}>AppImage / .deb</p>
          <a 
            className="btn btn-solid"
            style={{ width: "100%", display: "block", textAlign: "center" }}
            href={process.env.NEXT_PUBLIC_DOWNLOAD_URL_LINUX ?? "#"}
          >
            Download
          </a>
        </div>
      </div>
    </>
  );
}