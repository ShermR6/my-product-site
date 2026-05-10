"use client";
import { useRef, useState } from "react";

export default function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  return (
    <div
      onClick={toggle}
      style={{ position: "relative", width: "100%", height: "100%", cursor: "pointer" }}
    >
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        playsInline
        onEnded={() => setPlaying(false)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {!playing && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.35)",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "#0ea5e9",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 40px rgba(14,165,233,0.5)",
          }}>
            <svg width="22" height="22" fill="white" viewBox="0 0 24 24" style={{ marginLeft: 4 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
