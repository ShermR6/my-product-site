import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const base = process.env.NEXTAUTH_URL ?? "https://finalpingapp.com";

  if (error) {
    return NextResponse.redirect(`${base}/auth/desktop-complete?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${base}/auth/desktop-complete?error=missing_params`);
  }

  // Verify state (state may be "{random}:{scheme}" — look up the full string)
  const storedState = await prisma.oAuthState.findUnique({ where: { state } });
  if (!storedState || storedState.expiresAt < new Date()) {
    return NextResponse.redirect(`${base}/auth/desktop-complete?error=invalid_state`);
  }
  await prisma.oAuthState.delete({ where: { state } });

  // Parse scheme encoded in state
  const colonIdx = state.indexOf(":");
  const scheme = colonIdx !== -1 ? state.slice(colonIdx + 1) : "finalpingapp";

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/desktop-callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${base}/auth/desktop-complete?error=token_exchange_failed`);
  }

  const tokens = await tokenRes.json();

  // Get user info from Google
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(`${base}/auth/desktop-complete?error=userinfo_failed`);
  }

  const googleUser = await userRes.json();
  const email = googleUser.email.toLowerCase();

  // Find or create user in Prisma
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: googleUser.name, image: googleUser.picture },
    });
  }

  // Generate short-lived desktop exchange token (single-use, 5 min)
  const desktopToken = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      desktopOAuthToken: desktopToken,
      desktopOAuthExpiry: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  const schemeParam = scheme !== "finalpingapp" ? `&scheme=${encodeURIComponent(scheme)}` : "";
  return NextResponse.redirect(
    `${base}/auth/desktop-complete?token=${desktopToken}&email=${encodeURIComponent(email)}${schemeParam}`
  );
}
