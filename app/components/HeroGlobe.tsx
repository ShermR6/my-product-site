"use client";

// The homepage globe: six real airline flights at a time, each drawn as a
// line between its two cities with a plane flying along it. The plane starts
// where the real aircraft is now and flies on to its destination, faster than
// life; when it arrives, that flight is taken off and a different one put on,
// so the flights are always rotating. Flights come from /api/globe-flights
// (live adsb.lol positions with routes). Until those arrive, or if they cannot
// be had, the planes fly the original city routes. Hover or tap a plane to
// see the flight.

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aircraftTypeName, airlineName } from "@/lib/flightNames";
import type { GlobeAirport, GlobeFlight } from "@/app/api/globe-flights/route";

const Globe = dynamic(() => import("./ui/cobe-globe").then((m) => m.Globe), { ssr: false });

type RGB = [number, number, number];
type V3 = [number, number, number];
const SKY: RGB = [0.22, 0.74, 0.97];

const SLOTS = 6;
const REFRESH_MS = 60_000;
const ELEVATION = 0.01;       // markerElevation passed to cobe
const ARC_HEIGHT = 0.3;       // arcHeight passed to cobe
const SECONDS_PER_ROUTE = 30; // a whole route, gate to gate, takes this long on screen
const MIN_FLIGHT_S = 9;
const MIN_ROUTE_NM = 400;     // short hops barely show as a line
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
  s0: number;                   // progress along the route when it started
  start: number;                // performance.now() when it started
  dur: number;                  // ms to reach the destination
};

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
        if (live && routed.length) setPool(routed);
      } catch { /* keep what is shown */ }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { live = false; clearInterval(id); };
  }, []);

  // ── choosing the next flight for a slot ─────────────────────────────────
  const nextSlot = useCallback((taken: Slot[], now: number, stagger = 0): Slot | null => {
    const busy = new Set(taken.map((s) => s.key));
    const { phi, theta } = view.current;
    const facing = (from: GlobeAirport, to: GlobeAirport) => {
      const mid = arcPoint(from, to, 0.5);
      return mid ? project(mid, phi, theta).front : false;
    };
    // Spread around the world: how far this route is from the ones flying.
    const mids = taken.map((s) => midDir(s.from, s.to));
    const room = (from: GlobeAirport, to: GlobeAirport) => {
      const m = midDir(from, to);
      return mids.length ? Math.min(...mids.map((o) => apart(m, o))) : 180;
    };
    const live = poolRef.current;
    let slot: Slot | null = null;

    if (live.length) {
      const fresh = live.filter((f) => !busy.has(f.cs) && !recent.current.includes(f.cs));
      const options = fresh.length ? fresh : live.filter((f) => !busy.has(f.cs));
      // Well apart from the others first (about 2,000 nm, then 1,000), longer
      // routes before short ones, and the side facing the viewer if possible.
      let list = options;
      for (const deg of [33, 16]) {
        const spaced = options.filter((f) => room(f.route!.from, f.route!.to) >= deg);
        if (spaced.length) { list = spaced; break; }
      }
      const long = list.filter((f) => nm(f.route!.from, f.route!.to) >= 1500);
      if (long.length >= 2) list = long;
      const near = list.filter((f) => facing(f.route!.from, f.route!.to));
      if (near.length && Math.random() < 0.6) list = near;
      const f = list[Math.floor(Math.random() * list.length)];
      if (f?.route) {
        const s0 = Math.min(progressOf(f), 0.75);
        slot = { key: f.cs, flight: f, from: f.route.from, to: f.route.to, s0, start: now, dur: 0 };
      }
    }
    if (!slot) {
      const used = new Set(taken.map((s) => `${s.from.iata}-${s.to.iata}`));
      const open = SAMPLE_ROUTES.filter(([a, b]) => !used.has(`${a.iata}-${b.iata}`));
      const [from, to] = open[Math.floor(Math.random() * open.length)] ?? SAMPLE_ROUTES[0];
      slot = { key: `${from.iata}-${to.iata}`, flight: null, from, to, s0: Math.random() * 0.3, start: now, dur: 0 };
    }
    slot.dur = Math.max(MIN_FLIGHT_S, (1 - slot.s0) * SECONDS_PER_ROUTE) * 1000 + stagger;
    recent.current = [slot.key, ...recent.current].slice(0, 24);
    return slot;
  }, []);

  // Fill the slots when the globe starts, and again once when live flights
  // first arrive (replacing the sample routes).
  const hadLive = useRef(false);
  useEffect(() => {
    const live = pool.length > 0;
    if (slotsRef.current.length && (hadLive.current || !live)) return;
    hadLive.current = live;
    const timer = setTimeout(() => {
      const now = performance.now();
      const filled: Slot[] = [];
      for (let i = 0; i < SLOTS; i++) {
        // Staggered, so the flights do not all land together.
        const s = nextSlot(filled, now, i * 2500);
        if (s) filled.push(s);
      }
      setSlots(filled);
    }, 600);   // after the globe's first frame, so the facing side is known
    return () => clearTimeout(timer);
  }, [pool, nextSlot]);

  // Replace each flight as it arrives.
  useEffect(() => {
    if (still || !slots.length) return;
    const id = setInterval(() => {
      const now = performance.now();
      const current = slotsRef.current;
      if (!current.some((s) => now - s.start >= s.dur)) return;
      const kept = current.filter((s) => now - s.start < s.dur);
      const next = [...kept];
      for (let i = kept.length; i < SLOTS; i++) {
        const s = nextSlot(next, now);
        if (s) next.push(s);
      }
      setHover((h) => (h && next.some((s) => s.key === h.key) ? h : null));
      setSlots(next);
    }, 250);
    return () => clearInterval(id);
  }, [slots.length, still, nextSlot]);

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
    return Math.min(1, s.s0 + (1 - s.s0) * ((now - s.start) / s.dur));
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
      const fade = Math.max(0, Math.min(1, (1 - t) / 0.04, (now - s.start) / 400));
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
          speed={still ? 0 : 0.001}
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
            <span>{c.city || c.iata}</span>
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
          ? <>Real flights in the air now, from <a href="https://adsb.lol" target="_blank" rel="noopener noreferrer">adsb.lol</a> (ODbL), shown faster than life. Routes from Virtual Radar Server standing data. Hover or tap a plane.</>
          : <>Loading live flights…</>}
      </p>
    </div>
  );
}
