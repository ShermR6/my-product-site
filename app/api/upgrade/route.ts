import { NextResponse } from "next/server";

// There is one plan since 13 November 2026, so there is nothing to upgrade to.
// The route stays so an old dashboard tab gets a clear answer instead of a 404.
export async function POST() {
  return NextResponse.json(
    { error: "FinalPing has a single plan now, so there is nothing to upgrade to. Everything is already included." },
    { status: 410 }
  );
}
