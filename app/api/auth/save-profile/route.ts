// app/api/auth/save-profile/route.ts
// Step 3: Applies name/email changes after 2FA unlock has been confirmed.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name, email } = await req.json();
  const trimmedName = (name ?? "").trim() || null;
  const trimmedEmail = (email ?? "").trim().toLowerCase();

  if (!trimmedEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check unlock token
  if (user.pendingProfileEmail !== "__UNLOCKED__" || !user.pendingProfileExpiry || new Date() > user.pendingProfileExpiry) {
    return NextResponse.json({ error: "Edit session expired. Please verify your identity again." }, { status: 403 });
  }

  // If email is changing, make sure it's not already taken
  const emailChanged = trimmedEmail !== session.user.email;
  if (emailChanged) {
    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return NextResponse.json({ error: "That email is already in use by another account" }, { status: 409 });
    }
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      name: trimmedName,
      email: trimmedEmail,
      pendingProfileEmail: null,
      pendingProfileName: null,
      pendingProfileCode: null,
      pendingProfileExpiry: null,
      pendingProfileMethod: null,
    },
  });

  return NextResponse.json({ success: true, emailChanged, newName: trimmedName });
}
