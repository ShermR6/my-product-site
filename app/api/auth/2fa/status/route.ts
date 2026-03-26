// app/api/auth/2fa/status/route.ts
// Returns the user's current 2FA configuration.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      twoFactorEmailEnabled: true,
      twoFactorSmsEnabled: true,
      twoFactorTotpEnabled: true,
      twoFactorPhone: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    email: user.twoFactorEmailEnabled,
    sms: user.twoFactorSmsEnabled,
    totp: user.twoFactorTotpEnabled,
    // Mask phone number for display: e.g. +1 (***) ***-1234
    phone: user.twoFactorPhone
      ? user.twoFactorPhone.slice(0, -4).replace(/\d/g, "*") + user.twoFactorPhone.slice(-4)
      : null,
  });
}
