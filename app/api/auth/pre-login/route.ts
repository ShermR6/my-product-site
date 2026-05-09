import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
const bcrypt = require("bcryptjs");

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed, retryAfter } = rateLimit(ip, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, {
      status: 429, headers: { "Retry-After": String(retryAfter) }
    });
  }

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const has2FA = user.twoFactorEmailEnabled || user.twoFactorSmsEnabled || user.twoFactorTotpEnabled;
    if (!has2FA) {
      return NextResponse.json({ requires2FA: false });
    }

    const methods: string[] = [];
    if (user.twoFactorEmailEnabled) methods.push("email");
    if (user.twoFactorSmsEnabled) methods.push("sms");
    if (user.twoFactorTotpEnabled) methods.push("totp");

    return NextResponse.json({ requires2FA: true, methods });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
