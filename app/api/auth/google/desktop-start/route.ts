import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // scheme is encoded into state so it flows through Google's redirect unchanged
  const scheme = searchParams.get("scheme") || "finalpingapp";
  const random = crypto.randomBytes(16).toString("hex");
  // Encode scheme into state: "{random}:{scheme}" — hex has no colons so split is safe
  const state = scheme === "finalpingapp" ? random : `${random}:${scheme}`;

  await prisma.oAuthState.create({
    data: {
      state,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  // Clean up expired states while we're here
  await prisma.oAuthState.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/desktop-callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
