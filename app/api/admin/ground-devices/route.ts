import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = "https://aircraft-tracker-backend-production.up.railway.app";
const INTERNAL_SECRET = process.env.WEBHOOK_INTERNAL_SECRET ?? "finalping-internal-secret";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const res = await fetch(`${BACKEND_URL}/api/internal/ground-devices`, {
    headers: { "x-internal-secret": INTERNAL_SECRET },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
  return NextResponse.json(await res.json());
}
