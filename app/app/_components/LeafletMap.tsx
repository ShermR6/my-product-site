"use client";

// The real map (Leaflet with a dark basemap). Leaflet needs a browser, so
// screens load this with next/dynamic and ssr: false.

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PLANE_PATH } from "./kit";
import { familyOf } from "../_lib/paint";
import { sprite } from "../_lib/fleet3d";

export type MapPlane = {
  tail: string;
  lat: number;
  lon: number;
  heading: number | null;
  /** Inbound: drawn with the blue halo. */
  live: boolean;
  dim?: boolean;
  /** Aircraft type, which picks the 3D shape. */
  type?: string | null;
  /** Paint colour. */
  color?: string;
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
};

const TILES = "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const NM = 1852;

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function planeIcon(p: MapPlane, selected: boolean) {
  const color = p.color && /^#[0-9a-fA-F]{6}$/.test(p.color) ? p.color : "#FAFAFA";
  const img = sprite(familyOf(p.type), color, p.heading);
  if (img) {
    // The 3D model seen from above, already turned to the heading.
    return L.divIcon({
      className: "",
      iconSize: [56, 56],
      iconAnchor: [28, 28],
      html:
        `<div class="fa-plane fa-plane-3d${p.live ? " live" : ""}${selected ? " selected" : ""}" style="opacity:${p.dim ? 0.55 : 1};--paint:${color}">` +
        `<img src="${img}" width="56" height="56" alt="" draggable="false"/>` +
        `<span class="fa-plane-label${p.live ? " live" : ""}">${esc(p.tail)}</span></div>`,
    });
  }
  const halo = p.live ? `<circle r="17" fill="rgba(56,189,248,0.16)"/>` : "";
  const ring = selected ? `<circle r="18" fill="none" stroke="#FAFAFA" stroke-width="1.2"/>` : "";
  return L.divIcon({
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html:
      `<div class="fa-plane" style="opacity:${p.dim ? 0.55 : 1}">` +
      `<svg width="40" height="40" viewBox="-20 -20 40 40" aria-hidden="true">${halo}${ring}` +
      `<path fill="${color}" transform="rotate(${Math.round(p.heading ?? 0)}) scale(0.82)" d="${PLANE_PATH}"/></svg>` +
      `<span class="fa-plane-label${p.live ? " live" : ""}">${esc(p.tail)}</span></div>`,
  });
}

function destination(lat: number, lon: number, bearingDeg: number, nm: number): [number, number] {
  const b = (bearingDeg * Math.PI) / 180;
  const dLat = (nm * Math.cos(b)) / 60;
  const dLon = (nm * Math.sin(b)) / (60 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lon + dLon];
}

export default function LeafletMap({
  center, code, rings, planes = [], selected, onSelect, showRings = true, coverage, fitSeq = 0, interactive = true,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const staticLayer = useRef<L.LayerGroup | null>(null);
  const planeLayer = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // Create the map once.
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, {
      zoomControl: false,
      attributionControl: true,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      zoomSnap: 0.25,
    }).setView([39.5, -98.35], 4);
    m.attributionControl?.setPrefix(false);
    L.tileLayer(TILES, { maxZoom: 16, attribution: "Map &copy; Esri" }).addTo(m);
    if (interactive) {
      L.control.zoom({ position: "bottomright" }).addTo(m);
      L.control.scale({ position: "bottomleft", imperial: false, metric: false, maxWidth: 120 }).addTo(m);
      m.on("click", () => onSelectRef.current?.(null));
    }
    staticLayer.current = L.layerGroup().addTo(m);
    planeLayer.current = L.layerGroup().addTo(m);
    map.current = m;

    // The container often gets its final size a moment after mount.
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
    };
  }, [interactive]);

  const lat = center?.lat;
  const lon = center?.lon;
  const ringsKey = rings.join(",");
  const coverageKey = coverage ? `${coverage.lat},${coverage.lon},${coverage.rangeNm.join(",")}` : "";

  // Airport, rings and receiver coverage.
  useEffect(() => {
    const layer = staticLayer.current;
    if (!layer) return;
    layer.clearLayers();
    if (lat == null || lon == null) return;

    if (coverage && coverage.rangeNm.some((n) => n > 0)) {
      const step = 360 / coverage.rangeNm.length;
      // One wedge per mapped bearing; unmapped bearings stay empty.
      coverage.rangeNm.forEach((n, i) => {
        if (!(n > 0)) return;
        const here: [number, number] = [coverage.lat, coverage.lon];
        const pts = [here, destination(coverage.lat, coverage.lon, (i - 0.5) * step, n), destination(coverage.lat, coverage.lon, i * step, n), destination(coverage.lat, coverage.lon, (i + 0.5) * step, n)];
        L.polygon(pts, { stroke: false, fillColor: "#FAFAFA", fillOpacity: 0.09, interactive: false }).addTo(layer);
      });
    }

    if (showRings) {
      const list = ringsKey ? ringsKey.split(",").map(Number) : [];
      list.forEach((r, i) => {
        const inner = i === list.length - 1 && list.length > 1;
        L.circle([lat, lon], {
          radius: r * NM, color: inner ? "#B0B0B0" : "#7A7A7A", weight: 1, fill: false,
          dashArray: inner ? "3 5" : undefined, interactive: false,
        }).addTo(layer);
        L.marker(destination(lat, lon, 270, r), {
          interactive: false, keyboard: false,
          icon: L.divIcon({ className: "", iconSize: [0, 0], html: `<span class="fa-ring-label" style="position:absolute;left:6px;top:-18px">${r} nm</span>` }),
        }).addTo(layer);
      });
    }

    L.marker([lat, lon], {
      interactive: false, keyboard: false,
      icon: L.divIcon({
        className: "", iconSize: [0, 0],
        html: `<span style="position:absolute;left:-5px;top:-5px;width:10px;height:10px;border-radius:50%;background:#FAFAFA;box-shadow:0 0 0 4px rgba(250,250,250,0.15)"></span>` +
          (code ? `<span class="fa-plane-label" style="position:absolute;left:12px;top:6px">${esc(code)}</span>` : ""),
      }),
    }).addTo(layer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, ringsKey, showRings, code, coverageKey]);

  // Fit the view to the widest ring.
  useEffect(() => {
    const m = map.current;
    if (!m || lat == null || lon == null) return;
    const widest = Math.max(...(ringsKey ? ringsKey.split(",").map(Number) : [10]), 2) * 1.12;
    const sw = destination(lat, lon, 225, widest * Math.SQRT2);
    const ne = destination(lat, lon, 45, widest * Math.SQRT2);
    m.fitBounds([sw, ne], { animate: false });
  }, [lat, lon, ringsKey, fitSeq]);

  // Aircraft.
  const planesKey = planes.map((p) => `${p.tail}:${p.lat.toFixed(4)}:${p.lon.toFixed(4)}:${Math.round(p.heading ?? 0)}:${p.live}:${p.dim}:${p.type ?? ""}:${p.color ?? ""}`).join("|");
  useEffect(() => {
    const layer = planeLayer.current;
    if (!layer) return;
    layer.clearLayers();
    for (const p of planes) {
      const mk = L.marker([p.lat, p.lon], {
        icon: planeIcon(p, p.tail === selected), title: p.tail, alt: p.tail,
        zIndexOffset: p.tail === selected ? 1000 : p.live ? 500 : 0, interactive, keyboard: interactive,
      });
      mk.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectRef.current?.(p.tail);
      });
      mk.addTo(layer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planesKey, selected, interactive]);

  // Bring a newly selected aircraft into view.
  useEffect(() => {
    const m = map.current;
    const p = planes.find((x) => x.tail === selected);
    if (!m || !p) return;
    if (!m.getBounds().pad(-0.15).contains([p.lat, p.lon])) m.panTo([p.lat, p.lon]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return <div ref={el} style={{ position: "absolute", inset: 0 }} aria-label="Map" />;
}
