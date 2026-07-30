import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import * as OTPAuth from "otpauth";
import crypto from "crypto";
const bcrypt = require("bcryptjs");

// After this many wrong codes we burn the pending code so the attacker has to
// request a fresh one (which is itself rate-limited in send-2fa-login).
const MAX_CODE_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { email, password, code, method } = await req.json();
    if (!email || !password || !code || !method) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const normEmail = email.toLowerCase().trim();

    // Two layers: per-IP (blocks distributed hammering) and per-account
    // (blocks brute-force spread across many IPs against one target).
    const rlIp = await rateLimit(`2fa-verify-ip:${clientIp(req)}`, 20, 60_000);
    const rlAcct = await rateLimit(`2fa-verify:${normEmail}`, 10, 5 * 60_000);
    if (!rlIp.allowed || !rlAcct.allowed) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
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
        const attempts = (user.pendingLoginAttempts ?? 0) + 1;
        if (attempts >= MAX_CODE_ATTEMPTS) {
          // Burn the code so a fresh (rate-limited) one must be requested.
          await prisma.user.update({
            where: { id: user.id },
            data: { pendingLoginToken: null, pendingLoginExpiry: null, pendingLoginAttempts: 0 },
          });
          return NextResponse.json(
            { error: "Too many incorrect codes. Please request a new one." },
            { status: 429 }
          );
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { pendingLoginAttempts: attempts },
        });
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
        pendingLoginAttempts: 0,
      },
    });

    return NextResponse.json({ loginToken });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
