import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "FinalPing | Real-Time Aircraft Tracking & Alerts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = readFileSync(join(process.cwd(), "public", "web-app-manifest-512x512.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0e17",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 90px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div style={{
          position: "absolute",
          right: 260,
          top: "50%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)",
          display: "flex",
          transform: "translateY(-50%)",
        }} />

        {/* Left: text content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", zIndex: 1 }}>
          {/* Eyebrow */}
          <div style={{
            display: "flex",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#0ea5e9",
            marginBottom: 16,
          }}>
            Aircraft Alerts
          </div>

          {/* Wordmark */}
          <div style={{
            display: "flex",
            fontSize: 112,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            lineHeight: 0.9,
            marginBottom: 20,
            marginLeft: -10,
          }}>
            FinalPing
          </div>

          {/* Accent line */}
          <div style={{
            display: "flex",
            width: 340,
            height: 4,
            borderRadius: 999,
            background: "linear-gradient(90deg, #0ea5e9, transparent)",
            marginBottom: 28,
          }} />

          {/* Tagline */}
          <div style={{
            display: "flex",
            fontSize: 26,
            color: "#94a3b8",
            lineHeight: 1.4,
            maxWidth: 480,
            marginBottom: 40,
          }}>
            Know the moment your aircraft moves.{"\n"}Before anyone else does.
          </div>

          {/* URL pill */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 20,
            color: "#38bdf8",
            padding: "10px 24px",
            borderRadius: 999,
            border: "1px solid rgba(56,189,248,0.25)",
            background: "rgba(56,189,248,0.07)",
          }}>
            finalpingapp.com
          </div>
        </div>

        {/* Right: logo icon */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={240} height={240} alt="" style={{ borderRadius: 54, opacity: 0.97 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
