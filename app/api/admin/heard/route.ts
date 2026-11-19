import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { INTERNAL_SECRET } from "@/lib/internalSecret";

const BACKEND_URL = "https://aircraft-tracker-backend-production.up.railway.app";

// Every aircraft heard by each receiver (and the tracked aircraft adsb.lol
// has), with what it broadcasts on. Admin only.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 30));
  const res = await fetch(`${BACKEND_URL}/api/internal/heard?days=${days}`, {
    headers: { "x-internal-secret": INTERNAL_SECRET },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ error: "Failed to fetch heard aircraft" }, { status: 500 });
  return NextResponse.json(await res.json());
}
