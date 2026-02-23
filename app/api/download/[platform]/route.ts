import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const DOWNLOAD_URLS: Record<string, string> = {
  windows: process.env.DOWNLOAD_URL_WINDOWS ?? "#",
  mac: process.env.DOWNLOAD_URL_MAC ?? "#",
  linux: process.env.DOWNLOAD_URL_LINUX ?? "#",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { platform } = await params;
  const url = DOWNLOAD_URLS[platform];
  if (!url || url === "#") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  return NextResponse.redirect(url);
}
