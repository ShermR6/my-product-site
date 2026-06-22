// app/api/auth/confirm-profile-change/route.ts
// Step 2: Verifies the 2FA code and sets an unlock token so the edit form can be shown.
// Does NOT apply any changes — just authorizes the edit session for 10 minutes.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as OTPAuth from "otpauth";
const bcrypt = require("bcryptjs");

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!user.pendingProfileExpiry) {
    return NextResponse.json({ error: "No pending verification. Please start over." }, { status: 400 });
  }
  if (new Date() > user.pendingProfileExpiry) {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { pendingProfileCode: null, pendingProfileExpiry: null, pendingProfileMethod: null },
    });
    return NextResponse.json({ error: "Code expired. Please start over." }, { status: 400 });
  }

  const method = user.pendingProfileMethod;

  if (method === "totp") {
    if (!user.twoFactorTotpSecret) {
      return NextResponse.json({ error: "TOTP not configured" }, { status: 400 });
    }
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.twoFactorTotpSecret),
      digits: 6, period: 30,
    });
    if (totp.validate({ token: code.replace(/\s/g, ""), window: 1 }) === null) {
      return NextResponse.json({ error: "Invalid authenticator code" }, { status: 400 });
    }
  } else {
    if (!user.pendingProfileCode) {
      return NextResponse.json({ error: "No code found. Please start over." }, { status: 400 });
    }
    const isValid = await bcrypt.compare(code.trim(), user.pendingProfileCode);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
    }
  }

  // Mark as unlocked for 10 minutes — client can now show the edit form
  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      pendingProfileEmail: "__UNLOCKED__",
      pendingProfileCode: null,
      pendingProfileMethod: null,
      pendingProfileExpiry: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  return NextResponse.json({ success: true });
}
