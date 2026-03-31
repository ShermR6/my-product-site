// app/api/auth/verify/route.ts
// Called by Railway to verify a user's email + password.
// Protected by internal secret — never expose this publicly.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
const bcrypt = require("bcryptjs");

const INTERNAL_SECRET = process.env.WEBHOOK_INTERNAL_SECRET ?? "";

export async function POST(req: NextRequest) {
  // Verify internal secret
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.password) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Return user info — Railway will use this to look up or create the user
  return NextResponse.json({
    valid: true,
    email: user.email,
    name: user.name,
  });
}
