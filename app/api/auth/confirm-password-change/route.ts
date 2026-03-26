// app/api/auth/confirm-password-change/route.ts
// Verifies the 2FA code and applies the pending password change.

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
  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check pending password exists and hasn't expired
  if (!user.pendingPasswordHash || !user.pendingPasswordExpiry) {
    return NextResponse.json({ error: "No pending password change. Please start over." }, { status: 400 });
  }
  if (new Date() > user.pendingPasswordExpiry) {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        pendingPasswordHash: null,
        pendingPasswordCode: null,
        pendingPasswordExpiry: null,
        pendingPasswordMethod: null,
      },
    });
    return NextResponse.json({ error: "Code expired. Please start over." }, { status: 400 });
  }

  const method = user.pendingPasswordMethod;

  // Verify the code based on method
  if (method === "totp") {
    if (!user.twoFactorTotpSecret) {
      return NextResponse.json({ error: "TOTP not configured" }, { status: 400 });
    }
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.twoFactorTotpSecret),
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: code.replace(/\s/g, ""), window: 1 });
    if (delta === null) {
      return NextResponse.json({ error: "Invalid authenticator code" }, { status: 400 });
    }
  } else {
    // email or sms — verify hashed code
    if (!user.pendingPasswordCode) {
      return NextResponse.json({ error: "No code found. Please start over." }, { status: 400 });
    }
    const isValid = await bcrypt.compare(code.trim(), user.pendingPasswordCode);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
    }
  }

  // Apply the password change and clear pending fields
  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      password: user.pendingPasswordHash,
      pendingPasswordHash: null,
      pendingPasswordCode: null,
      pendingPasswordExpiry: null,
      pendingPasswordMethod: null,
    },
  });

  return NextResponse.json({ success: true });
}
