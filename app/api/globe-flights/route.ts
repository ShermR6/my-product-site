// app/api/globe-flights/route.ts
//
// Live airliners with routes for the homepage globe.
//
// Positions come from adsb.lol's open API (ODbL 1.0), which answers for a
// circle of up to 250 nm, so a set of busy regions around the world is
// sampled. A few regions are refreshed per call, oldest first, and the rest
// are kept from earlier calls, so the whole world is covered within a few
// minutes while adsb.lol sees about eight requests a minute. The response is
// cached by the CDN for a minute: visitors never cause requests of their own.
//
// Routes come from the Virtual Radar Server standing data that adsb.lol
// publishes as static files (CC0), and are kept only when the aircraft's
// position fits the route.
//
// Airline flights only: an airline-style callsign, an airliner-sized aircraft,
// at cruise altitude, and never one flagged military, private (PIA) or
// LADD-blocked. Business-jet operators fly under airline-style callsigns too
// (NetJets is EJA), so aircraft size decides, plus a short list of them.

import { NextResponse } from "next/server";
import { AIRCRAFT_TYPES } from "@/lib/flightNames";

export const dynamic = "force-dynamic";

type Region = { name: string; lat: number; lon: number };

const REGIONS: Region[] = [
  { name: "New York", lat: 40.6, lon: -73.8 },
  { name: "Chicago", lat: 41.9, lon: -87.9 },
  { name: "Atlanta", lat: 33.6, lon: -84.4 },
  { name: "Dallas", lat: 32.9, lon: -97.0 },
  { name: "Denver", lat: 39.8, lon: -104.7 },
  { name: "Los Angeles", lat: 33.9, lon: -118.4 },
  { name: "Seattle", lat: 47.4, lon: -122.3 },
  { name: "Miami", lat: 25.8, lon: -80.3 },
  { name: "Mexico City", lat: 19.4, lon: -99.1 },
  { name: "São Paulo", lat: -23.4, lon: -46.5 },
  { name: "Bogotá", lat: 4.7, lon: -74.1 },
  { name: "North Atlantic", lat: 52.0, lon: -30.0 },
  { name: "London", lat: 51.5, lon: -0.5 },
  { name: "Frankfurt", lat: 50.0, lon: 8.6 },
  { name: "Madrid", lat: 40.5, lon: -3.6 },
  { name: "Istanbul", lat: 41.3, lon: 28.8 },
  { name: "Dubai", lat: 25.3, lon: 55.4 },
  { name: "Delhi", lat: 28.6, lon: 77.1 },
  { name: "Singapore", lat: 1.4, lon: 104.0 },
  { name: "Hong Kong", lat: 22.3, lon: 113.9 },
  { name: "Seoul", lat: 37.5, lon: 126.8 },
  { name: "Tokyo", lat: 35.6, lon: 139.8 },
  { name: "Sydney", lat: -33.9, lon: 151.2 },
  { name: "Johannesburg", lat: -26.1, lon: 28.2 },
];

const REGION_RADIUS_NM = 250;
const REFRESH_PER_CALL = 8;          // regions asked for per call, oldest first
const REGION_MAX_AGE_MS = 6 * 60_000; // drop a region's aircraft after this
const PER_REGION = 30;               // aircraft kept per region (from the one request: no extra load)
const ROUTES_PER_REGION = 30;        // all of them are looked up for a route (cached for hours)
const NEW_LOOKUPS_PER_CALL = 60;     // route files fetched per call; the rest wait for later calls
const LOOKUP_CONCURRENCY = 10;       // at once: hundreds together get throttled
const MIN_ALT_FT = 10_000;

// dbFlags bits: 1 military, 4 PIA (privacy address), 8 LADD
const HIDDEN_FLAGS = 1 | 4 | 8;
const AIRLINE_CALLSIGN = /^[A-Z]{3}[0-9]{1,4}[A-Z]{0,2}$/;
// ADS-B emitter categories: A3 large, A4 high-vortex large (757), A5 heavy.
// A1/A2 are light and small aircraft, which is where business jets fall.
const AIRLINER_CATEGORIES = new Set(["A3", "A4", "A5"]);
const BUSINESS_JET_OPERATORS = new Set(["EJA", "LXJ", "EJM", "VJT", "XOJ", "JRE", "TWY", "GAJ", "KOW", "FLJ", "JTL", "LXA"]);

export type GlobeAirport = { iata: string; city: string; lat: number; lon: number };
export type GlobeFlight = {
  id: string;            // ICAO hex
  cs: string;            // callsign, e.g. BAW117
  al: string;            // airline ICAO code, e.g. BAW
  t: string | null;      // ICAO type, e.g. B77W
  alt: number;           // ft
  gs: number | null;     // kt
  lat: number;
  lon: number;
  route?: { from: GlobeAirport; to: GlobeAirport };
};

type AdsbAircraft = {
  hex?: string; flight?: string; t?: string; alt_baro?: number | string; gs?: number;
  lat?: number; lon?: number; dbFlags?: number; category?: string; seen_pos?: number;
};

// Kept between calls on a warm server.
const regionCache = new Map<string, { at: number; flights: GlobeFlight[] }>();
const routeCache = new Map<string, { at: number; route: GlobeFlight["route"] | null }>();
const ROUTE_TTL_MS = 6 * 3_600_000;

function toFlight(a: AdsbAircraft): GlobeFlight | null {
  const cs = (a.flight ?? "").trim().toUpperCase();
  if (!a.hex || !AIRLINE_CALLSIGN.test(cs) || BUSINESS_JET_OPERATORS.has(cs.slice(0, 3))) return null;
  if (a.category ? !AIRLINER_CATEGORIES.has(a.category) : !(a.t && a.t in AIRCRAFT_TYPES)) return null;
  if (typeof a.lat !== "number" || typeof a.lon !== "number") return null;
  if (typeof a.alt_baro !== "number" || a.alt_baro < MIN_ALT_FT) return null;
  if ((a.dbFlags ?? 0) & HIDDEN_FLAGS) return null;
  if (typeof a.seen_pos === "number" && a.seen_pos > 60) return null;
  return {
    id: a.hex.toLowerCase(),
    cs,
    al: cs.slice(0, 3),
    t: a.t ?? null,
    alt: Math.round(a.alt_baro),
    gs: typeof a.gs === "number" ? Math.round(a.gs) : null,
    lat: Math.round(a.lat * 1000) / 1000,
    lon: Math.round(a.lon * 1000) / 1000,
  };
}

async function fetchRegion(r: Region): Promise<GlobeFlight[] | null> {
  try {
    const res = await fetch(`https://api.adsb.lol/v2/point/${r.lat}/${r.lon}/${REGION_RADIUS_NM}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { ac?: AdsbAircraft[] };
    const flights = (body.ac ?? []).map(toFlight).filter((f): f is GlobeFlight => f !== null);
    // Spread across the circle rather than the first few listed.
    flights.sort((a, b) => a.id.localeCompare(b.id));
    const step = Math.max(1, Math.floor(flights.length / PER_REGION));
    return flights.filter((_, i) => i % step === 0).slice(0, PER_REGION);
  } catch {
    return null;
  }
}

// ── routes ───────────────────────────────────────────────────────────────────

function nm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 3440.065;
  const p1 = (aLat * Math.PI) / 180, p2 = (bLat * Math.PI) / 180;
  const dp = p2 - p1, dl = ((bLon - aLon) * Math.PI) / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

type VrsAirport = { iata?: string; icao?: string; location?: string; name?: string; lat?: number; lon?: number };

/** The leg of a published route the aircraft is plausibly flying, or null. */
function plausibleLeg(f: GlobeFlight, airports: VrsAirport[]): GlobeFlight["route"] | null {
  for (let i = 0; i + 1 < airports.length; i++) {
    const a = airports[i], b = airports[i + 1];
    if (typeof a.lat !== "number" || typeof a.lon !== "number" || typeof b.lat !== "number" || typeof b.lon !== "number") continue;
    const leg = nm(a.lat, a.lon, b.lat, b.lon);
    const via = nm(a.lat, a.lon, f.lat, f.lon) + nm(f.lat, f.lon, b.lat, b.lon);
    if (leg > 150 && via <= leg * 1.2 + 120) {
      const ap = (x: VrsAirport): GlobeAirport => ({
        iata: x.iata || x.icao || "",
        city: x.location || x.name || "",
        lat: x.lat as number,
        lon: x.lon as number,
      });
      return { from: ap(a), to: ap(b) };
    }
  }
  return null;
}

async function routeFor(f: GlobeFlight, budget: { left: number }): Promise<GlobeFlight["route"] | null> {
  const hit = routeCache.get(f.cs);
  if (hit && Date.now() - hit.at < ROUTE_TTL_MS) {
    // A cached route still has to fit where the aircraft is now.
    return hit.route ? plausibleLeg(f, [
      { iata: hit.route.from.iata, location: hit.route.from.city, lat: hit.route.from.lat, lon: hit.route.from.lon },
      { iata: hit.route.to.iata, location: hit.route.to.city, lat: hit.route.to.lat, lon: hit.route.to.lon },
    ]) : null;
  }
  if (budget.left <= 0) return null;   // looked up on a later call
  budget.left--;
  let airports: VrsAirport[] = [];
  try {
    const res = await fetch(`https://vrs-standing-data.adsb.lol/routes/${f.cs.slice(0, 2)}/${f.cs}.json`, {
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(4000),
    });
    // Only a missing file means "no route". Anything else (throttled, an
    // outage) is not remembered, so the flight is tried again later.
    if (res.status === 404) {
      routeCache.set(f.cs, { at: Date.now(), route: null });
      return null;
    }
    if (!res.ok) return null;
    airports = ((await res.json()) as { _airports?: VrsAirport[] })._airports ?? [];
  } catch {
    return null;
  }
  const route = plausibleLeg(f, airports);
  routeCache.set(f.cs, { at: Date.now(), route });
  return route;
}

/** fn over items, at most `limit` at a time, results in order. */
async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// ── handler ──────────────────────────────────────────────────────────────────

export async function GET() {
  const now = Date.now();
  const due = [...REGIONS]
    .sort((a, b) => (regionCache.get(a.name)?.at ?? 0) - (regionCache.get(b.name)?.at ?? 0))
    .slice(0, regionCache.size === 0 ? 12 : REFRESH_PER_CALL);

  const fresh = await Promise.all(due.map(fetchRegion));
  due.forEach((r, i) => {
    const flights = fresh[i];
    if (flights) regionCache.set(r.name, { at: now, flights });
  });

  const seen = new Set<string>();
  const flights: GlobeFlight[] = [];
  const picks: GlobeFlight[] = [];   // looked up for a route: a few from every region
  for (const r of REGIONS) {
    const entry = regionCache.get(r.name);
    if (!entry || now - entry.at > REGION_MAX_AGE_MS) continue;
    let picked = 0;
    for (const f of entry.flights) {
      if (seen.has(f.id)) continue;
      seen.add(f.id);
      const copy = { ...f };
      flights.push(copy);
      if (picked < ROUTES_PER_REGION) { picks.push(copy); picked++; }
    }
  }
  // Routes, so the globe can draw each flight between its two cities.
  // Flights with a remembered route first, then new lookups, a few at a time.
  picks.sort((a, b) => Number(routeCache.has(b.cs)) - Number(routeCache.has(a.cs)));
  const budget = { left: NEW_LOOKUPS_PER_CALL };
  const routes = await mapLimited(picks, LOOKUP_CONCURRENCY, (f) => routeFor(f, budget));
  picks.forEach((f, i) => { if (routes[i]) f.route = routes[i]!; });

  // The globe draws flights between their two cities, so only those with a
  // route are sent.
  const routed = flights.filter((f) => f.route);
  const ok = routed.length > 0;
  return NextResponse.json(
    { updated: new Date(now).toISOString(), flights: routed },
    {
      headers: {
        // One shared copy a minute; a short one while adsb.lol is unavailable.
        "Cache-Control": ok ? "public, s-maxage=60, stale-while-revalidate=300" : "public, s-maxage=15",
      },
    }
  );
}
