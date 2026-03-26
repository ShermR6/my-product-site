// app/api/alerts-proxy/route.ts
// Server-side proxy for fetching alert history from Railway backend.
// Used by the Alerts tab in the dashboard (client component can't use internal secrets directly).

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://aircraft-tracker-backend-production.up.railway.app";
const INTERNAL_SECRET = process.env.WEBHOOK_INTERNAL_SECRET ?? "";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = session.user.email;

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/internal/notifications?email=${encodeURIComponent(email)}&limit=100`,
      {
        headers: { "x-internal-secret": INTERNAL_SECRET },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch alerts" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 500 });
  }
}
