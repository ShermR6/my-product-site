"use client";

import { useEffect, useRef } from "react";

export default function TopoBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    let animId: number;
    let t = 0;

    const isDark = () => document.documentElement.getAttribute("data-theme") !== "light";

    function resize() {
      W = canvas!.width = window.innerWidth;
      H = canvas!.height = window.innerHeight;
    }

    // Generate a smooth noise-like value using sin/cos combinations
    function noise(x: number, y: number, offset: number): number {
      return (
        Math.sin(x * 0.008 + offset * 0.3) * 0.4 +
        Math.sin(y * 0.006 + offset * 0.2 + 1.2) * 0.3 +
        Math.sin((x + y) * 0.005 + offset * 0.15 + 2.4) * 0.2 +
        Math.sin((x - y) * 0.007 + offset * 0.25 + 0.8) * 0.1
      );
    }

    // Draw contour lines by marching through the field
    function drawContours(level: number, offset: number, lineOpacity: number) {
      const step = 18; // grid resolution
      const dark = isDark();
      const color = dark
        ? `rgba(14,165,233,${lineOpacity})`
        : `rgba(14,100,190,${lineOpacity})`;

      ctx!.strokeStyle = color;
      ctx!.lineWidth = 0.75;
      ctx!.beginPath();

      for (let x = 0; x < W + step; x += step) {
        for (let y = 0; y < H + step; y += step) {
          const v00 = noise(x, y, offset);
          const v10 = noise(x + step, y, offset);
          const v01 = noise(x, y + step, offset);
          const v11 = noise(x + step, y + step, offset);

          // Marching squares — only draw edges where field crosses `level`
          const c0 = v00 > level ? 1 : 0;
          const c1 = v10 > level ? 1 : 0;
          const c2 = v11 > level ? 1 : 0;
          const c3 = v01 > level ? 1 : 0;
          const code = c0 | (c1 << 1) | (c2 << 2) | (c3 << 3);

          if (code === 0 || code === 15) continue;

          // Interpolate edge crossings
          const top    = (level - v00) / (v10 - v00);
          const right  = (level - v10) / (v11 - v10);
          const bottom = (level - v01) / (v11 - v01);
          const left   = (level - v00) / (v01 - v00);

          const pts: Record<string, [number, number]> = {
            T: [x + top * step, y],
            R: [x + step, y + right * step],
            B: [x + bottom * step, y + step],
            L: [x, y + left * step],
          };

          const edges: Record<number, [[string,string],[string,string]]> = {
            1:  [["T","L"],["L","T"]],
            2:  [["T","R"],["R","T"]],
            3:  [["R","L"],["L","R"]],
            4:  [["B","R"],["R","B"]],
            5:  [["T","B"],["L","R"]],
            6:  [["T","B"],["B","T"]],
            7:  [["B","L"],["L","B"]],
            8:  [["B","L"],["L","B"]],
            9:  [["T","B"],["B","T"]],
            10: [["T","B"],["L","R"]],
            11: [["B","R"],["R","B"]],
            12: [["R","L"],["L","R"]],
            13: [["T","R"],["R","T"]],
            14: [["T","L"],["L","T"]],
          };

          const e = edges[code];
          if (!e) continue;

          const [p1k, p2k] = e[0];
          const p1 = pts[p1k];
          const p2 = pts[p2k];
          if (p1 && p2) {
            ctx!.moveTo(p1[0], p1[1]);
            ctx!.lineTo(p2[0], p2[1]);
          }
        }
      }
      ctx!.stroke();
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Draw multiple contour levels — slowly shift over time for subtle animation
      const levels = [-0.6, -0.35, -0.1, 0.15, 0.4, 0.65];
      const baseOpacity = isDark() ? 0.09 : 0.07;

      levels.forEach((level, i) => {
        const opacity = baseOpacity - i * 0.008;
        drawContours(level, t, Math.max(opacity, 0.02));
      });

      t += 0.004; // very slow drift
      animId = requestAnimationFrame(draw);
    }

    const observer = new MutationObserver(() => {});
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
