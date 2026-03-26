// app/api/auth/2fa/disable/route.ts
// Disables a specific 2FA method for the user.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { method } = await req.json();

  if (!["email", "sms", "totp"].includes(method)) {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }

  const updateData: Record<string, boolean | null> = {};

  if (method === "email") {
    updateData.twoFactorEmailEnabled = false;
  } else if (method === "sms") {
    updateData.twoFactorSmsEnabled = false;
    updateData.twoFactorPhone = null;
  } else if (method === "totp") {
    updateData.twoFactorTotpEnabled = false;
    updateData.twoFactorTotpSecret = null;
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: updateData,
  });

  return NextResponse.json({ success: true, method });
}
