import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "FinalPing | Real-Time Aircraft Tracking & Alerts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // The current mark, as in the navbar: sky-blue ring, white jet, no tile.
  const mark =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 8 104 104">' +
    '<circle cx="60" cy="60" r="40" fill="none" stroke="#0EA5E9" stroke-width="8" stroke-dasharray="195.4 48.9" stroke-linecap="round"/>' +
    '<path fill="#FAFAFA" transform="translate(87.5,32.5) rotate(225) scale(1.32)" d="M0,-15 C1.8,-15 3,-11.5 3,-8 L3,-3.2 L16,3.8 L16,7.2 L3,4.2 L3,9 L7,12.2 L7,14.6 L0,12.8 L-7,14.6 L-7,12.2 L-3,9 L-3,4.2 L-16,7.2 L-16,3.8 L-3,-3.2 L-3,-8 C-3,-11.5 -1.8,-15 0,-15 Z"/>' +
    "</svg>";
  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(mark).toString("base64")}`;

  const interBlack = readFileSync(join(process.cwd(), "public", "fonts", "Inter-Black.woff"));


  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A0A",
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
          background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
          display: "flex",
          transform: "translateY(-50%)",
        }} />

        {/* Left: text content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", zIndex: "1" }}>
          {/* Eyebrow */}
          <div style={{
            display: "flex",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#A3A3A3",
            marginBottom: 16,
          }}>
            Aircraft Alerts
          </div>

          {/* Wordmark */}
          <div style={{
            display: "flex",
            fontSize: 112,
            fontWeight: 900,
            fontFamily: "Inter",
            color: "#ffffff",
            letterSpacing: "-0.03em",
            lineHeight: 0.9,
            marginBottom: 20,
            marginLeft: -4,
          }}>
            FinalPing
          </div>

          {/* Accent line */}
          <div style={{
            display: "flex",
            width: 340,
            height: 4,
            borderRadius: 999,
            background: "linear-gradient(90deg, #FAFAFA, transparent)",
            marginBottom: 28,
          }} />

          {/* Tagline */}
          <div style={{
            display: "flex",
            fontSize: 26,
            color: "#A3A3A3",
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
            color: "#FAFAFA",
            padding: "10px 24px",
            borderRadius: 999,
            border: "1px solid #2E2E2E",
            background: "#131313",
          }}>
            finalpingapp.com
          </div>
        </div>

        {/* Right: logo icon */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: "1" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={260} height={260} alt="" />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Inter", data: interBlack, style: "normal", weight: 900 }],
    }
  );
}
