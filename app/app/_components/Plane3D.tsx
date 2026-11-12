"use client";

// A turning 3D model of one aircraft, in its paint colour. Drag to spin it.
// The 3D code loads on demand, so screens that never show a model don't pay
// for it. Without WebGL the box just keeps its soft glow.

import { useEffect, useRef } from "react";
import { FAMILY_LABEL, familyOf, modelOf } from "../_lib/paint";
import type { ViewHandle } from "../_lib/fleet3d";

export default function Plane3D({
  type, color, tail, height = 160, speed, start, tag = true, className = "",
}: {
  type?: string | null;
  color: string;
  tail: string;
  height?: number | string;
  speed?: number;
  /** Starting angle, so a row of models doesn't turn in lockstep. */
  start?: number;
  /** Show the shape name in the corner. */
  tag?: boolean;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const handle = useRef<ViewHandle | null>(null);
  const latest = useRef(color);
  const family = familyOf(type);
  const real = modelOf(type);
  const modelId = real?.id ?? "";
  const modelV = real?.v ?? "";
  // A borrowed model (an R22 drawn as an R44) keeps the general name.
  const label = real?.exact ? real.label : FAMILY_LABEL[family];

  useEffect(() => {
    latest.current = color;
    handle.current?.setColor(color);
  }, [color]);

  useEffect(() => {
    let gone = false;
    import("../_lib/fleet3d").then((m) => {
      if (gone || !canvas.current) return;
      handle.current = m.mount(canvas.current, { family, color: latest.current, speed, start, model: modelId ? { id: modelId, v: modelV } : null });
    }).catch(() => {});
    return () => {
      gone = true;
      handle.current?.dispose();
      handle.current = null;
    };
  }, [family, modelId, modelV, speed, start]);

  return (
    <div className={`fa-vp ${className}`} style={{ height, ["--paint" as string]: color }}>
      <canvas ref={canvas} role="img" aria-label={`3D model of ${tail}: ${label}. Drag to turn it.`} />
      {tag && <span className="fa-vp-tag">{label}</span>}
    </div>
  );
}
