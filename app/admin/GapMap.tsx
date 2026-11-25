"use client";

// Where coverage gaps happen, on the web app's basemap. Zoomed out, a heat map:
// brighter red means more gap time there, so it shows how often and how long
// together. Zoomed in, each gap is a dot where the aircraft went quiet, sized
// and coloured by how long it lasted, with a dashed line to where it was heard
// again. One hue (red), dim to bright: blue stays for live aircraft.

import { useEffect, useMemo, useRef, useState } from "react";
import * as ml from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE } from "../app/_lib/mapStyle";

if (typeof window !== "undefined") ml.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type GapPoint = {
  lat: number; lon: number; end_lat: number | null; end_lon: number | null;
  seconds: number; agl: number | null; nm: number | null; cause: string; tail: string; at: string; outcome: string;
};

/** Short, medium and long gaps: dim to bright (validated as one-hue ordinal steps on dark). */
const STEPS = [
  { upTo: 120, color: "#A23B3B", label: "Under 2 min" },
  { upTo: 600, color: "#E34948", label: "2 to 10 min" },
  { upTo: Infinity, color: "#FFB0A8", label: "10 min or more, or never heard again" },
];
const OWN_FAILURE = "our adsb.lol request failed";

const CSS = `
.gm { display: flex; flex-direction: column; gap: 10px; }
.gm-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 12px; color: var(--muted); }
.gm-legend { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.gm-heat { width: 70px; height: 8px; border-radius: 4px; background: linear-gradient(90deg, rgba(162,59,59,0.25), #A23B3B, #E34948, #FFB0A8); }
.gm-step { display: inline-flex; align-items: center; gap: 6px; }
.gm-step i { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 0 2px #0A0A0A; display: inline-block; }
.gm-own { display: inline-flex; align-items: center; gap: 7px; cursor: pointer; color: var(--text-2); }
.gm-map { position: relative; height: 460px; border-radius: 14px; overflow: hidden; border: 1px solid var(--border); background: #0C0C0C; }
.gm-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: 13px; pointer-events: none; text-align: center; padding: 20px; }
.gm-tip { position: absolute; z-index: 5; pointer-events: none; background: rgba(15,15,15,0.96); border: 1px solid var(--border); border-radius: 10px; padding: 8px 10px; font-size: 12px; color: var(--text-2); line-height: 1.5; max-width: 260px; }
.gm-tip b { color: var(--text); font-family: var(--mono); }
.gm-cause { color: var(--muted); }
.gm-note { margin: 0; font-size: 12px; color: var(--muted); }
`;

function stepOf(p: GapPoint) {
  if (p.outcome === "not_seen_again") return 2;
  return STEPS.findIndex((s) => p.seconds < s.upTo);
}

function minutes(s: number) {
  return s < 90 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${(s / 3600).toFixed(1)} h`;
}

export default function GapMap({ points }: { points: GapPoint[] }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ml.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [withOwn, setWithOwn] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; p: GapPoint } | null>(null);

  const shown = useMemo(() => points.filter((p) => withOwn || p.cause !== OWN_FAILURE), [points, withOwn]);
  const ownCount = points.length - points.filter((p) => p.cause !== OWN_FAILURE).length;
  const shownRef = useRef(shown);
  useEffect(() => { shownRef.current = shown; }, [shown]);

  const data = useMemo(() => {
    const dots: GeoJSON.Feature[] = shown.map((p, i) => ({
      type: "Feature",
      properties: { i, weight: Math.min(1, p.seconds / 600), step: stepOf(p), r: Math.min(12, 4 + p.seconds / 90) },
      geometry: { type: "Point", coordinates: [p.lon, p.lat] },
    }));
    const lines: GeoJSON.Feature[] = shown.filter((p) => p.end_lat != null && p.end_lon != null).map((p) => ({
      type: "Feature",
      properties: { step: stepOf(p) },
      geometry: { type: "LineString", coordinates: [[p.lon, p.lat], [p.end_lon as number, p.end_lat as number]] },
    }));
    return { dots: { type: "FeatureCollection", features: dots } as GeoJSON.FeatureCollection, lines: { type: "FeatureCollection", features: lines } as GeoJSON.FeatureCollection };
  }, [shown]);

  // The map, once.
  useEffect(() => {
    if (!el.current) return;
    const map = new ml.Map({ container: el.current, style: MAP_STYLE, center: [-97.2, 33.1], zoom: 8, attributionControl: { compact: true } });
    map.addControl(new ml.NavigationControl({ showCompass: false }), "bottom-right");
    mapRef.current = map;
    const stepColor: ml.ExpressionSpecification = ["match", ["get", "step"], 0, STEPS[0].color, 1, STEPS[1].color, STEPS[2].color];
    map.on("load", () => {
      map.addSource("gap-dots", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("gap-lines", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "gap-heat", type: "heatmap", source: "gap-dots", maxzoom: 13,
        paint: {
          "heatmap-weight": ["get", "weight"],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 6, 0.8, 12, 2.2],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 6, 14, 12, 34],
          "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(162,59,59,0)", 0.15, "rgba(162,59,59,0.45)", 0.45, "rgba(227,73,72,0.75)", 0.8, "rgba(255,176,168,0.9)", 1, "rgba(255,236,232,0.95)"],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.9, 12.5, 0],
        },
      });
      map.addLayer({
        id: "gap-lines", type: "line", source: "gap-lines", minzoom: 9.5,
        paint: { "line-color": stepColor, "line-width": 1.5, "line-dasharray": [2, 2], "line-opacity": ["interpolate", ["linear"], ["zoom"], 9.5, 0, 10.5, 0.7] },
      });
      map.addLayer({
        id: "gap-dots", type: "circle", source: "gap-dots", minzoom: 9.5,
        paint: {
          "circle-color": stepColor, "circle-radius": ["get", "r"],
          "circle-stroke-color": "#0A0A0A", "circle-stroke-width": 2,
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 9.5, 0, 10.5, 0.95],
          "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 9.5, 0, 10.5, 1],
        },
      });
      map.on("mousemove", "gap-dots", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const i = e.features?.[0]?.properties?.i;
        if (typeof i === "number") setTip({ x: e.point.x, y: e.point.y, p: shownRef.current[i] });
      });
      map.on("mouseleave", "gap-dots", () => { map.getCanvas().style.cursor = ""; setTip(null); });
      setReady(true);
    });
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Data in, and the view fitted to it.
  const fitted = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("gap-dots") as ml.GeoJSONSource).setData(data.dots);
    (map.getSource("gap-lines") as ml.GeoJSONSource).setData(data.lines);
    if (!fitted.current && shown.length) {
      fitted.current = true;
      const b = new ml.LngLatBounds();
      for (const p of shown) b.extend([p.lon, p.lat]);
      map.fitBounds(b, { padding: 60, maxZoom: 11, duration: 0 });
    }
  }, [data, ready, shown]);

  return (
    <div className="gm">
      <style>{CSS}</style>
      <div className="gm-bar">
        <div className="gm-legend" aria-label="Legend">
          <span className="gm-heat" aria-hidden="true" />
          <span>More gap time</span>
          {STEPS.map((s) => (
            <span key={s.label} className="gm-step"><i style={{ background: s.color }} aria-hidden="true" />{s.label}</span>
          ))}
        </div>
        <label className="gm-own">
          <input type="checkbox" checked={withOwn} onChange={(e) => setWithOwn(e.target.checked)} />
          Include our own failed requests{ownCount ? ` (${ownCount})` : ""}
        </label>
      </div>
      <div className="gm-map">
        <div ref={el} style={{ position: "absolute", inset: 0 }} aria-label="Map of coverage gaps" role="img" />
        {!shown.length && (
          <div className="gm-empty">{points.length ? "Only our own failed requests in this period. Tick the box to show them." : "No gaps with a position in this period."}</div>
        )}
        {tip && (
          <div className="gm-tip" style={{ left: Math.min(tip.x + 14, 9999), top: tip.y + 14 }}>
            <b>{tip.p.tail}</b> · {new Date(tip.p.at.endsWith("Z") ? tip.p.at : tip.p.at + "Z").toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            <div>Unheard {tip.p.outcome === "not_seen_again" ? "and not heard again" : `for ${minutes(tip.p.seconds)}`}</div>
            <div>{tip.p.nm != null ? `${tip.p.nm.toFixed(1)} nm from the field` : ""}{tip.p.agl != null ? ` · ${tip.p.agl.toLocaleString()} ft up` : ""}</div>
            <div className="gm-cause">{tip.p.cause}</div>
          </div>
        )}
      </div>
      <p className="gm-note">Zoomed out, brighter red means more gap time in that area: how often and how long together. Zoom in to see each gap, where the aircraft went quiet and, dashed, where it was heard again.</p>
    </div>
  );
}
