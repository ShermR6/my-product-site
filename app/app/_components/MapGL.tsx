"use client";

// The real map: MapLibre GL with the app's own dark vector style. Aircraft are
// 3D models drawn straight into the map (so they tilt and turn with it), glide
// between position reports instead of jumping, and leave a fading trail.
// MapLibre needs a browser, so screens load this with next/dynamic, ssr: false.

import { useEffect, useRef, useState } from "react";
import * as ml from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as T from "three";
import { destroyModel, lightScene, loadReal, makeModel, type Model } from "../_lib/fleet3d";
import { familyOf, modelOf, type Family } from "../_lib/paint";
import { endHeading, headingGap } from "../_lib/format";
import type { Runway } from "../_lib/types";
import { MAP_STYLE } from "../_lib/mapStyle";
import { trailOf } from "../_lib/trails";

export type MapPlane = {
  tail: string;
  lat: number;
  lon: number;
  heading: number | null;
  /** Inbound: drawn with the blue halo. */
  live: boolean;
  /** On the ground. */
  dim?: boolean;
  /** Aircraft type, which picks the 3D shape. */
  type?: string | null;
  /** Paint colour. */
  color?: string;
  speedKt?: number | null;
  /** Height above the field, in feet. */
  altFt?: number | null;
  /** When this position was reported (ms since 1970), if known. */
  seenAt?: number | null;
};

export type MapCoverage = { lat: number; lon: number; rangeNm: number[] };

/** The picked aircraft's whole flight: points are [latitude, longitude, unix
 *  seconds], oldest first. `at` is when it was loaded (ms, this browser's
 *  clock); positions the page has seen since then are added to its end. */
export type MapFlight = { tail: string; color?: string; at: number; points: [number, number, number][] };

type Props = {
  center: { lat: number; lon: number } | null;
  code?: string | null;
  rings: number[];
  planes?: MapPlane[];
  selected?: string | null;
  onSelect?: (tail: string | null) => void;
  /** The picked aircraft's whole flight, drawn in place of its short trail. */
  flight?: MapFlight | null;
  /** Keep the camera on the picked aircraft, at its own height, however far in the view is zoomed. */
  follow?: boolean;
  /** The user dragged the map away from the aircraft, which ends following. */
  onFollowEnd?: () => void;
  /** Pixels of the map's bottom edge that something covers while following (the aircraft's panel on a phone). */
  followInsetBottom?: number;
  showRings?: boolean;
  coverage?: MapCoverage | null;
  /** Bump to re-fit the view to the rings. */
  fitSeq?: number;
  /** false = a still picture: no dragging, no zoom buttons. */
  interactive?: boolean;
  /** The map sits inside a page that scrolls. On a touch screen one finger
   *  then scrolls the page and two fingers move the map, so the map cannot
   *  trap the scroll. */
  embedded?: boolean;
  /** Tilt the map over for the 3D view. */
  tilt?: boolean;
  /** The home airport's runways, drawn brighter than the basemap's and named at each end. */
  runways?: Runway[] | null;
  /** Landing headings that alerts are limited to; each gets its approach path drawn. */
  approach?: number[];
};

// The worker is a file of its own; scripts/copy-map-worker.mjs keeps this copy in step with the package.
if (typeof window !== "undefined") ml.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const PI = Math.PI;
const KT = 0.514444;            // knots to metres per second
const STALE_MS = 90_000;        // a position older than this is where it was, not where it is
const ROLL_KT = 3;              // on the ground, slower than this is standing still

// On the ground an aircraft is drawn on the runway or taxiway it is using, not
// beside it where the reported position put it (a few metres of error is
// normal). Taxiing or rolling it snaps from further out than standing still,
// so one parked just off a taxiway stays where it is.
const SNAP_RUNWAY_M = 45;       // moving, from a runway's centreline
const SNAP_TAXIWAY_M = 30;      // moving, from a taxiway's
const SNAP_STILL_M = 12;        // standing still, from either
const SNAP_ALIGN_DEG = 35;      // a moving aircraft this close to the line's direction points along it
const NET_REACH_M = 6000;       // lines this far from the airport are not looked at

/** A runway or taxiway centreline piece, in lng/lat. */
type NetLine = { a: [number, number]; b: [number, number]; runway: boolean };
/** The same in the scene's local metres. */
type NetSeg = { ax: number; az: number; bx: number; bz: number; runway: boolean };

/**
 * The closest point on the ground network to (x, z), if one is near enough.
 * Moving, with a heading, it reaches further, but only to a line it is
 * moving along: one it is crossing is not the one it is on. `along` is the
 * heading turned onto that line.
 */
function snapToNet(net: NetSeg[], x: number, z: number, heading: number | null) {
  let best: { x: number; z: number; along: number | null; d: number } | null = null;
  for (const s of net) {
    const dx = s.bx - s.ax, dz = s.bz - s.az;
    const len2 = dx * dx + dz * dz;
    if (len2 < 1) continue;
    const t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / len2));
    const px = s.ax + dx * t, pz = s.az + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d > SNAP_RUNWAY_M || (best && d >= best.d)) continue;
    // x is east and z is south, so north is -z.
    const along = heading == null ? null : alongLine(heading, ((Math.atan2(dx, -dz) * 180) / PI + 360) % 360);
    const reach = along != null ? (s.runway ? SNAP_RUNWAY_M : SNAP_TAXIWAY_M) : SNAP_STILL_M;
    if (d > reach) continue;
    best = { x: px, z: pz, along, d };
  }
  return best;
}

/** `heading` turned onto the line, whichever way along it is closer, or null when it is crossing the line. */
function alongLine(heading: number, dir: number): number | null {
  const one = headingGap(heading, dir);
  const back = (dir + 180) % 360;
  if (one <= SNAP_ALIGN_DEG) return dir;
  if (headingGap(heading, back) <= SNAP_ALIGN_DEG) return back;
  return null;
}

/** Moving and recently heard: in the air above 20 kt, or rolling or taxiing on the ground. */
function underway(p: MapPlane) {
  const fresh = p.seenAt == null || Date.now() - p.seenAt < STALE_MS;
  const kt = p.speedKt ?? 0;
  return fresh && (p.dim ? kt >= ROLL_KT : kt > 20);
}
const ICON_PX = 60;             // wingspan on screen, zoomed in
const ICON_FAR_PX = 22;         // and zoomed right out: aircraft shrink as the view widens
const MIN_SPAN_M = 14;          // zoomed right in, models stop shrinking at about real size
const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

function destination(lat: number, lon: number, bearingDeg: number, nm: number): [number, number] {
  const b = (bearingDeg * PI) / 180;
  const dLat = (nm * Math.cos(b)) / 60;
  const dLon = (nm * Math.sin(b)) / (60 * Math.cos((lat * PI) / 180));
  return [lon + dLon, lat + dLat]; // [lng, lat], the order MapLibre uses
}

function circle(lat: number, lon: number, nm: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 128; i++) pts.push(destination(lat, lon, (i / 128) * 360, nm));
  return pts;
}

/** Runways as map features: the strips, a name at each end, and the approach paths in use. */
function runwayFeatures(lat: number, lon: number, runways: Runway[], approach: number[], reachNm: number) {
  const strips: GeoJSON.Feature[] = [];
  const ends: GeoJSON.Feature[] = [];
  const paths: GeoJSON.Feature[] = [];
  const alone = runways.length === 1;
  for (const r of runways) {
    const leH = endHeading(r.leIdent, r.leHdg);
    const heH = endHeading(r.heIdent, r.heHdg) ?? (leH != null ? (leH + 180) % 360 : null);
    let le: [number, number] | null = null;
    let he: [number, number] | null = null;
    if (r.leLat != null && r.leLon != null && r.heLat != null && r.heLon != null) {
      le = [r.leLon, r.leLat]; he = [r.heLon, r.heLat];
    } else if (leH != null && r.lengthFt && (alone || !/[LRC]$/i.test(r.leIdent ?? ""))) {
      // No surveyed ends: centre the strip on the airport. Parallel runways can't be placed this way.
      const half = r.lengthFt / 6076.12 / 2;
      le = destination(lat, lon, leH + 180, half); he = destination(lat, lon, leH, half);
    }
    if (!le || !he) continue;
    strips.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [le, he] } });
    for (const [ident, hdg, at] of [[r.leIdent, leH, le], [r.heIdent, heH, he]] as const) {
      if (!ident || hdg == null) continue;
      const out = ((hdg + 180) * PI) / 180; // away from the runway, the way an arrival comes from
      const used = approach.some((h) => headingGap(h, hdg) < 1);
      ends.push({ type: "Feature", properties: { ident, off: [Math.sin(out) * 1.2, -Math.cos(out) * 1.2], used }, geometry: { type: "Point", coordinates: at } });
      if (used) paths.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [at, destination(at[1], at[0], hdg + 180, reachNm)] } });
    }
  }
  return { strips, ends, paths };
}

type Track = {
  plane: MapPlane;
  family: Family;
  /** Which real model it uses, or "" for a built-in shape. */
  modelId: string;
  color: string;
  model: Model;
  el: HTMLButtonElement;
  // The last reported position, in the scene's local metres, and when we got it.
  fixLat: number; fixLon: number; fx: number; fz: number; fixAt: number;
  /** How many times the position has changed while we watched. Zero = never seen it move. */
  moves: number;
  /** Seconds between the last two changes: how long to keep gliding before the next one is due. */
  gap: number;
  // Where it is drawn right now. y is its height in metres, as the map measures height.
  x: number; z: number; hdg: number; y: number;
  // How fast that is changing (metres a second) and when it was last drawn:
  // a camera following it aims at where it will be drawn next, not where it was.
  vx: number; vz: number; drawnAt: number;
};

type Stage = {
  map: ml.Map;
  tracks: Map<string, Track>;
  /** Mercator position of the scene origin and mercator units per metre there. */
  ox: number; oy: number; s: number; lat0: number;
  toLocal: (lat: number, lon: number) => { x: number; z: number };
  toLngLat: (x: number, z: number) => [number, number];
  setOrigin: (lat: number, lon: number) => void;
  drawTrails: () => void;
  labels: ml.Marker[];
  scene: T.Scene;
  /** Height of the ground at the airport, in metres. Zero while the map is flat. */
  ground: number;
  /** Start and stop keeping the camera on the picked aircraft. */
  startFollow: (insetBottom: number) => void;
  endFollow: () => void;
  /** The home airport's runways and taxiways: from the basemap, at the zoom they were read at, and our own runway strips. */
  netLines: NetLine[]; netZoom: number; stripLines: NetLine[];
  /** Read the basemap's runways and taxiways near the airport, when the view shows them. */
  readNet: () => void;
  /** All of it in local metres, for snapping aircraft on the ground. */
  groundNet: () => NetSeg[];
};

const FOLLOW_EASE_MS = 700;      // how long the camera takes to get onto the aircraft

export default function MapGL({
  center, code, rings, planes = [], selected, onSelect, showRings = true, coverage, fitSeq = 0, interactive = true, embedded = false, tilt = false,
  runways, approach, flight, follow = false, onFollowEnd, followInsetBottom = 0,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const [ready, setReady] = useState(false);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  const flightRef = useRef(flight);
  useEffect(() => { flightRef.current = flight; stage.current?.drawTrails(); }, [flight]);
  const selectedRef = useRef(selected);
  useEffect(() => { selectedRef.current = selected; stage.current?.drawTrails(); }, [selected]);
  const followRef = useRef(follow);
  const onFollowEndRef = useRef(onFollowEnd);
  useEffect(() => { onFollowEndRef.current = onFollowEnd; }, [onFollowEnd]);

  // Create the map once.
  useEffect(() => {
    if (!el.current || !overlay.current) return;
    const box = overlay.current;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const map = new ml.Map({
      container: el.current,
      style: MAP_STYLE,
      center: [-98.35, 39.5],
      zoom: 3,
      interactive,
      cooperativeGestures: embedded && window.matchMedia("(pointer: coarse)").matches,
      maxPitch: 75,
      attributionControl: { compact: true },
      canvasContextAttributes: { antialias: true },
    });
    if (interactive) {
      map.addControl(new ml.NavigationControl({ visualizePitch: true }), "bottom-right");
      map.addControl(new ml.ScaleControl({ unit: "nautical", maxWidth: 120 }), "bottom-left");
      map.on("click", () => onSelectRef.current?.(null));
      // Dragging the map away lets go of a followed aircraft. Two fingers are a pinch, not a drag.
      map.on("dragstart", (e) => {
        if (!followRef.current) return;
        const from = (e as { originalEvent?: Event }).originalEvent;
        if (from && "touches" in from && (from as TouchEvent).touches.length > 1) return;
        onFollowEndRef.current?.();
      });
    }

    // The aircraft are three.js models drawn into the map's own WebGL canvas.
    const scene = new T.Scene();
    lightScene(scene);

    // Follow. The camera's centre is held on the picked aircraft, at the
    // aircraft's own height: a camera centred on the ground under it would
    // lose a high aircraft as soon as the view is tilted or zoomed close.
    // `glide` carries the camera over from where it was when following began.
    let glide: { lng: number; lat: number; elev: number; at: number } | null = null;
    let settle = false;
    const aim = (): { lng: number; lat: number; elev: number } | null => {
      if (!followRef.current) return null;
      const tr = S.tracks.get(selectedRef.current ?? "");
      if (!tr) return null;
      const lead = tr.drawnAt ? Math.min(0.5, Math.max(0, (performance.now() - tr.drawnAt) / 1000)) : 0;
      const [lng, lat] = S.toLngLat(tr.x + tr.vx * lead, tr.z + tr.vz * lead);
      if (!glide) return { lng, lat, elev: tr.y };
      const t = Math.min(1, (performance.now() - glide.at) / FOLLOW_EASE_MS);
      if (t >= 1) { glide = null; return { lng, lat, elev: tr.y }; }
      const k = t * t * (3 - 2 * t);
      return { lng: glide.lng + (lng - glide.lng) * k, lat: glide.lat + (lat - glide.lat) * k, elev: glide.elev + (tr.y - glide.elev) * k };
    };
    // Every camera change a gesture or an animation makes goes through this,
    // so zooming, turning and tilting all happen around the aircraft.
    const hold: ml.CameraUpdateTransformFunction = () => {
      const a = aim();
      return a ? { center: new ml.LngLat(a.lng, a.lat), elevation: a.elev } : {};
    };
    // Between gestures the camera is moved here, once a frame.
    const keepUp = () => {
      const a = aim();
      if (a) {
        if (map.isMoving()) return;
        const c = map.getCenter();
        if (Math.abs(c.lng - a.lng) > 1e-7 || Math.abs(c.lat - a.lat) > 1e-7 || Math.abs(map.getCenterElevation() - a.elev) > 0.5) {
          map.jumpTo({ center: [a.lng, a.lat], elevation: a.elev });
        }
        return;
      }
      // Let go: put the map's centre back on the ground, with the camera
      // left exactly where it is, so nothing on screen moves.
      if (settle && !followRef.current && !map.isMoving()) {
        settle = false;
        if (map.getCenterClampedToGround()) return;
        try {
          // The camera's own position is not part of the map's public API.
          const lens = map._camera.transform;
          const eye = lens.getCameraLngLat();
          const height = lens.getCameraAltitude();
          map.setCenterClampedToGround(true);
          const to = map.calculateCameraOptionsFromCameraLngLatAltRotation(eye, height, map.getBearing(), map.getPitch(), map.getRoll());
          map.jumpTo({ center: to.center, zoom: to.zoom });
        } catch {
          map.setCenterClampedToGround(true);
        }
      }
    };

    // The ground network in local metres, rebuilt when the lines or the origin change.
    let netCache: { ox: number; oy: number; net: NetLine[]; strips: NetLine[]; segs: NetSeg[] } | null = null;

    const S: Stage = {
      map, tracks: new Map(), ox: 0.5, oy: 0.5, s: 1, lat0: 0, labels: [], scene, ground: 0,
      startFollow(insetBottom) {
        settle = false;
        const c = map.getCenter();
        glide = { lng: c.lng, lat: c.lat, elev: map.getCenterElevation(), at: performance.now() };
        map.setCenterClampedToGround(false);
        map.setTransformCameraUpdate(hold);
        // On a phone the aircraft's panel covers the lower part of the map:
        // the aircraft is kept in the middle of what is left.
        const pad = map.getPadding();
        if ((pad.bottom ?? 0) !== insetBottom) map.easeTo({ padding: { top: 0, left: 0, right: 0, bottom: insetBottom }, duration: FOLLOW_EASE_MS });
        map.triggerRepaint();
      },
      endFollow() {
        glide = null;
        map.setTransformCameraUpdate(null);
        settle = true;
      },
      toLocal(lat, lon) {
        const m = ml.MercatorCoordinate.fromLngLat([lon, lat]);
        return { x: (m.x - S.ox) / S.s, z: (m.y - S.oy) / S.s };
      },
      toLngLat(x, z) {
        const ll = new ml.MercatorCoordinate(S.ox + x * S.s, S.oy + z * S.s, 0).toLngLat();
        return [ll.lng, ll.lat];
      },
      setOrigin(lat, lon) {
        const m = ml.MercatorCoordinate.fromLngLat([lon, lat]);
        S.ox = m.x; S.oy = m.y; S.s = m.meterInMercatorCoordinateUnits(); S.lat0 = lat;
        // A new airport: its taxiways have to be read again.
        S.netLines = []; S.netZoom = 0;
      },
      netLines: [], netZoom: 0, stripLines: [],
      readNet() {
        // Zoomed out the basemap has no taxiways, and the lines it has are
        // simplified. Its tiles stop getting more detailed at 14.
        const zoom = Math.min(14, Math.floor(map.getZoom()));
        if (zoom < 12 || zoom < S.netZoom || !map.getSource("omt")) return;
        let found: GeoJSON.Feature[];
        try {
          found = map.querySourceFeatures("omt", {
            sourceLayer: "aeroway",
            filter: ["all", ["in", ["geometry-type"], ["literal", ["LineString", "MultiLineString"]]], ["in", ["get", "class"], ["literal", ["runway", "taxiway"]]]],
          });
        } catch { return; }
        const lines: NetLine[] = [];
        const near = (c: number[]) => { const l = S.toLocal(c[1], c[0]); return Math.abs(l.x) < NET_REACH_M && Math.abs(l.z) < NET_REACH_M; };
        for (const f of found) {
          const g = f.geometry;
          const parts = g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : [];
          const runway = f.properties?.class === "runway";
          for (const part of parts) {
            for (let i = 1; i < part.length; i++) {
              const a = part[i - 1], b = part[i];
              if (near(a) || near(b)) lines.push({ a: [a[0], a[1]], b: [b[0], b[1]], runway });
            }
          }
        }
        if (!lines.length) return;
        // A more detailed read replaces a rougher one. At the same detail the
        // view may show another part of the airport, so the two are combined.
        const key = (l: NetLine) => `${l.a[0].toFixed(6)},${l.a[1].toFixed(6)},${l.b[0].toFixed(6)},${l.b[1].toFixed(6)}`;
        const keep = zoom === S.netZoom ? S.netLines : [];
        const have = new Set(keep.map(key));
        const added = lines.filter((l) => { const k = key(l); if (have.has(k)) return false; have.add(k); return true; });
        if (!added.length && zoom === S.netZoom) return;
        S.netLines = [...keep, ...added]; S.netZoom = zoom;
      },
      groundNet() {
        const c = netCache;
        if (c && c.ox === S.ox && c.oy === S.oy && c.net === S.netLines && c.strips === S.stripLines) return c.segs;
        const segs = [...S.netLines, ...S.stripLines].map((l) => {
          const a = S.toLocal(l.a[1], l.a[0]), b = S.toLocal(l.b[1], l.b[0]);
          return { ax: a.x, az: a.z, bx: b.x, bz: b.z, runway: l.runway };
        });
        netCache = { ox: S.ox, oy: S.oy, net: S.netLines, strips: S.stripLines, segs };
        return segs;
      },
      drawTrails() {
        const src = map.getSource("fp-trails") as ml.GeoJSONSource | undefined;
        if (!src) return;
        const features: GeoJSON.Feature[] = [];
        // Only the picked aircraft has a line: nothing is drawn until one is
        // picked. The line fades a little towards its older end.
        const picked = selectedRef.current ?? null;
        const fade = (pts: [number, number][], color: string, full: boolean) => {
          const n = pts.length - 1;
          const bands = Math.min(14, n);
          const floor = full ? 0.42 : 0.08;
          for (let b = 0; b < bands; b++) {
            const from = Math.floor((b * n) / bands);
            const to = Math.floor(((b + 1) * n) / bands);
            if (to <= from) continue;
            features.push({
              type: "Feature",
              properties: { color, full, o: floor + (0.9 - floor) * Math.pow((b + 1) / bands, 1.6) },
              geometry: { type: "LineString", coordinates: pts.slice(from, to + 1) },
            });
          }
        };
        const loaded = flightRef.current;
        const whole = picked && loaded && loaded.tail === picked && loaded.points.length > 0 ? loaded : null;
        let drewWhole = false;
        for (const tr of S.tracks.values()) {
          if (tr.plane.tail !== picked) continue;
          // The line is the flight the backend recorded, which is there
          // however late this page was opened. Nothing is drawn from what the
          // page itself has seen, except to carry the line on from the moment
          // the flight was loaded to where the aircraft is now.
          if (!whole) continue;
          const pts: [number, number][] = [
            ...whole.points.map((p): [number, number] => [p[1], p[0]]),
            ...trailOf(tr.plane.tail).filter((f) => f.t > whole.at).map((f): [number, number] => [f.lon, f.lat]),
          ];
          pts.push(S.toLngLat(tr.x, tr.z)); // the line always ends at the aircraft
          fade(pts, tr.color, true);
          drewWhole = true;
        }
        // Picked, but not on the map right now: its last flight on its own.
        if (whole && !drewWhole && whole.points.length > 1) {
          fade(whole.points.map((p) => [p[1], p[0]]), whole.color && /^#[0-9a-fA-F]{6}$/.test(whole.color) ? whole.color : "#FAFAFA", true);
        }
        src.setData({ type: "FeatureCollection", features });
      },
    };
    S.setOrigin(39.5, -98.35);
    // Each time the map settles, pick up the runways and taxiways it now shows.
    map.on("idle", () => S.readNet());
    stage.current = S;

    // ----- the aircraft layer -----
    const camera = new T.Camera();
    const L = new T.Matrix4();
    const P = new T.Matrix4();
    const v = new T.Vector4();
    let renderer: T.WebGLRenderer | null = null;
    let last = performance.now();
    let lastTrail = 0;
    let lastMk = 0;

    const layer: ml.CustomLayerInterface = {
      id: "fp-aircraft",
      type: "custom",
      renderingMode: "3d",
      onAdd(m, gl) {
        renderer = new T.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true });
        renderer.autoClear = false;
      },
      onRemove() {
        renderer?.dispose();
        renderer = null;
      },
      render(_gl, args) {
        if (!renderer) return;
        const now = performance.now();
        const elapsed = (now - last) / 1000;
        const dt = Math.min(0.25, elapsed);
        last = now;

        // Local metres (x east, y up, z south) to mercator, then mercator to the screen.
        L.set(S.s, 0, 0, S.ox, 0, 0, S.s, S.oy, 0, S.s, 0, 0, 0, 0, 0, 1);
        P.fromArray(args.defaultProjectionData.mainMatrix as ArrayLike<number>).multiply(L);
        camera.projectionMatrix.copy(P);
        camera.projectionMatrixInverse.copy(P).invert();

        const canvas = map.getCanvas();
        const w = box.clientWidth;
        const h = box.clientHeight;
        const mpp = (40075016.686 * Math.cos((S.lat0 * PI) / 180)) / (512 * Math.pow(2, map.getZoom()));
        // Full size from zoom 11.5 in, shrinking steadily to the small size at zoom 7 and wider.
        const px = ICON_FAR_PX + (ICON_PX - ICON_FAR_PX) * Math.max(0, Math.min(1, (map.getZoom() - 7) / 4.5));
        const size = Math.max(px * mpp, MIN_SPAN_M) / 2.2; // models are 2.2 units across
        // The tap target and the label keep to the edge of the model.
        const mk = Math.round(Math.max(px, 30));
        if (mk !== lastMk) { lastMk = mk; box.style.setProperty("--mk", `${mk}px`); }
        // With relief on, heights are measured from sea level, so everything starts at the field's own height.
        if (map.getTerrain()) {
          const g = map.queryTerrainElevation(S.toLngLat(0, 0));
          if (g != null) S.ground = g;
        } else S.ground = 0;

        const net = S.groundNet();
        for (const tr of S.tracks.values()) {
          const p = tr.plane;
          // Glide ahead of the last report only for an aircraft we have watched move, and only for
          // about as long as its reports are apart. A position that is already old when the app
          // opens stays where it was reported: flying it onward would put it somewhere it never was.
          // On the ground too: a landing roll or a taxi glides between the
          // receiver's reports instead of hopping from one to the next.
          const flying = !p.dim && underway(p);
          const moving = !calm && underway(p) && p.heading != null && tr.moves > 0;
          const age = Math.min((now - tr.fixAt) / 1000, tr.gap * 1.25);
          const hr = ((p.heading ?? tr.hdg) * PI) / 180;
          const run = moving ? (p.speedKt as number) * KT * age : 0;
          let tx = tr.fx + Math.sin(hr) * run;
          let tz = tr.fz - Math.cos(hr) * run;
          // On the ground: onto the runway or taxiway it is on, pointing along it while it moves.
          let toHdg = p.heading;
          if (p.dim && net.length) {
            const rolling = (p.speedKt ?? 0) >= ROLL_KT;
            const on = snapToNet(net, tx, tz, rolling ? p.heading : null);
            if (on) {
              tx = on.x; tz = on.z;
              if (on.along != null) toHdg = on.along;
            }
          }
          const k = calm ? 1 : 1 - Math.exp(-dt / 0.45);
          const wasX = tr.x, wasZ = tr.z;
          tr.x += (tx - tr.x) * k;
          tr.z += (tz - tr.z) * k;
          if (elapsed > 0.001 && elapsed < 1 && !calm) { tr.vx = (tr.x - wasX) / elapsed; tr.vz = (tr.z - wasZ) / elapsed; } else { tr.vx = 0; tr.vz = 0; }
          tr.drawnAt = now;
          if (toHdg != null) tr.hdg += ((((toHdg - tr.hdg) % 360) + 540) % 360 - 180) * k;

          // Never draw an aircraft inside a hillside: parked ones sit on the ground under them.
          const under = S.ground ? map.queryTerrainElevation(S.toLngLat(tr.x, tr.z)) ?? S.ground : 0;
          const y = p.dim ? under : Math.max(S.ground + Math.max(0, p.altFt ?? 0) * 0.3048, under + 30);
          const pivot = tr.model.pivot;
          tr.y = y + size * 0.3;
          pivot.position.set(tr.x, y + size * 0.3, tr.z);
          pivot.scale.setScalar(size);
          pivot.rotation.y = PI / 2 - (tr.hdg * PI) / 180;
          if (flying && !calm) for (const r of tr.model.rotors) r.o.rotation[r.ax] += r.v;

          // The tap target and label follow the model on screen.
          v.set(tr.x, y + size * 0.3, tr.z, 1).applyMatrix4(P);
          if (v.w > 0) {
            const sx = (v.x / v.w * 0.5 + 0.5) * w;
            const sy = (0.5 - v.y / v.w * 0.5) * h;
            tr.el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
            tr.el.hidden = false;
          } else {
            tr.el.hidden = true;
          }
        }

        renderer.resetState();
        renderer.setViewport(0, 0, canvas.width, canvas.height);
        renderer.render(scene, camera);

        if (now - lastTrail > 500) { lastTrail = now; S.drawTrails(); }
      },
    };

    map.on("load", () => {
      map.addSource("fp-coverage", { type: "geojson", data: EMPTY });
      map.addSource("fp-rings", { type: "geojson", data: EMPTY });
      map.addSource("fp-trails", { type: "geojson", data: EMPTY });
      map.addSource("fp-airport", { type: "geojson", data: EMPTY });
      map.addSource("fp-runways", { type: "geojson", data: EMPTY });
      map.addSource("fp-runway-ends", { type: "geojson", data: EMPTY });
      map.addSource("fp-approach", { type: "geojson", data: EMPTY });
      map.addLayer({ id: "fp-coverage", type: "fill", source: "fp-coverage", paint: { "fill-color": "#FAFAFA", "fill-opacity": 0.09 } });
      map.addLayer({
        id: "fp-approach", type: "line", source: "fp-approach",
        paint: { "line-color": "#D4D4D4", "line-width": 1.2, "line-dasharray": [2, 4] },
      });
      map.addLayer({
        id: "fp-runway", type: "line", source: "fp-runways", minzoom: 8,
        paint: { "line-color": "#F2F2F2", "line-width": ["interpolate", ["exponential", 1.6], ["zoom"], 8, 1, 11, 2, 14, 7, 17, 34] },
      });
      map.addLayer({
        id: "fp-runway-end", type: "symbol", source: "fp-runway-ends", minzoom: 10.6,
        layout: {
          "text-field": ["get", "ident"], "text-font": ["Noto Sans Bold"], "text-size": ["interpolate", ["linear"], ["zoom"], 10.6, 10, 14, 13],
          "text-offset": ["get", "off"], "text-padding": 1, "symbol-sort-key": ["case", ["get", "used"], 0, 1],
        },
        paint: { "text-color": ["case", ["get", "used"], "#FFFFFF", "#B8B8B8"], "text-halo-color": "#0A0A0A", "text-halo-width": 1.6 },
      });
      map.addLayer({ id: "fp-ring", type: "line", source: "fp-rings", filter: ["!", ["get", "inner"]], paint: { "line-color": "#7A7A7A", "line-width": 1 } });
      map.addLayer({ id: "fp-ring-inner", type: "line", source: "fp-rings", filter: ["get", "inner"], paint: { "line-color": "#B0B0B0", "line-width": 1, "line-dasharray": [3, 5] } });
      map.addLayer({
        id: "fp-trails", type: "line", source: "fp-trails", layout: { "line-join": "round" },
        paint: {
          "line-color": ["get", "color"], "line-opacity": ["get", "o"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, ["case", ["get", "full"], 2.1, 1.5], 12, ["case", ["get", "full"], 3.3, 2.6]],
        },
      });
      map.addLayer({ id: "fp-airport-halo", type: "circle", source: "fp-airport", paint: { "circle-radius": 9, "circle-color": "#FAFAFA", "circle-opacity": 0.15 } });
      map.addLayer({ id: "fp-airport-dot", type: "circle", source: "fp-airport", paint: { "circle-radius": 5, "circle-color": "#FAFAFA" } });
      map.addLayer(layer);
      setReady(true);
    });

    // Keep the map drawing while something is moving: about 30 frames a second.
    let raf = 0;
    let odd = false;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      keepUp();
      odd = !odd;
      if (calm || odd) return;
      for (const tr of S.tracks.values()) {
        const p = tr.plane;
        if (underway(p)) { map.triggerRepaint(); break; }
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      for (const tr of S.tracks.values()) { destroyModel(tr.model); tr.el.remove(); }
      S.tracks.clear();
      S.labels.forEach((m) => m.remove());
      stage.current = null;
      setReady(false);
      map.remove();
    };
  }, [interactive, embedded]);

  const lat = center?.lat;
  const lon = center?.lon;
  const ringsKey = rings.join(",");
  const coverageKey = coverage ? `${coverage.lat},${coverage.lon},${coverage.rangeNm.join(",")}` : "";

  // Airport, rings and receiver coverage.
  useEffect(() => {
    const S = stage.current;
    if (!S || !ready) return;
    const { map } = S;
    const set = (id: string, features: GeoJSON.Feature[]) =>
      (map.getSource(id) as ml.GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features });
    S.labels.forEach((m) => m.remove());
    S.labels = [];
    // Our own badge names the home airport, so the basemap's label for it steps aside.
    map.setFilter("airport-label", code ? ["all", ["has", "icao"], ["!=", ["get", "icao"], code]] : ["has", "icao"]);
    if (lat == null || lon == null) {
      set("fp-coverage", []); set("fp-rings", []); set("fp-airport", []);
      return;
    }
    const label = (at: [number, number], text: string, cls: string, offset: [number, number]) => {
      const node = document.createElement("span");
      node.className = cls;
      node.textContent = text;
      S.labels.push(new ml.Marker({ element: node, anchor: "left", offset }).setLngLat(at).addTo(map));
    };

    const wedges: GeoJSON.Feature[] = [];
    if (coverage && coverage.rangeNm.some((n) => n > 0)) {
      const step = 360 / coverage.rangeNm.length;
      // One wedge per mapped bearing; unmapped bearings stay empty.
      coverage.rangeNm.forEach((n, i) => {
        if (!(n > 0)) return;
        const here: [number, number] = [coverage.lon, coverage.lat];
        const ring = [here, destination(coverage.lat, coverage.lon, (i - 0.5) * step, n), destination(coverage.lat, coverage.lon, i * step, n), destination(coverage.lat, coverage.lon, (i + 0.5) * step, n), here];
        wedges.push({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } });
      });
    }
    set("fp-coverage", wedges);

    const list = showRings && ringsKey ? ringsKey.split(",").map(Number) : [];
    set("fp-rings", list.map((r, i) => ({
      type: "Feature", properties: { inner: i === list.length - 1 && list.length > 1 },
      geometry: { type: "LineString", coordinates: circle(lat, lon, r) },
    })));
    list.forEach((r) => label(destination(lat, lon, 270, r), `${r} nm`, "fa-ring-label", [6, -10]));

    set("fp-airport", [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [lon, lat] } }]);
    if (code) label([lon, lat], code, "fa-plane-label", [12, 14]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, lat, lon, ringsKey, showRings, code, coverageKey]);

  // The home airport's runways.
  const runwaysKey = JSON.stringify([runways ?? [], approach ?? []]);
  useEffect(() => {
    const S = stage.current;
    if (!S || !ready) return;
    const f = lat == null || lon == null
      ? { strips: [], ends: [], paths: [] }
      : runwayFeatures(lat, lon, runways ?? [], approach ?? [], Math.max(3, Math.min(8, Number(ringsKey.split(",")[0]) || 5)));
    const set = (id: string, features: GeoJSON.Feature[]) =>
      (S.map.getSource(id) as ml.GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features });
    set("fp-runways", f.strips); set("fp-runway-ends", f.ends); set("fp-approach", f.paths);
    // Aircraft on the ground snap to these as well as to the basemap's lines.
    S.stripLines = f.strips.map((s) => {
      const [a, b] = (s.geometry as GeoJSON.LineString).coordinates;
      return { a: [a[0], a[1]] as [number, number], b: [b[0], b[1]] as [number, number], runway: true };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, lat, lon, runwaysKey, ringsKey]);

  // Fit the view to the widest ring.
  useEffect(() => {
    const S = stage.current;
    if (!S || !ready || lat == null || lon == null) return;
    const widest = Math.max(...(ringsKey ? ringsKey.split(",").map(Number) : [10]), 2) * 1.12;
    S.map.fitBounds([destination(lat, lon, 225, widest * Math.SQRT2), destination(lat, lon, 45, widest * Math.SQRT2)], { animate: false });
  }, [ready, lat, lon, ringsKey, fitSeq]);

  // Tilt for the 3D view.
  useEffect(() => {
    const S = stage.current;
    if (!S || !ready) return;
    S.map.setTerrain(tilt ? { source: "dem-relief", exaggeration: 1 } : null);
    S.map.easeTo({ pitch: tilt ? 62 : 0, bearing: tilt ? S.map.getBearing() : 0, duration: 800 });
  }, [ready, tilt]);

  // Aircraft.
  const planesKey = planes.map((p) => `${p.tail}:${p.lat.toFixed(5)}:${p.lon.toFixed(5)}:${Math.round(p.heading ?? 0)}:${Math.round(p.speedKt ?? 0)}:${Math.round(p.altFt ?? 0)}:${p.live}:${p.dim}:${p.type ?? ""}:${p.color ?? ""}:${p.seenAt != null ? Math.floor((Date.now() - p.seenAt) / 60000) : ""}`).join("|");
  useEffect(() => {
    const S = stage.current;
    const box = overlay.current;
    if (!S || !ready || !box) return;

    // The scene is measured from the airport. If that moved, start the aircraft over.
    const oLat = lat ?? planes[0]?.lat ?? 39.5;
    const oLon = lon ?? planes[0]?.lon ?? -98.35;
    const here = ml.MercatorCoordinate.fromLngLat([oLon, oLat]);
    if (Math.abs(here.x - S.ox) > 1e-9 || Math.abs(here.y - S.oy) > 1e-9) {
      for (const tr of S.tracks.values()) { S.scene.remove(tr.model.pivot); destroyModel(tr.model); tr.el.remove(); }
      S.tracks.clear();
      S.setOrigin(oLat, oLon);
    }

    const seen = new Set<string>();
    const scene = S.scene;
    for (const p of planes) {
      seen.add(p.tail);
      const family = familyOf(p.type);
      const real = modelOf(p.type);
      const modelId = real?.id ?? "";
      const color = p.color && /^#[0-9a-fA-F]{6}$/.test(p.color) ? p.color : "#FAFAFA";
      let tr = S.tracks.get(p.tail);
      if (tr && (tr.family !== family || tr.modelId !== modelId)) {
        scene.remove(tr.model.pivot); destroyModel(tr.model); tr.el.remove(); S.tracks.delete(p.tail); tr = undefined;
      }
      if (!tr) {
        const model = makeModel(family, real, color, false);
        model.pivot.traverse((o) => { o.frustumCulled = false; });
        scene.add(model.pivot);
        if (real && !model.real) {
          // Drawn as a built-in shape for now; change over when the file arrives.
          void loadReal(real).then((ok) => {
            const cur = S.tracks.get(p.tail);
            if (!ok || !cur || cur.model !== model || stage.current !== S) return;
            const next = makeModel(family, real, cur.color, false);
            next.pivot.traverse((o) => { o.frustumCulled = false; });
            scene.remove(model.pivot);
            destroyModel(model);
            cur.model = next;
            scene.add(next.pivot);
            S.map.triggerRepaint();
          });
        }
        const btn = document.createElement("button");
        btn.type = "button";
        btn.hidden = true;
        const tag = document.createElement("span");
        tag.textContent = p.tail;
        btn.appendChild(tag);
        btn.addEventListener("click", (e) => { e.stopPropagation(); onSelectRef.current?.(p.tail); });
        box.appendChild(btn);
        const at = S.toLocal(p.lat, p.lon);
        tr = { plane: p, family, modelId, color, model, el: btn, fixLat: p.lat, fixLon: p.lon, fx: at.x, fz: at.z, fixAt: performance.now(), moves: 0, gap: 10, x: at.x, z: at.z, hdg: p.heading ?? 0, y: 0, vx: 0, vz: 0, drawnAt: 0 };
        S.tracks.set(p.tail, tr);
      }
      if (tr.color !== color) { tr.model.accent.color.set(color); tr.color = color; }
      if (p.lat !== tr.fixLat || p.lon !== tr.fixLon) {
        const at = S.toLocal(p.lat, p.lon);
        const t = performance.now();
        tr.gap = Math.min(40, Math.max(4, (t - tr.fixAt) / 1000));
        tr.moves += 1;
        tr.fixLat = p.lat; tr.fixLon = p.lon; tr.fx = at.x; tr.fz = at.z; tr.fixAt = t;
      }
      tr.plane = p;
      const oldMin = p.seenAt != null && !p.dim ? Math.floor((Date.now() - p.seenAt) / 60000) : 0;
      (tr.el.firstChild as HTMLElement).textContent = oldMin >= 2 ? `${p.tail} · ${oldMin} min ago` : p.tail;
      tr.el.className = `fa-mk${p.live ? " live" : ""}${p.tail === selected ? " selected" : ""}${p.dim || oldMin >= 2 ? " dim" : ""}`;
      tr.el.style.setProperty("--paint", color);
      tr.el.setAttribute("aria-label", p.tail);
      tr.el.setAttribute("aria-pressed", String(p.tail === selected));
      tr.el.disabled = !interactive;
      (tr.el.firstChild as HTMLElement).className = `fa-plane-label${p.live ? " live" : ""}`;
    }
    for (const [tail, tr] of S.tracks) {
      if (seen.has(tail)) continue;
      scene.remove(tr.model.pivot); destroyModel(tr.model); tr.el.remove(); S.tracks.delete(tail);
    }
    S.drawTrails();
    S.map.triggerRepaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, planesKey, selected, interactive, lat, lon]);

  // Follow the picked aircraft, or let go of it. Declared after the aircraft
  // are placed, so the one to follow is already on the map.
  const following = follow && !!selected && planes.some((p) => p.tail === selected);
  useEffect(() => {
    const S = stage.current;
    followRef.current = following;
    if (!S || !ready) return;
    if (following) S.startFollow(followInsetBottom);
    else S.endFollow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [following, ready, selected]);

  // Bring a newly selected aircraft into view.
  useEffect(() => {
    const S = stage.current;
    const p = planes.find((x) => x.tail === selected);
    if (!S || !ready || !p) return;
    const b = S.map.getBounds();
    const padLng = (b.getEast() - b.getWest()) * 0.15;
    const padLat = (b.getNorth() - b.getSouth()) * 0.15;
    const inside = p.lon > b.getWest() + padLng && p.lon < b.getEast() - padLng && p.lat > b.getSouth() + padLat && p.lat < b.getNorth() - padLat;
    if (!inside) S.map.easeTo({ center: [p.lon, p.lat], duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, ready]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={el} style={{ position: "absolute", inset: 0 }} aria-label="Map" />
      <div ref={overlay} className="fa-map-overlay" />
    </div>
  );
}
