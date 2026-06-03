import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

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
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
