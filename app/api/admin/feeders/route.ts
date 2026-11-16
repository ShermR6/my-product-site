import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { INTERNAL_SECRET } from "@/lib/internalSecret";

const BACKEND_URL = "https://aircraft-tracker-backend-production.up.railway.app";

// Accounts whose receiver feeds adsb.lol: where each stands on the free plan,
// which receivers it earns with, and refused attempts. Admin only.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const res = await fetch(`${BACKEND_URL}/api/internal/feeders`, {
    headers: { "x-internal-secret": INTERNAL_SECRET },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ error: "Failed to fetch feeders" }, { status: 500 });
  return NextResponse.json(await res.json());
}
