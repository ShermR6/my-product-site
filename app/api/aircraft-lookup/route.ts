// app/api/aircraft-lookup/route.ts
//
// Registry lookup for the web app's "Add aircraft" form: give it a tail number
// or a 6-character transponder (ICAO hex) code and it returns both, plus the
// aircraft type. Uses adsbdb, the same source the desktop app calls directly;
// here it is called from the server so the page's connect-src stays closed.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (q.length < 3 || q.length > 10) return NextResponse.json({ found: false });

  try {
    const res = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(q)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ found: false });
    const info = (await res.json())?.response?.aircraft;
    if (!info?.mode_s) return NextResponse.json({ found: false });

    const type = [info.manufacturer, info.type].filter(Boolean).join(" ").trim();
    return NextResponse.json({
      found: true,
      tail_number: String(info.registration ?? q).toUpperCase(),
      icao24: String(info.mode_s).toLowerCase(),
      aircraft_type: type || info.icao_type || "",
    });
  } catch {
    return NextResponse.json({ found: false });
  }
}
