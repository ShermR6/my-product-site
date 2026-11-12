"use client";

// A small drawn map: the airport in the middle, its alert rings, and the
// tracked aircraft around it. North is up. No tiles, so it loads instantly;
// the Live Map screen has the real map.

import { endHeading, offsetNm } from "../_lib/format";
import type { AirportConfig, LiveAircraft } from "../_lib/types";
import { PLANE_PATH } from "./kit";

const W = 804;
const H = 392;

export default function RingMap({
  airport, rings, live, focusTail, height, bottomPad = 0, paints,
}: {
  airport: AirportConfig | null;
  rings: number[];           // widest first
  live: LiveAircraft[];
  focusTail?: string | null;
  height?: number | string;
  /** Space (in drawing units) kept clear at the bottom for an overlay. */
  bottomPad?: number;
  /** Paint colour by tail number. */
  paints?: Record<string, string>;
}) {
  const lat0 = Number(airport?.latitude);
  const lon0 = Number(airport?.longitude);
  const hasCenter = isFinite(lat0) && isFinite(lon0);

  const widest = rings[0] ?? 10;
  const focus = live.find((a) => a.tail_number === focusTail);
  // Zoom out far enough to keep the aircraft we care about in frame.
  const reach = Math.max(widest, Math.min(focus && !focus.on_ground ? focus.distance_nm * 1.08 : 0, widest * 2.2));
  const usable = H - bottomPad;
  const scale = (usable / 2 - 22) / reach; // px per nm
  const cx = W / 2;
  const cy = usable / 2;

  const rw = airport?.runway_info?.[0];
  const rwHdg = rw ? endHeading(rw.leIdent, rw.leHdg) : null;
  const rwRad = ((rwHdg ?? 0) * Math.PI) / 180;
  const rwLen = 12;

  const planes = hasCenter
    ? live
        // Aircraft parked at the field would just sit on top of the airport marker.
        .filter((a) => a.latitude != null && a.longitude != null && !a.on_ground)
        .map((a) => {
          const o = offsetNm(lat0, lon0, a.latitude as number, a.longitude as number);
          return { a, x: cx + o.x * scale, y: cy - o.y * scale };
        })
        .filter((p) => p.x > -20 && p.x < W + 20 && p.y > -20 && p.y < H + 20)
    : [];

  return (
    <svg width="100%" height={height ?? "100%"} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img"
      aria-label={`Map of ${airport?.airport_code ?? "the airport"} with ${planes.length} tracked aircraft in view`} style={{ display: "block" }}>
      {/* faint grid so the empty map doesn't look broken */}
      {[-2, -1, 0, 1, 2].map((i) => (
        <g key={i} stroke="#151515" strokeWidth="1">
          <line x1={cx + i * 180} y1="0" x2={cx + i * 180} y2={H} />
          <line x1="0" y1={cy + i * 120} x2={W} y2={cy + i * 120} />
        </g>
      ))}

      {rings.map((r, i) => {
        const inner = i === rings.length - 1 && rings.length > 1;
        return (
          <g key={r}>
            <circle cx={cx} cy={cy} r={r * scale} fill="none" stroke={inner ? "#4A4A4A" : i === 0 ? "#2A2A2A" : "#333333"} strokeWidth="1" strokeDasharray={inner ? "3 4" : undefined} />
            {/* Labels sit just inside the top of each ring, clear of the runway and the airport code. */}
            {r * scale >= 26 && (i === 0 || (rings[i - 1] - r) * scale >= 14) && (
              <text x={cx + 7} y={cy - r * scale + 14} fontFamily="var(--mono)" fontSize="10.5" fill="#8A8A8A">{r} nm</text>
            )}
          </g>
        );
      })}

      {/* airport */}
      <line
        x1={cx - Math.sin(rwRad) * rwLen} y1={cy + Math.cos(rwRad) * rwLen}
        x2={cx + Math.sin(rwRad) * rwLen} y2={cy - Math.cos(rwRad) * rwLen}
        stroke="#FAFAFA" strokeWidth="4" strokeLinecap="round"
      />
      <text x={cx + 14} y={cy + 18} fontFamily="var(--mono)" fontSize="11" fontWeight="600" fill="#D4D4D4">{airport?.airport_code ?? ""}</text>

      {planes.map(({ a, x, y }) => {
        const hot = !a.on_ground && a.is_approaching && a.distance_nm <= widest + 0.9;
        const labelLeft = x > W - 190;
        const lx = labelLeft ? x - 172 : x + 24;
        return (
          <g key={a.tail_number} opacity={a.on_ground ? 0.55 : 1}>
            {hot && <line x1={x} y1={y} x2={cx} y2={cy} stroke="#38BDF8" strokeWidth="1" strokeDasharray="2 5" opacity="0.6" />}
            {hot && <circle cx={x} cy={y} r="17" fill="rgba(56,189,248,0.14)" />}
            <path fill={paints?.[a.tail_number] ?? "#FAFAFA"} transform={`translate(${x},${y}) rotate(${a.heading ?? 0}) scale(0.8)`} d={PLANE_PATH} />
            <rect x={lx} y={y - 22} width="148" height="44" rx="9" fill="#0A0A0A" stroke={hot ? "#38BDF8" : "#2E2E2E"} strokeOpacity={hot ? 0.6 : 1} />
            <text x={lx + 12} y={y - 4} fontFamily="var(--mono)" fontSize="13" fontWeight="600" fill="#FAFAFA">{a.tail_number}</text>
            <text x={lx + 12} y={y + 12} fontFamily="var(--mono)" fontSize="10.5" fill="#A3A3A3">
              {a.on_ground ? "On the ground" : `${a.velocity_kts != null ? Math.round(a.velocity_kts) + " kt" : "—"} · ${a.altitude_ft_msl != null ? Math.round(a.altitude_ft_msl).toLocaleString() + " ft" : "—"}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
