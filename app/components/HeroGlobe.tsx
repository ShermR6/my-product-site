"use client";

// The homepage globe: live airliners from adsb.lol, refreshed every minute.
// A few flights at a time are highlighted with their route and a label,
// chosen from the side of the globe facing the viewer and changed every few
// seconds, so the highlights move around the world as it turns. Hovering or
// tapping any dot shows that flight. Until live data arrives, or if it cannot
// be had, the globe shows the original city routes.

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aircraftTypeName, airlineName } from "@/lib/flightNames";
import type { GlobeFlight } from "@/app/api/globe-flights/route";

const Globe = dynamic(() => import("./ui/cobe-globe").then((m) => m.Globe), { ssr: false });

type RGB = [number, number, number];
const SKY: RGB = [0.22, 0.74, 0.97];
const DIM: RGB = [0.62, 0.78, 0.9];

const REFRESH_MS = 60_000;
const ROTATE_MS = 9_000;
const FEATURED = 3;
const ELEVATION = 0.01;   // must match markerElevation below

// The original globe, used until live data arrives.
const CITY_MARKERS = [
  { location: [40.7128, -74.006] as [number, number] },
  { location: [51.5074, -0.1278] as [number, number] },
  { location: [25.2048, 55.2708] as [number, number] },
  { location: [35.6762, 139.6503] as [number, number] },
  { location: [-33.8688, 151.2093] as [number, number] },
  { location: [25.7617, -80.1918] as [number, number] },
  { location: [-23.5505, -46.6333] as [number, number] },
  { location: [34.0522, -118.24] as [number, number] },
];
const CITY_ARCS = [
  { from: [40.7128, -74.006] as [number, number], to: [51.5074, -0.1278] as [number, number] },
  { from: [25.7617, -80.1918] as [number, number], to: [40.7128, -74.006] as [number, number] },
  { from: [34.0522, -118.24] as [number, number], to: [35.6762, 139.65] as [number, number] },
  { from: [25.2048, 55.27] as [number, number], to: [-33.8688, 151.21] as [number, number] },
  { from: [25.7617, -80.1918] as [number, number], to: [-23.5505, -46.6333] as [number, number] },
];

/**
 * Where cobe draws a location, as fractions of the canvas, and whether it is
 * on the near side. The same math cobe uses for its own marker anchors.
 */
function project(lat: number, lon: number, phi: number, theta: number) {
  const r = (lat * Math.PI) / 180;
  const a = (lon * Math.PI) / 180 - Math.PI;
  const o = Math.cos(r);
  const k = 0.8 + ELEVATION;
  const x = -o * Math.cos(a) * k, y = Math.sin(r) * k, z = o * Math.sin(a) * k;
  const ct = Math.cos(theta), cp = Math.cos(phi), st = Math.sin(theta), sp = Math.sin(phi);
  const c = cp * x + sp * z;
  const s = sp * st * x + ct * y - cp * st * z;
  const front = -sp * ct * x + st * y + cp * ct * z >= 0 || c * c + s * s >= 0.64;
  return { x: (c + 1) / 2, y: (1 - s) / 2, front };
}

function flightLine(f: GlobeFlight) {
  return f.route ? `${f.cs} · ${f.route.from.iata} → ${f.route.to.iata}` : f.cs;
}

export default function HeroGlobe() {
  const [flights, setFlights] = useState<GlobeFlight[] | null>(null);
  const [featured, setFeatured] = useState<string[]>([]);
  const [hover, setHover] = useState<{ id: string; pinned: boolean } | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const view = useRef({ phi: 0, theta: 0.25 });
  const recent = useRef<string[]>([]);
  const labelEls = useRef(new Map<string, HTMLDivElement>());
  const cardEl = useRef<HTMLDivElement>(null);
  const down = useRef<{ x: number; y: number } | null>(null);

  // Still for anyone who has asked for less motion; it can still be dragged.
  const still = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── live data, once a minute while the page is visible ──────────────────
  useEffect(() => {
    let live = true;
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/globe-flights");
        if (!res.ok) return;
        const body = (await res.json()) as { flights?: GlobeFlight[] };
        if (live && body.flights?.length) setFlights(body.flights);
      } catch { /* keep what is shown */ }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { live = false; clearInterval(id); };
  }, []);

  const byId = useMemo(() => new Map((flights ?? []).map((f) => [f.id, f])), [flights]);

  // ── rotate the highlighted flights ──────────────────────────────────────
  const pickFeatured = useCallback(() => {
    if (!flights) return;
    const { phi, theta } = view.current;
    const candidates = flights
      .filter((f) => f.route)
      .map((f) => ({ f, p: project(f.lat, f.lon, phi, theta) }))
      // on the near side and well inside the disc, so the label stays readable
      .filter(({ p }) => p.front && Math.abs(p.x - 0.5) < 0.3 && Math.abs(p.y - 0.5) < 0.3);
    const fresh = candidates.filter(({ f }) => !recent.current.includes(f.id));
    const pool = fresh.length >= FEATURED ? fresh : candidates;
    // shuffle, then take a few that are far enough apart for their labels
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const chosen: typeof pool = [];
    for (const c of pool) {
      if (chosen.length >= FEATURED) break;
      if (chosen.every((o) => Math.abs(o.p.x - c.p.x) > 0.22 || Math.abs(o.p.y - c.p.y) > 0.08)) chosen.push(c);
    }
    const next = chosen.map(({ f }) => f.id);
    if (!next.length) return;
    recent.current = [...next, ...recent.current].slice(0, 18);
    setFeatured(next);
  }, [flights]);

  useEffect(() => {
    if (!flights) return;
    // First pick once the globe has drawn a frame, so the facing side is known.
    const first = setTimeout(pickFeatured, 800);
    const id = setInterval(pickFeatured, ROTATE_MS);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [flights, pickFeatured]);

  // ── what the globe draws ────────────────────────────────────────────────
  const markers = useMemo(() => {
    if (!flights) return CITY_MARKERS;
    const on = new Set(featured);
    return flights.map((f) => ({
      location: [f.lat, f.lon] as [number, number],
      size: on.has(f.id) || hover?.id === f.id ? 0.035 : 0.014,
      color: on.has(f.id) || hover?.id === f.id ? SKY : DIM,
    }));
  }, [flights, featured, hover]);

  const arcs = useMemo(() => {
    if (!flights) return CITY_ARCS;
    const ids = hover && !featured.includes(hover.id) ? [...featured, hover.id] : featured;
    return ids
      .map((id) => byId.get(id)?.route)
      .filter((r): r is NonNullable<GlobeFlight["route"]> => !!r)
      .map((r) => ({ from: [r.from.lat, r.from.lon] as [number, number], to: [r.to.lat, r.to.lon] as [number, number] }));
  }, [flights, featured, hover, byId]);

  // ── keep labels and the card on their dots, every frame ─────────────────
  const onFrame = useCallback((phi: number, theta: number) => {
    view.current = { phi, theta };
    const box = boxRef.current;
    if (!box) return;
    const size = box.clientWidth;
    // `half`: keep something that wide either side of the point inside the
    // globe, so a card near the edge never runs off a phone screen.
    const place = (el: HTMLElement | null | undefined, f: GlobeFlight | undefined, half = 0) => {
      if (!el || !f) return;
      const p = project(f.lat, f.lon, phi, theta);
      const x = Math.min(Math.max(p.x * size, half), size - half);
      el.style.transform = `translate(${x.toFixed(1)}px, ${(p.y * size).toFixed(1)}px)`;
      el.style.opacity = p.front ? "1" : "0";
    };
    for (const [id, el] of labelEls.current) place(el, byId.get(id));
    if (hover) {
      const card = cardEl.current;
      const w = (card?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
      place(card, byId.get(hover.id), Math.min(w / 2, size / 2));
    }
  }, [byId, hover]);

  // ── hover and tap ───────────────────────────────────────────────────────
  const nearest = useCallback((clientX: number, clientY: number, radius: number) => {
    const box = boxRef.current;
    if (!box || !flights) return null;
    const rect = box.getBoundingClientRect();
    const { phi, theta } = view.current;
    let best: { id: string; d: number } | null = null;
    for (const f of flights) {
      const p = project(f.lat, f.lon, phi, theta);
      if (!p.front) continue;
      const d = Math.hypot(rect.left + p.x * rect.width - clientX, rect.top + p.y * rect.height - clientY);
      if (d <= radius && (!best || d < best.d)) best = { id: f.id, d };
    }
    return best?.id ?? null;
  }, [flights]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.buttons) return;
    if (hover?.pinned) return;
    const id = nearest(e.clientX, e.clientY, 12);
    setHover((h) => (id ? (h?.id === id ? h : { id, pinned: false }) : null));
  };
  const onPointerDown = (e: React.PointerEvent) => { down.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = down.current;
    down.current = null;
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return;   // a drag
    const id = nearest(e.clientX, e.clientY, e.pointerType === "mouse" ? 12 : 24);
    setHover((h) => (id ? (h?.id === id && h.pinned ? null : { id, pinned: true }) : null));
  };
  const onPointerLeave = () => setHover((h) => (h?.pinned ? h : null));

  const shown = hover ? byId.get(hover.id) : undefined;

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
          markerSize={0.014}
          markerElevation={ELEVATION}
          speed={still ? 0 : 0.001}
          theta={0.25}
          diffuse={1.5}
          mapSamples={16000}
          onFrame={onFrame}
        />

        {featured.map((id) => {
          const f = byId.get(id);
          if (!f || hover?.id === id) return null;
          return (
            <div
              key={id}
              className="fh-globe-label"
              aria-hidden="true"
              ref={(el) => { if (el) labelEls.current.set(id, el); else labelEls.current.delete(id); }}
            >
              <span>{flightLine(f)}</span>
            </div>
          );
        })}

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
        {flights
          ? <>Live airliners from <a href="https://adsb.lol" target="_blank" rel="noopener noreferrer">adsb.lol</a> (ODbL). Routes from Virtual Radar Server standing data. Hover or tap a flight.</>
          : <>Loading live flights…</>}
      </p>
    </div>
  );
}
