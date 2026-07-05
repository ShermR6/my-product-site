import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import * as OTPAuth from "otpauth";
import crypto from "crypto";
const bcrypt = require("bcryptjs");

export async function POST(req: NextRequest) {
  try {
    const { email, password, code, method } = await req.json();
    if (!email || !password || !code || !method) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Lock out brute-force of the 6-digit code: at most 5 verify attempts per
    // account per 10 minutes (a valid password is not enough on its own).
    const normEmail = email.toLowerCase().trim();
    const rl = rateLimit(`2fa-verify:${normEmail}`, 5, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${rl.retryAfter}s.` },
        { status: 429 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email: normEmail } });
    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid request." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid request." }, { status: 401 });
    }

    if (method === "totp") {
      if (!user.twoFactorTotpSecret) {
        return NextResponse.json({ error: "TOTP not configured." }, { status: 400 });
      }
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(user.twoFactorTotpSecret),
        digits: 6,
        period: 30,
      });
      const delta = totp.validate({ token: code.replace(/\s/g, ""), window: 1 });
      if (delta === null) {
        return NextResponse.json({ error: "Invalid authenticator code." }, { status: 400 });
      }
    } else {
      // email or sms
      if (!user.pendingLoginToken || !user.pendingLoginExpiry) {
        return NextResponse.json({ error: "No code found. Please request a new one." }, { status: 400 });
      }
      if (new Date() > user.pendingLoginExpiry) {
        return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
      }
      const codeValid = await bcrypt.compare(code.trim(), user.pendingLoginToken);
      if (!codeValid) {
        return NextResponse.json({ error: "Invalid code." }, { status: 400 });
      }
    }

    // Generate a single-use login token valid for 5 minutes
    const loginToken = crypto.randomBytes(32).toString("hex");
    const loginExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { email: user.email! },
      data: {
        pendingLoginToken: loginToken,
        pendingLoginExpiry: loginExpiry,
      },
    });

    return NextResponse.json({ loginToken });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
