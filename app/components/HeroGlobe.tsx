"use client";

// The rotating globe from the previous homepage (cobe), now under the hero.
// Drawn in the browser only: it is a WebGL canvas with nothing to render on
// the server. Drag to spin it.

import dynamic from "next/dynamic";

const Globe = dynamic(() => import("./ui/cobe-globe").then((m) => m.Globe), { ssr: false });

const SKY: [number, number, number] = [0.22, 0.74, 0.97];

const MARKERS = [
  { id: "nyc", location: [40.7128, -74.006] as [number, number], label: "New York" },
  { id: "lnd", location: [51.5074, -0.1278] as [number, number], label: "London" },
  { id: "dxb", location: [25.2048, 55.2708] as [number, number], label: "Dubai" },
  { id: "tyo", location: [35.6762, 139.6503] as [number, number], label: "Tokyo" },
  { id: "syd", location: [-33.8688, 151.2093] as [number, number], label: "Sydney" },
  { id: "mia", location: [25.7617, -80.1918] as [number, number], label: "Miami" },
  { id: "gru", location: [-23.5505, -46.6333] as [number, number], label: "São Paulo" },
  { id: "lax", location: [34.0522, -118.24] as [number, number], label: "Los Angeles" },
];

const ARCS = [
  { id: "nyc-lnd", from: [40.7128, -74.006] as [number, number], to: [51.5074, -0.1278] as [number, number], color: SKY },
  { id: "mia-nyc", from: [25.7617, -80.1918] as [number, number], to: [40.7128, -74.006] as [number, number], color: SKY },
  { id: "lax-tyo", from: [34.0522, -118.24] as [number, number], to: [35.6762, 139.65] as [number, number], color: SKY },
  { id: "dxb-syd", from: [25.2048, 55.27] as [number, number], to: [-33.8688, 151.21] as [number, number], color: SKY },
  { id: "mia-gru", from: [25.7617, -80.1918] as [number, number], to: [-23.5505, -46.6333] as [number, number], color: SKY },
];

export default function HeroGlobe() {
  // Still for anyone who has asked for less motion; it can still be dragged.
  const still = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <div className="fh-globe" aria-hidden="true">
      <Globe
        markers={MARKERS}
        arcs={ARCS}
        dark={1}
        baseColor={[0.32, 0.32, 0.32]}
        markerColor={SKY}
        arcColor={SKY}
        glowColor={[0.09, 0.09, 0.09]}
        mapBrightness={5}
        markerSize={0.04}
        speed={still ? 0 : 0.001}
        theta={0.25}
        diffuse={1.5}
        mapSamples={16000}
      />
    </div>
  );
}
