import { NextResponse } from "next/server";

// The basemap's tile list (TileJSON), fetched by our server from OpenFreeMap
// and handed to the web app's map. On 2026-11-25 OpenFreeMap answered the
// browser's own request for it with "204 No Content" while answering servers
// normally, which left the map with no roads, towns or water. The map tiles
// themselves still come straight from OpenFreeMap.

const SOURCE = "https://tiles.openfreemap.org/planet";

export async function GET() {
  let lastError = "no answer";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(SOURCE, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
      if (res.status === 200) {
        const body = await res.json();
        if (Array.isArray(body?.tiles) && body.tiles.length > 0) {
          return NextResponse.json(body, {
            headers: { "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400" },
          });
        }
        lastError = "no tiles in the answer";
      } else {
        lastError = `HTTP ${res.status}`;
      }
    } catch (e) {
      lastError = e instanceof Error ? e.name : "error";
    }
  }
  return NextResponse.json({ error: `OpenFreeMap tile list unavailable (${lastError})` }, {
    status: 502, headers: { "Cache-Control": "no-store" },
  });
}
