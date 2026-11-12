// Where each tracked aircraft has been since the app was opened, for the trail
// drawn behind it on the Live Map. Kept in memory only; the tracker store adds
// to it on every position refresh, whichever screen is showing.

import type { LiveAircraft } from "./types";

export type Fix = { lat: number; lon: number; t: number };

const MAX_POINTS = 300;        // 50 minutes at one fix every 10 seconds
const MIN_MOVE_DEG = 0.0003;   // about 30 m; ignores jitter while taxiing or parked
const GAP_MS = 4 * 60_000;     // a longer silence starts a fresh trail
const FORGET_MS = 20 * 60_000;

const trails = new Map<string, Fix[]>();

export function recordFixes(live: LiveAircraft[], now = Date.now()) {
  for (const a of live) {
    if (a.latitude == null || a.longitude == null) continue;
    if (a.on_ground) { trails.delete(a.tail_number); continue; } // each flight starts clean
    let t = trails.get(a.tail_number);
    const last = t?.[t.length - 1];
    if (!t || (last && now - last.t > GAP_MS)) { t = []; trails.set(a.tail_number, t); }
    const prev = t[t.length - 1];
    if (prev && Math.abs(prev.lat - a.latitude) < MIN_MOVE_DEG && Math.abs(prev.lon - a.longitude) < MIN_MOVE_DEG) continue;
    t.push({ lat: a.latitude, lon: a.longitude, t: now });
    if (t.length > MAX_POINTS) t.splice(0, t.length - MAX_POINTS);
  }
  for (const [tail, t] of trails) {
    if (!t.length || now - t[t.length - 1].t > FORGET_MS) trails.delete(tail);
  }
}

export function trailOf(tail: string): Fix[] {
  return trails.get(tail) ?? [];
}
