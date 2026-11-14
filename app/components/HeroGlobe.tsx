"use client";

// The homepage globe: six real airline flights at a time, each drawn as a
// line between its two cities with a plane on it, in real time. The plane is
// where the aircraft actually is and moves at its real ground speed, corrected
// each minute from fresh positions. The line stays until that flight lands;
// then it is taken off and a different flight put on. Flights come from
// /api/globe-flights (live adsb.lol positions with routes). Until those
// arrive, or if they cannot be had, planes fly the original city routes
// slowly. Hover or tap a plane to see the flight.

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aircraftTypeName, airlineName } from "@/lib/flightNames";
import type { GlobeAirport, GlobeFlight } from "@/app/api/globe-flights/route";

const Globe = dynamic(() => import("./ui/cobe-globe").then((m) => m.Globe), { ssr: false });

type RGB = [number, number, number];
type V3 = [number, number, number];
const SKY: RGB = [0.22, 0.74, 0.97];

const SLOTS = 10;
const PER_ZONE = 3;           // flights per part of the world
const REFRESH_MS = 60_000;
const ELEVATION = 0.01;       // markerElevation passed to cobe
const ARC_HEIGHT = 0.3;       // arcHeight passed to cobe
const ARRIVED = 0.995;        // progress at which a flight counts as landed
const SAMPLE_ROUTE_MS = 10 * 60_000;   // sample routes, before live data, take this long
const DEFAULT_GS_KT = 450;   // when a flight's ground speed is unknown
const MIN_ROUTE_NM = 800;     // long enough to read as a line
const CITY_GAP_DEG = 6;       // about 360 nm between any two flights' airports: room for their codes
const MID_GAP_DEG = 10;       // about 600 nm between the middles of any two lines
const SPIN = 0.0004;          // radians a frame: slow enough to read a flight card
const PLANE =
  "M0,-15 C1.8,-15 3,-11.5 3,-8 L3,-3.2 L16,3.8 L16,7.2 L3,4.2 L3,9 L7,12.2 L7,14.6 L0,12.8 L-7,14.6 L-7,12.2 L-3,9 L-3,4.2 L-16,7.2 L-16,3.8 L-3,-3.2 L-3,-8 C-3,-11.5 -1.8,-15 0,-15 Z";

// The original globe's routes, flown until live flights arrive.
const city = (iata: string, name: string, lat: number, lon: number): GlobeAirport => ({ iata, city: name, lat, lon });
const NYC = city("JFK", "New York", 40.6413, -73.7781), LON = city("LHR", "London", 51.47, -0.4543);
const MIA = city("MIA", "Miami", 25.7959, -80.287), LAX = city("LAX", "Los Angeles", 33.9416, -118.4085);
const TYO = city("HND", "Tokyo", 35.5494, 139.7798), DXB = city("DXB", "Dubai", 25.2532, 55.3657);
const SYD = city("SYD", "Sydney", -33.9399, 151.1753), GRU = city("GRU", "São Paulo", -23.4356, -46.4731);
const SAMPLE_ROUTES: [GlobeAirport, GlobeAirport][] = [
  [NYC, LON], [MIA, NYC], [LAX, TYO], [DXB, SYD], [MIA, GRU], [LON, DXB], [TYO, SYD], [GRU, LON],
];

type Slot = {
  key: string;
  flight: GlobeFlight | null;   // null: a sample route, no flight details
  from: GlobeAirport;
  to: GlobeAirport;
  s0: number;                   // progress along the route at `start`
  start: number;                // performance.now() of the last position fix
  rate: number;                 // progress per ms
  born: number;                 // performance.now() when it was put on, for the fade-in
};

/**
 * Puts each plane back where its aircraft really is, from a fresh set of
 * positions. Flights not in this set (their region was not refreshed, or they
 * have dropped below cruise) carry on at their last known speed.
 */
function withFreshPositions(current: Slot[], fresh: GlobeFlight[]): Slot[] {
  const byCs = new Map(fresh.map((f) => [f.cs, f]));
  let changed = false;
  const next = current.map((s) => {
    const f = s.flight && byCs.get(s.flight.cs);
    if (!f?.route || f.route.from.iata !== s.from.iata || f.route.to.iata !== s.to.iata) return s;
    changed = true;
    return { ...s, flight: f, s0: progressOf(f), start: performance.now(), rate: rateOf(f) };
  });
  return changed ? next : current;
}

// ── spreading the flights out ──────────────────────────────────────────────

/** Latitude and longitude of a direction from the globe's centre. */
function latLonOf(v: V3) {
  const lat = (Math.asin(Math.max(-1, Math.min(1, v[1]))) * 180) / Math.PI;
  let lon = (Math.atan2(v[2], -v[0]) * 180) / Math.PI + 180;
  if (lon > 180) lon -= 360;
  return { lat, lon };
}

/** The part of the world a route's middle is over. One flight per part. */
function zoneOf(from: GlobeAirport, to: GlobeAirport): string {
  const { lat, lon } = latLonOf(midDir(from, to));
  if (lon >= -170 && lon < -60 && lat >= 13) return "north-america";
  if (lon >= -95 && lon < -30 && lat < 13) return "south-america";
  if (lon >= -60 && lon < -15) return "atlantic";
  if (lon >= -15 && lon < 45 && lat >= 35) return "europe";
  if (lon >= -30 && lon < 65 && lat < 35) return "middle-east-africa";
  if (lon >= 45 && lon < 150 && lat >= -10) return "asia";
  if (lat < -10 && lon >= 100) return "oceania";
  return "pacific";
}

/**
 * Whether a route can join those on the globe without crowding them: its part
 * of the world is free, its cities are well away from every other flight's
 * cities, and its middle well away from every other line's middle.
 */
function fits(from: GlobeAirport, to: GlobeAirport, taken: Slot[]) {
  const zone = zoneOf(from, to);
  if (taken.filter((s) => zoneOf(s.from, s.to) === zone).length >= PER_ZONE) return false;
  const cities = [unit(from.lat, from.lon), unit(to.lat, to.lon)];
  const mid = midDir(from, to);
  return taken.every((s) =>
    apart(mid, midDir(s.from, s.to)) >= MID_GAP_DEG &&
    [unit(s.from.lat, s.from.lon), unit(s.to.lat, s.to.lon)].every((q) => cities.every((p) => apart(p, q) >= CITY_GAP_DEG))
  );
}

/**
 * Adds live flights until there are SLOTS or nothing more fits. A part of the
 * world with no suitable flight is left empty rather than crowding another,
 * so on a quiet hour there may be four flights, not six.
 */
function topUp(current: Slot[], pool: GlobeFlight[], recent: { current: string[] }, now: number): Slot[] {
  const next = [...current];
  while (next.length < SLOTS) {
    const busy = new Set(next.map((s) => s.key));
    const ok = pool.filter((f) => f.route && !busy.has(f.cs) && progressOf(f) < 0.9 && fits(f.route.from, f.route.to, next));
    if (!ok.length) break;
    const unseen = ok.filter((f) => !recent.current.includes(f.cs));
    const choices = unseen.length ? unseen : ok;
    // A random part of the world, then one of its longer routes.
    const zones = [...new Set(choices.map((f) => zoneOf(f.route!.from, f.route!.to)))];
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const inZone = choices
      .filter((f) => zoneOf(f.route!.from, f.route!.to) === zone)
      .sort((a, b) => nm(b.route!.from, b.route!.to) - nm(a.route!.from, a.route!.to))
      .slice(0, 5);
    const f = inZone[Math.floor(Math.random() * inZone.length)];
    next.push({ key: f.cs, flight: f, from: f.route!.from, to: f.route!.to, s0: progressOf(f), start: now, rate: rateOf(f), born: now });
    recent.current = [f.cs, ...recent.current].slice(0, 24);
  }
  return next;
}

/** The original city routes, spread the same way, flown slowly until live flights arrive. */
function sampleSlots(now: number): Slot[] {
  const out: Slot[] = [];
  for (const [from, to] of [...SAMPLE_ROUTES].sort(() => Math.random() - 0.5)) {
    if (out.length >= SLOTS || !fits(from, to, out)) continue;
    out.push({ key: `${from.iata}-${to.iata}`, flight: null, from, to, s0: Math.random() * 0.6, start: now, rate: 1 / SAMPLE_ROUTE_MS, born: now });
  }
  return out;
}

/** Progress per millisecond for a live flight at its ground speed. */
function rateOf(f: GlobeFlight) {
  const len = f.route ? nm(f.route.from, f.route.to) : 0;
  return len > 0 ? (f.gs ?? DEFAULT_GS_KT) / len / 3_600_000 : 0;
}

// ── geometry: the same math cobe uses ────────────────────────────────────────

function unit(lat: number, lon: number): V3 {
  const r = (lat * Math.PI) / 180;
  const a = (lon * Math.PI) / 180 - Math.PI;
  const o = Math.cos(r);
  return [-o * Math.cos(a), Math.sin(r), o * Math.sin(a)];
}

/** A point on cobe's arc: a quadratic curve lifted ARC_HEIGHT above the midpoint. */
function arcPoint(from: GlobeAirport, to: GlobeAirport, s: number): V3 | null {
  const a = unit(from.lat, from.lon), b = unit(to.lat, to.lon);
  const m: V3 = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const len = Math.hypot(m[0], m[1], m[2]);
  if (len < 1e-3) return null;
  const r0 = 0.8 + ELEVATION, r1 = (0.8 + ARC_HEIGHT + ELEVATION) / len;
  const u = 1 - s, w0 = u * u * r0, w1 = 2 * s * u * r1, w2 = s * s * r0;
  return [a[0] * w0 + m[0] * w1 + b[0] * w2, a[1] * w0 + m[1] * w1 + b[1] * w2, a[2] * w0 + m[2] * w1 + b[2] * w2];
}

/** A point on the globe's surface, lifted like cobe's markers. */
function surface(lat: number, lon: number): V3 {
  const u = unit(lat, lon), k = 0.8 + ELEVATION;
  return [u[0] * k, u[1] * k, u[2] * k];
}

/** Where cobe draws a 3D point, as fractions of the canvas, and if it is in front. */
function project([x, y, z]: V3, phi: number, theta: number) {
  const ct = Math.cos(theta), cp = Math.cos(phi), st = Math.sin(theta), sp = Math.sin(phi);
  const c = cp * x + sp * z;
  const s = sp * st * x + ct * y - cp * st * z;
  const front = -sp * ct * x + st * y + cp * ct * z >= 0 || c * c + s * s >= 0.64;
  return { x: (c + 1) / 2, y: (1 - s) / 2, front };
}

function nm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 3440.065;
  const p1 = (a.lat * Math.PI) / 180, p2 = (b.lat * Math.PI) / 180;
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((((b.lon - a.lon) * Math.PI) / 180) / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The middle of a route, as a direction from the globe's centre. */
function midDir(from: GlobeAirport, to: GlobeAirport): V3 {
  const a = unit(from.lat, from.lon), b = unit(to.lat, to.lon);
  const m: V3 = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const len = Math.hypot(m[0], m[1], m[2]) || 1;
  return [m[0] / len, m[1] / len, m[2] / len];
}

/** Degrees between two directions. */
function apart(a: V3, b: V3) {
  return (Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180) / Math.PI;
}

/** How far along its route a live flight is now, 0..1. */
function progressOf(f: GlobeFlight) {
  if (!f.route) return 0;
  const done = nm(f.route.from, f), left = nm(f.route.to, f);
  return done + left > 0 ? done / (done + left) : 0;
}

export default function HeroGlobe() {
  const [pool, setPool] = useState<GlobeFlight[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [hover, setHover] = useState<{ key: string; pinned: boolean } | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const view = useRef({ phi: 0, theta: 0.25 });
  const recent = useRef<string[]>([]);
  const planeEls = useRef(new Map<string, HTMLDivElement>());
  const cityEls = useRef(new Map<string, HTMLDivElement>());
  const cardEl = useRef<HTMLDivElement>(null);
  const down = useRef<{ x: number; y: number } | null>(null);
  const slotsRef = useRef<Slot[]>([]);
  const poolRef = useRef<GlobeFlight[]>([]);
  useEffect(() => { slotsRef.current = slots; }, [slots]);
  useEffect(() => { poolRef.current = pool; }, [pool]);

  // Still for anyone who has asked for less motion: no spin, no flying.
  const still = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── live flights with routes, once a minute while the page is visible ───
  useEffect(() => {
    let live = true;
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/globe-flights");
        if (!res.ok) return;
        const body = (await res.json()) as { flights?: GlobeFlight[] };
        const routed = (body.flights ?? []).filter((f) => f.route && nm(f.route.from, f.route.to) >= MIN_ROUTE_NM);
        if (!live || !routed.length) return;
        poolRef.current = routed;
        setPool(routed);
        // Real positions for the flights up, the sample routes off, and any
        // empty part of the world filled if a flight there now fits.
        setSlots((current) =>
          topUp(withFreshPositions(current.filter((x) => x.flight), routed), routed, recent, performance.now())
        );
      } catch { /* keep what is shown */ }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { live = false; clearInterval(id); };
  }, []);

  // The sample routes, if live flights have not arrived by the first frames.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!slotsRef.current.length && !poolRef.current.length) setSlots(sampleSlots(performance.now()));
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Replace each flight when it lands.
  useEffect(() => {
    if (still) return;
    const id = setInterval(() => {
      const now = performance.now();
      const current = slotsRef.current;
      const landed = (x: Slot) => x.s0 + x.rate * (now - x.start) >= ARRIVED;
      if (!current.some(landed)) return;
      const kept = current.filter((x) => !landed(x));
      const next = poolRef.current.length
        ? topUp(kept, poolRef.current, recent, now)
        : [...kept, ...sampleSlots(now).filter((x) => fits(x.from, x.to, kept))].slice(0, SLOTS);
      setHover((h) => (h && next.some((x) => x.key === h.key) ? h : null));
      setSlots(next);
    }, 1000);
    return () => clearInterval(id);
  }, [still]);

  // ── what cobe draws: the lines and their two cities ─────────────────────
  const cities = useMemo(() => {
    const m = new Map<string, GlobeAirport>();
    for (const s of slots) { m.set(s.from.iata, s.from); m.set(s.to.iata, s.to); }
    return [...m.values()];
  }, [slots]);
  const markers = useMemo(() => cities.map((c) => ({ location: [c.lat, c.lon] as [number, number] })), [cities]);
  const arcs = useMemo(
    () => slots.map((s) => ({ from: [s.from.lat, s.from.lon] as [number, number], to: [s.to.lat, s.to.lon] as [number, number] })),
    [slots]
  );

  // ── every frame: planes along their lines, city labels, the card ────────
  const progress = useCallback((s: Slot, now: number) => {
    if (still) return s.s0;
    return Math.min(1, s.s0 + s.rate * (now - s.start));
  }, [still]);

  const onFrame = useCallback((phi: number, theta: number) => {
    view.current = { phi, theta };
    const box = boxRef.current;
    if (!box) return;
    const size = box.clientWidth;
    const now = performance.now();

    for (const s of slotsRef.current) {
      const el = planeEls.current.get(s.key);
      if (!el) continue;
      const t = progress(s, now);
      const at = arcPoint(s.from, s.to, t);
      const ahead = arcPoint(s.from, s.to, Math.min(1, t + 0.01));
      const behind = arcPoint(s.from, s.to, Math.max(0, t - 0.01));
      if (!at || !ahead || !behind) continue;
      const p = project(at, phi, theta), p2 = project(ahead, phi, theta), p1 = project(behind, phi, theta);
      const angle = (Math.atan2((p2.y - p1.y) * size, (p2.x - p1.x) * size) * 180) / Math.PI + 90;
      // Fade in as it appears and out on the final stretch.
      const fade = Math.max(0, Math.min(1, (1 - t) / 0.005, (now - s.born) / 400));
      el.style.transform = `translate(${(p.x * size).toFixed(1)}px, ${(p.y * size).toFixed(1)}px) rotate(${angle.toFixed(1)}deg)`;
      el.style.opacity = p.front ? String(fade) : "0";
      if (hover?.key === s.key && cardEl.current) {
        const w = (cardEl.current.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
        const half = Math.min(w / 2, size / 2);
        const x = Math.min(Math.max(p.x * size, half), size - half);
        cardEl.current.style.transform = `translate(${x.toFixed(1)}px, ${(p.y * size).toFixed(1)}px)`;
        cardEl.current.style.opacity = p.front ? "1" : "0";
      }
    }
    for (const c of cities) {
      const el = cityEls.current.get(c.iata);
      if (!el) continue;
      const p = project(surface(c.lat, c.lon), phi, theta);
      el.style.transform = `translate(${(p.x * size).toFixed(1)}px, ${(p.y * size).toFixed(1)}px)`;
      el.style.opacity = p.front ? "1" : "0";
    }
  }, [cities, hover, progress]);

  // ── hover and tap on a plane ────────────────────────────────────────────
  const nearest = useCallback((clientX: number, clientY: number, radius: number) => {
    const box = boxRef.current;
    if (!box) return null;
    const rect = box.getBoundingClientRect();
    const { phi, theta } = view.current;
    const now = performance.now();
    let best: { key: string; d: number } | null = null;
    for (const s of slotsRef.current) {
      if (!s.flight) continue;
      const at = arcPoint(s.from, s.to, progress(s, now));
      if (!at) continue;
      const p = project(at, phi, theta);
      if (!p.front) continue;
      const d = Math.hypot(rect.left + p.x * rect.width - clientX, rect.top + p.y * rect.height - clientY);
      if (d <= radius && (!best || d < best.d)) best = { key: s.key, d };
    }
    return best?.key ?? null;
  }, [progress]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.buttons || hover?.pinned) return;
    const key = nearest(e.clientX, e.clientY, 16);
    setHover((h) => (key ? (h?.key === key ? h : { key, pinned: false }) : null));
  };
  const onPointerDown = (e: React.PointerEvent) => { down.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = down.current;
    down.current = null;
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return;   // a drag
    const key = nearest(e.clientX, e.clientY, e.pointerType === "mouse" ? 16 : 28);
    setHover((h) => (key ? (h?.key === key && h.pinned ? null : { key, pinned: true }) : null));
  };
  const onPointerLeave = () => setHover((h) => (h?.pinned ? h : null));

  const shown = hover ? slots.find((s) => s.key === hover.key)?.flight : null;
  const live = pool.length > 0;

  return (
    <div className="fh-globe">
      <div
        ref={boxRef}
        className="fh-globe-box"
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        <Globe
          markers={markers}
          arcs={arcs}
          dark={1}
          baseColor={[0.32, 0.32, 0.32]}
          markerColor={SKY}
          arcColor={SKY}
          glowColor={[0.09, 0.09, 0.09]}
          mapBrightness={5}
          markerSize={0.04}
          markerElevation={ELEVATION}
          arcHeight={ARC_HEIGHT}
          speed={still ? 0 : SPIN}
          paused={!!hover}
          theta={0.25}
          diffuse={1.5}
          mapSamples={16000}
          onFrame={onFrame}
        />

        {cities.map((c) => (
          <div
            key={c.iata}
            className="fh-globe-label"
            aria-hidden="true"
            ref={(el) => { if (el) cityEls.current.set(c.iata, el); else cityEls.current.delete(c.iata); }}
          >
            <span>{c.iata || c.city}</span>
          </div>
        ))}

        {slots.map((s) => (
          <div
            key={s.key}
            className="fh-globe-plane"
            aria-hidden="true"
            ref={(el) => { if (el) planeEls.current.set(s.key, el); else planeEls.current.delete(s.key); }}
          >
            <svg width="18" height="18" viewBox="-18 -18 36 36"><path d={PLANE} /></svg>
          </div>
        ))}

        {shown && (
          <div ref={cardEl} className="fh-globe-card" role="status">
            <div className="fh-globe-card-in">
              <div className="fh-globe-card-cs">{shown.cs}</div>
              {airlineName(shown.al) && <div className="fh-globe-card-al">{airlineName(shown.al)}</div>}
              {shown.route && (
                <div className="fh-globe-card-route">
                  {shown.route.from.iata} {shown.route.from.city && <small>{shown.route.from.city}</small>}
                  <span aria-hidden="true"> → </span>
                  {shown.route.to.iata} {shown.route.to.city && <small>{shown.route.to.city}</small>}
                </div>
              )}
              <div className="fh-globe-card-facts">
                {[aircraftTypeName(shown.t), `${shown.alt.toLocaleString("en-US")} ft`, shown.gs != null ? `${shown.gs} kt` : null]
                  .filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="fh-globe-credit">
        {live
          ? <>Real flights in the air now, from <a href="https://adsb.lol" target="_blank" rel="noopener noreferrer">adsb.lol</a> (ODbL), where they are right now. Routes from Virtual Radar Server standing data. Hover or tap a plane.</>
          : <>Loading live flights…</>}
      </p>
    </div>
  );
}
