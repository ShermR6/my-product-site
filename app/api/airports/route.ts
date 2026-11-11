// app/api/airports/route.ts
//
// Airport search for the web app. The list is the same one the desktop app
// bundles (43,000 airports, 6.7 MB), which is far too big to ship to a browser,
// so it is searched here and at most ten matches are returned.
//
// Row format in lib/data/airports.json:
//   [icao, name, city, region, country, lat, lon, elev_ft, iata,
//    [[le_ident, le_hdg, he_ident, he_hdg, length_ft, le_lat, le_lon, he_lat, he_lon], ...]]

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { promises as fs } from "fs";
import path from "path";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RunwayRow = [string | null, number | null, string | null, number | null, number | null,
  (number | null)?, (number | null)?, (number | null)?, (number | null)?];
type AirportRow = [string, string, string, string, string, number, number, number, string, RunwayRow[]];

let cache: Promise<AirportRow[]> | null = null;

function load(): Promise<AirportRow[]> {
  if (!cache) {
    cache = fs
      .readFile(path.join(process.cwd(), "lib", "data", "airports.json"), "utf8")
      .then((text) => JSON.parse(text) as AirportRow[])
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

/** A runway end's heading: the surveyed one, else from its number (18L -> 180). */
function headingOf(ident: string | null, surveyed: number | null): number | null {
  if (typeof surveyed === "number") return surveyed % 360;
  const n = parseInt(ident ?? "", 10);
  return n >= 1 && n <= 36 ? (n * 10) % 360 : null;
}

function toAirport(a: AirportRow) {
  return {
    icao: a[0],
    name: a[1],
    city: a[2],
    region: a[3],
    country: a[4],
    lat: a[5],
    lon: a[6],
    elev: a[7],
    iata: a[8],
    runways: (a[9] ?? []).map((rw) => ({
      leIdent: rw[0], leHdg: headingOf(rw[0], rw[1]),
      heIdent: rw[2], heHdg: headingOf(rw[2], rw[3]),
      lengthFt: rw[4],
      leLat: rw[5] ?? null, leLon: rw[6] ?? null, heLat: rw[7] ?? null, heLon: rw[8] ?? null,
    })),
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toUpperCase();
  if (q.length < 2 || q.length > 40) return NextResponse.json([]);

  let rows: AirportRow[];
  try {
    rows = await load();
  } catch {
    return NextResponse.json({ error: "Airport list unavailable" }, { status: 500 });
  }

  // Exact code first, then code prefix, then name or city containing the text.
  const exact: AirportRow[] = [];
  const prefix: AirportRow[] = [];
  const contains: AirportRow[] = [];
  for (const a of rows) {
    const icao = a[0]?.toUpperCase() ?? "";
    const iata = a[8]?.toUpperCase() ?? "";
    if (icao === q || iata === q || icao === "K" + q) exact.push(a);
    else if (icao.startsWith(q) || iata.startsWith(q)) prefix.push(a);
    else if (q.length >= 3 && (a[1]?.toUpperCase().includes(q) || a[2]?.toUpperCase().includes(q))) contains.push(a);
    if (exact.length + prefix.length >= 40) break;
  }
  // Airports with runway data are the useful ones; put them ahead within each group.
  const byRunways = (x: AirportRow, y: AirportRow) => (y[9]?.length ?? 0) - (x[9]?.length ?? 0);
  const matches = [...exact, ...prefix.sort(byRunways), ...contains.sort(byRunways)].slice(0, 10);

  return NextResponse.json(matches.map(toAirport), { headers: { "Cache-Control": "private, max-age=300" } });
}
