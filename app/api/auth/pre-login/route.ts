import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
const bcrypt = require("bcryptjs");

export async function POST(req: NextRequest) {
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
