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

type Props = {
  center: { lat: number; lon: number } | null;
  code?: string | null;
  rings: number[];
  planes?: MapPlane[];
  selected?: string | null;
  onSelect?: (tail: string | null) => void;
  showRings?: boolean;
  coverage?: MapCoverage | null;
  /** Bump to re-fit the view to the rings. */
  fitSeq?: number;
  /** false = a still picture: no dragging, no zoom buttons. */
  interactive?: boolean;
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
const ICON_PX = 60;             // wingspan on screen
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
  // Where it is drawn right now.
  x: number; z: number; hdg: number;
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
};

export default function MapGL({
  center, code, rings, planes = [], selected, onSelect, showRings = true, coverage, fitSeq = 0, interactive = true, tilt = false,
  runways, approach,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const [ready, setReady] = useState(false);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

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
      maxPitch: 75,
      attributionControl: { compact: true },
      canvasContextAttributes: { antialias: true },
    });
    if (interactive) {
      map.addControl(new ml.NavigationControl({ visualizePitch: true }), "bottom-right");
      map.addControl(new ml.ScaleControl({ unit: "nautical", maxWidth: 120 }), "bottom-left");
      map.on("click", () => onSelectRef.current?.(null));
    }

    // The aircraft are three.js models drawn into the map's own WebGL canvas.
    const scene = new T.Scene();
    lightScene(scene);

    const S: Stage = {
      map, tracks: new Map(), ox: 0.5, oy: 0.5, s: 1, lat0: 0, labels: [], scene, ground: 0,
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
      },
      drawTrails() {
        const src = map.getSource("fp-trails") as ml.GeoJSONSource | undefined;
        if (!src) return;
        const features: GeoJSON.Feature[] = [];
        for (const tr of S.tracks.values()) {
          if (tr.plane.dim) continue;
          const pts: [number, number][] = trailOf(tr.plane.tail).map((f) => [f.lon, f.lat]);
          if (!pts.length) continue;
          pts.push(S.toLngLat(tr.x, tr.z)); // the trail always ends at the aircraft
          const n = pts.length - 1;
          const bands = Math.min(14, n);
          for (let b = 0; b < bands; b++) {
            const from = Math.floor((b * n) / bands);
            const to = Math.floor(((b + 1) * n) / bands);
            if (to <= from) continue;
            features.push({
              type: "Feature",
              properties: { color: tr.color, o: 0.08 + 0.82 * Math.pow((b + 1) / bands, 1.6) },
              geometry: { type: "LineString", coordinates: pts.slice(from, to + 1) },
            });
          }
        }
        src.setData({ type: "FeatureCollection", features });
      },
    };
    S.setOrigin(39.5, -98.35);
    stage.current = S;

    // ----- the aircraft layer -----
    const camera = new T.Camera();
    const L = new T.Matrix4();
    const P = new T.Matrix4();
    const v = new T.Vector4();
    let renderer: T.WebGLRenderer | null = null;
    let last = performance.now();
    let lastTrail = 0;

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
        const dt = Math.min(0.25, (now - last) / 1000);
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
        const size = Math.max(ICON_PX * mpp, MIN_SPAN_M) / 2.2; // models are 2.2 units across
        // With relief on, heights are measured from sea level, so everything starts at the field's own height.
        if (map.getTerrain()) {
          const g = map.queryTerrainElevation(S.toLngLat(0, 0));
          if (g != null) S.ground = g;
        } else S.ground = 0;

        for (const tr of S.tracks.values()) {
          const p = tr.plane;
          // Glide ahead of the last report only for an aircraft we have watched move, and only for
          // about as long as its reports are apart. A position that is already old when the app
          // opens stays where it was reported: flying it onward would put it somewhere it never was.
          const flying = !p.dim && (p.speedKt ?? 0) > 20 && (p.seenAt == null || Date.now() - p.seenAt < STALE_MS);
          const moving = !calm && flying && p.heading != null && tr.moves > 0;
          const age = Math.min((now - tr.fixAt) / 1000, tr.gap * 1.25);
          const hr = ((p.heading ?? tr.hdg) * PI) / 180;
          const run = moving ? (p.speedKt as number) * KT * age : 0;
          const tx = tr.fx + Math.sin(hr) * run;
          const tz = tr.fz - Math.cos(hr) * run;
          const k = calm ? 1 : 1 - Math.exp(-dt / 0.45);
          tr.x += (tx - tr.x) * k;
          tr.z += (tz - tr.z) * k;
          if (p.heading != null) tr.hdg += ((((p.heading - tr.hdg) % 360) + 540) % 360 - 180) * k;

          // Never draw an aircraft inside a hillside: parked ones sit on the ground under them.
          const under = S.ground ? map.queryTerrainElevation(S.toLngLat(tr.x, tr.z)) ?? S.ground : 0;
          const y = p.dim ? under : Math.max(S.ground + Math.max(0, p.altFt ?? 0) * 0.3048, under + 30);
          const pivot = tr.model.pivot;
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
        paint: { "line-color": ["get", "color"], "line-opacity": ["get", "o"], "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.5, 12, 2.6] },
      });
      map.addLayer({ id: "fp-airport-halo", type: "circle", source: "fp-airport", paint: { "circle-radius": 9, "circle-color": "#FAFAFA", "circle-opacity": 0.15 } });
      map.addLayer({ id: "fp-airport-dot", type: "circle", source: "fp-airport", paint: { "circle-radius": 5, "circle-color": "#FAFAFA" } });
      map.addLayer(layer);
      setReady(true);
    });

    // Keep the map drawing while something is flying: about 30 frames a second.
    let raf = 0;
    let odd = false;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      odd = !odd;
      if (calm || odd) return;
      for (const tr of S.tracks.values()) {
        const p = tr.plane;
        if (!p.dim && (p.speedKt ?? 0) > 20 && (p.seenAt == null || Date.now() - p.seenAt < STALE_MS)) { map.triggerRepaint(); break; }
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
  }, [interactive]);

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
        tr = { plane: p, family, modelId, color, model, el: btn, fixLat: p.lat, fixLon: p.lon, fx: at.x, fz: at.z, fixAt: performance.now(), moves: 0, gap: 10, x: at.x, z: at.z, hdg: p.heading ?? 0 };
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
