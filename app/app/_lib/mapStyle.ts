// The web app's basemap: OpenFreeMap vector tiles (free, no key) drawn in the
// app's own black and grey. Neutral greys only, no tint. Aviation gets the
// emphasis: runways and taxiways are the brightest things on the ground, and
// other airports are labelled with their ICAO codes. Hills come from the open
// Terrain Tiles elevation set on AWS: shading always, real relief in 3D.

import type { StyleSpecification } from "maplibre-gl";

const FONT = ["Noto Sans Regular"];
const FONT_BOLD = ["Noto Sans Bold"];
const HALO = "#0A0A0A";
const DEM = {
  type: "raster-dem" as const,
  tiles: ["https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png"],
  encoding: "terrarium" as const,
  tileSize: 256,
  maxzoom: 13,
};

export const MAP_STYLE: StyleSpecification = {
  version: 8,
  name: "FinalPing dark",
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    omt: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
      attribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    },
    // Two copies on purpose: MapLibre wants shading and relief on separate sources.
    "dem-shade": { ...DEM, attribution: '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noopener">Terrain Tiles</a>' },
    "dem-relief": DEM,
  },
  sky: {
    "sky-color": "#0A0A0A",
    "horizon-color": "#1A1A1A",
    "fog-color": "#0C0C0C",
    "fog-ground-blend": 0.6,
    "horizon-fog-blend": 0.8,
    "sky-horizon-blend": 0.9,
    "atmosphere-blend": 0,
  },
  light: { anchor: "viewport", color: "#FFFFFF", intensity: 0.3 },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#0E0E0E" } },
    {
      id: "landuse-residential", type: "fill", source: "omt", "source-layer": "landuse",
      filter: ["in", ["get", "class"], ["literal", ["residential", "commercial", "industrial", "retail"]]],
      paint: { "fill-color": "#121212", "fill-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 12, 1] },
    },
    {
      id: "landcover-wood", type: "fill", source: "omt", "source-layer": "landcover",
      filter: ["in", ["get", "class"], ["literal", ["wood", "grass"]]],
      paint: { "fill-color": "#0B0B0B", "fill-opacity": 0.7 },
    },
    {
      id: "hills", type: "hillshade", source: "dem-shade", maxzoom: 14,
      paint: {
        "hillshade-shadow-color": "#000000", "hillshade-highlight-color": "#3A3A3A", "hillshade-accent-color": "#000000",
        "hillshade-exaggeration": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 12, 0.3],
      },
    },
    { id: "water", type: "fill", source: "omt", "source-layer": "water", paint: { "fill-color": "#050505" } },
    {
      id: "waterway", type: "line", source: "omt", "source-layer": "waterway", minzoom: 9,
      paint: { "line-color": "#050505", "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.6, 14, 2.5] },
    },

    // ----- airports -----
    {
      id: "aeroway-area", type: "fill", source: "omt", "source-layer": "aeroway", minzoom: 10,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: { "fill-color": "#181818", "fill-opacity": 0.9 },
    },
    {
      id: "aeroway-taxiway", type: "line", source: "omt", "source-layer": "aeroway", minzoom: 11,
      filter: ["all", ["==", ["geometry-type"], "LineString"], ["==", ["get", "class"], "taxiway"]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#333333", "line-width": ["interpolate", ["exponential", 1.6], ["zoom"], 11, 0.6, 14, 3, 17, 14] },
    },
    {
      id: "aeroway-runway", type: "line", source: "omt", "source-layer": "aeroway", minzoom: 8,
      filter: ["all", ["==", ["geometry-type"], "LineString"], ["==", ["get", "class"], "runway"]],
      paint: {
        "line-color": "#5A5A5A",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 9, 0.3, 11.5, 1], // from far out, small strips would read as scratches
        "line-width": ["interpolate", ["exponential", 1.6], ["zoom"], 8, 0.8, 11, 2.2, 14, 12, 17, 60],
      },
    },

    // ----- roads, faintest first -----
    {
      id: "road-minor", type: "line", source: "omt", "source-layer": "transportation", minzoom: 12.5,
      filter: ["in", ["get", "class"], ["literal", ["minor", "service", "tertiary"]]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#181818", "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 12.5, 0.5, 16, 5] },
    },
    {
      id: "road-secondary", type: "line", source: "omt", "source-layer": "transportation", minzoom: 9.5,
      filter: ["in", ["get", "class"], ["literal", ["secondary", "primary"]]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#1D1D1D", "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 9.5, 0.5, 13, 2, 16, 8] },
    },
    {
      id: "road-major", type: "line", source: "omt", "source-layer": "transportation", minzoom: 5,
      filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk"]]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#262626", "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 5, 0.4, 10, 1.4, 13, 3, 16, 12] },
    },

    // ----- borders -----
    {
      id: "boundary-state", type: "line", source: "omt", "source-layer": "boundary", minzoom: 3,
      filter: ["all", ["==", ["get", "admin_level"], 4], ["!=", ["get", "maritime"], 1]],
      paint: { "line-color": "#2A2A2A", "line-width": 1, "line-dasharray": [3, 3] },
    },
    {
      id: "boundary-country", type: "line", source: "omt", "source-layer": "boundary",
      filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]],
      paint: { "line-color": "#3A3A3A", "line-width": 1.2 },
    },

    // ----- buildings: flat from above, standing up once the map is tilted -----
    {
      id: "building-3d", type: "fill-extrusion", source: "omt", "source-layer": "building", minzoom: 13,
      paint: {
        "fill-extrusion-color": "#1B1B1B",
        "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 13, 0, 14.5, ["coalesce", ["get", "render_height"], 6]],
        "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 13, 0, 14.5, ["coalesce", ["get", "render_min_height"], 0]],
        "fill-extrusion-opacity": 0.9,
      },
    },

    // ----- labels -----
    {
      id: "airport-label", type: "symbol", source: "omt", "source-layer": "aerodrome_label", minzoom: 8.5,
      filter: ["has", "icao"],
      layout: { "text-field": ["get", "icao"], "text-font": FONT_BOLD, "text-size": 10.5, "text-letter-spacing": 0.08, "text-offset": [0, 0.9], "text-anchor": "top" },
      paint: { "text-color": "#8A8A8A", "text-halo-color": HALO, "text-halo-width": 1.4 },
    },
    {
      id: "place-village", type: "symbol", source: "omt", "source-layer": "place", minzoom: 10.5,
      filter: ["in", ["get", "class"], ["literal", ["village", "suburb", "neighbourhood"]]],
      layout: { "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]], "text-font": FONT, "text-size": 11, "text-max-width": 8 },
      paint: { "text-color": "#5E5E5E", "text-halo-color": HALO, "text-halo-width": 1.2 },
    },
    {
      id: "place-town", type: "symbol", source: "omt", "source-layer": "place", minzoom: 7,
      filter: ["==", ["get", "class"], "town"],
      layout: { "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]], "text-font": FONT, "text-size": ["interpolate", ["linear"], ["zoom"], 7, 10.5, 12, 13], "text-max-width": 8 },
      paint: { "text-color": "#737373", "text-halo-color": HALO, "text-halo-width": 1.2 },
    },
    {
      id: "place-city", type: "symbol", source: "omt", "source-layer": "place", minzoom: 3,
      filter: ["==", ["get", "class"], "city"],
      layout: {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]], "text-font": FONT_BOLD,
        "text-size": ["interpolate", ["linear"], ["zoom"], 3, 10, 8, 13, 12, 16], "text-max-width": 8,
        "symbol-sort-key": ["coalesce", ["get", "rank"], 10],
      },
      paint: { "text-color": "#9A9A9A", "text-halo-color": HALO, "text-halo-width": 1.4 },
    },
  ],
};
