// app/api/auth/2fa/verify-setup/route.ts
// Verifies the setup code and marks the 2FA method as enabled on the user.

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

  if (!user.pendingTwoFactorMethod || !user.pendingTwoFactorExpiry) {
    return NextResponse.json({ error: "No pending 2FA setup. Please start over." }, { status: 400 });
  }
  if (new Date() > user.pendingTwoFactorExpiry) {
    return NextResponse.json({ error: "Code expired. Please start over." }, { status: 400 });
  }

  const method = user.pendingTwoFactorMethod;

  if (method === "totp") {
    if (!user.twoFactorTotpSecret) {
      return NextResponse.json({ error: "TOTP secret not found. Please start over." }, { status: 400 });
    }
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.twoFactorTotpSecret),
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: code.replace(/\s/g, ""), window: 1 });
    if (delta === null) {
      return NextResponse.json({ error: "Invalid authenticator code. Make sure your app is synced." }, { status: 400 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        twoFactorTotpEnabled: true,
        pendingTwoFactorMethod: null,
        pendingTwoFactorExpiry: null,
        pendingTwoFactorCode: null,
      },
    });
  } else {
    // email or sms
    if (!user.pendingTwoFactorCode) {
      return NextResponse.json({ error: "No code found. Please start over." }, { status: 400 });
    }
    const isValid = await bcrypt.compare(code.trim(), user.pendingTwoFactorCode);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(method === "email" ? { twoFactorEmailEnabled: true } : {}),
        ...(method === "sms"
          ? {
              twoFactorSmsEnabled: true,
              twoFactorPhone: user.pendingTwoFactorPhone,
            }
          : {}),
        pendingTwoFactorMethod: null,
        pendingTwoFactorExpiry: null,
        pendingTwoFactorCode: null,
        pendingTwoFactorPhone: null,
      },
    });
  }

  return NextResponse.json({ success: true, method });
}
