// Replaying a recorded flight: where the aircraft was at any moment, read
// from its points, and the playback clock.

import { useEffect, useRef, useState } from "react";
import type { FlightPoint } from "./types";

export type ReplayFix = {
  lat: number;
  lon: number;
  /** Feet above sea level, when known. */
  alt: number | null;
  speed: number | null;
  heading: number | null;
  ground: boolean;
  /** Index of the recorded point at or before this moment. */
  index: number;
  /** Seconds between the recorded points either side: a long one is a gap in coverage. */
  gap: number;
};

/** A stretch this long with no recorded point is shown as a gap in coverage. */
export const REPLAY_GAP_S = 90;
export const REPLAY_SPEEDS = [1, 10, 30, 60] as const;

function bearing(a: FlightPoint, b: FlightPoint): number {
  const la1 = (a[1] * Math.PI) / 180, la2 = (b[1] * Math.PI) / 180;
  const dl = ((b[2] - a[2]) * Math.PI) / 180;
  const y = Math.sin(dl) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function metresApart(a: FlightPoint, b: FlightPoint): number {
  const dy = (b[1] - a[1]) * 111_320;
  const dx = (b[2] - a[2]) * 111_320 * Math.cos((a[1] * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

function lerp(a: number | null, b: number | null, f: number): number | null {
  if (a == null) return b;
  if (b == null) return a;
  return a + (b - a) * f;
}

/** Where the aircraft was at unix second `t`, between the recorded points either side. */
export function fixAt(points: FlightPoint[], t: number): ReplayFix | null {
  if (!points.length) return null;
  let lo = 0, hi = points.length - 1;
  if (t <= points[0][0]) hi = 0;
  else if (t >= points[hi][0]) lo = hi;
  else {
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (points[mid][0] <= t) lo = mid; else hi = mid;
    }
  }
  const a = points[lo], b = points[hi];
  const span = b[0] - a[0];
  const f = span > 0 ? Math.min(1, Math.max(0, (t - a[0]) / span)) : 0;
  // Heading: the way it actually went between the two points, unless they are
  // too close together to tell (standing still), then the reported track.
  const heading = lo !== hi && metresApart(a, b) > 15 ? bearing(a, b) : (a[5] ?? b[5]);
  return {
    lat: a[1] + (b[1] - a[1]) * f,
    lon: a[2] + (b[2] - a[2]) * f,
    alt: lerp(a[3], b[3], f),
    speed: lerp(a[4], b[4], f),
    heading,
    ground: (f < 0.5 ? a[6] : b[6]) === 1,
    index: lo,
    gap: span,
  };
}

/** Stretches of the flight with no recorded point for REPLAY_GAP_S or more: [from, to] unix seconds. */
export function gapsOf(points: FlightPoint[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 1; i < points.length; i++) {
    if (points[i][0] - points[i - 1][0] >= REPLAY_GAP_S) out.push([points[i - 1][0], points[i][0]]);
  }
  return out;
}

/** The playback clock: `at` runs from `start` to `end` at `speed` times real
 *  time while playing, and stops at the end. Updates about 20 times a second.
 *  A new flight (another start or end) starts over at its start, playing. */
export function useReplayClock(start: number, end: number) {
  const [s, setS] = useState({ start, end, at: start, playing: end > start });
  const [speed, setSpeed] = useState<number>(10);
  // A different flight: start over. Adjusting state while rendering, as React
  // recommends for state that follows a prop, instead of in an effect.
  const same = s.start === start && s.end === end;
  if (!same) setS({ start, end, at: start, playing: end > start });
  const at = same ? s.at : start;
  const playing = same ? s.playing : end > start;

  // Where the playhead really is, for the flight it belongs to: the loop moves
  // it every frame, the page hears about it 20 times a second.
  const cur = useRef({ start, t: at });
  const here = () => (cur.current.start === start ? cur.current.t : start);
  useEffect(() => { if (!playing) cur.current = { start, t: at }; }, [at, playing, start]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let shown = last;
    const step = (now: number) => {
      const t = Math.min(end, here() + ((now - last) / 1000) * speed);
      cur.current = { start, t };
      last = now;
      const done = t >= end;
      if (now - shown >= 50 || done) {
        shown = now;
        setS((p) => (p.start === start ? { ...p, at: t, playing: !done } : p));
      }
      if (!done) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, start, end]);

  const seek = (t: number) => {
    const to = Math.min(end, Math.max(start, t));
    cur.current = { start, t: to };
    setS((p) => ({ ...p, at: to }));
  };
  const toggle = () => {
    let from = here();
    if (!playing && from >= end) from = start;            // play again from the top
    cur.current = { start, t: from };
    setS((p) => ({ ...p, at: from, playing: !playing }));
  };
  return { at, playing, speed, setSpeed, seek, toggle };
}
