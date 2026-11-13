import { NextRequest, NextResponse } from "next/server";

// The desktop apps were retired on 13 November 2026, so there is no installer
// to hand out. Old links land on the page that explains the move to the web app.
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/download", req.url));
}
