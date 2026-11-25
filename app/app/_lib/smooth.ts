// Draws a flight's line as a curve through its positions instead of straight
// pieces between them. Where positions are a poll apart (about a mile at
// pattern speed) a turn would otherwise be a corner. Centripetal Catmull-Rom:
// the curve passes through every real position and never loops or overshoots
// between two of them. Dense stretches (the receiver, or a filled-in track)
// are left as they are.

type LngLat = [number, number];

const STEP_M = 60;       // a piece longer than this is curved...
const MAX_SUB = 16;      // ...with at most this many points added
const M_PER_DEG = 111_320;

export function smoothLine(pts: LngLat[]): LngLat[] {
  if (pts.length < 3) return pts;
  const k = Math.cos((pts[0][1] * Math.PI) / 180);
  const xy = pts.map(([lng, lat]) => [lng * k * M_PER_DEG, lat * M_PER_DEG] as const);
  const out: LngLat[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = xy[i], p2 = xy[i + 1];
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    if (len <= STEP_M) { out.push(pts[i + 1]); continue; }
    const p0 = xy[i - 1] ?? p1, p3 = xy[i + 2] ?? p2;
    const n = Math.min(MAX_SUB, Math.ceil(len / STEP_M));
    // knot spacing: square root of each piece's length (centripetal)
    const d = (a: readonly number[], b: readonly number[]) => Math.max(1e-6, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
    const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
    for (let s = 1; s < n; s++) {
      const t = t1 + ((t2 - t1) * s) / n;
      const lerp = (a: readonly number[], b: readonly number[], ta: number, tb: number) => {
        const w = (t - ta) / (tb - ta);
        return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w];
      };
      const a1 = lerp(p0, p1, t0, t1), a2 = lerp(p1, p2, t1, t2), a3 = lerp(p2, p3, t2, t3);
      const b1 = lerp(a1, a2, t0, t2), b2 = lerp(a2, a3, t1, t3);
      const c = lerp(b1, b2, t1, t2);
      out.push([c[0] / (k * M_PER_DEG), c[1] / M_PER_DEG]);
    }
    out.push(pts[i + 1]);
  }
  return out;
}
