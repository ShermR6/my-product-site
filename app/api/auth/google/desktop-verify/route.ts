import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const internalSecret = process.env.WEBHOOK_INTERNAL_SECRET || "";
  const reqSecret = req.headers.get("x-internal-secret") || "";
  if (internalSecret && reqSecret !== internalSecret) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const { token, email } = await req.json();

  if (!token || !email) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (
    !user ||
    !user.desktopOAuthToken ||
    !user.desktopOAuthExpiry ||
    user.desktopOAuthToken !== token ||
    user.desktopOAuthExpiry < new Date()
  ) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  // Consume the token — single use
  await prisma.user.update({
    where: { id: user.id },
    data: { desktopOAuthToken: null, desktopOAuthExpiry: null },
  });

  return NextResponse.json({ valid: true, email: user.email, name: user.name });
}
