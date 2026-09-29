// app/api/auth/verify/route.ts
// Called by the Railway backend to verify a user's email + password (+ 2FA).
// Protected by the internal secret — never expose this publicly.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validInternalSecret } from "@/lib/internalSecret";
import * as OTPAuth from "otpauth";
const bcrypt = require("bcryptjs");

// Keep in sync with complete-2fa-login: burn the code after this many misses.
const MAX_CODE_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  if (!validInternalSecret(req.headers.get("x-internal-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, password, code, method } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.password) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // ── Second factor ──────────────────────────────────────────────────────────
  // The desktop app authenticates through this endpoint, so 2FA MUST be enforced
  // here too — otherwise a password alone would bypass the second factor that the
  // website login requires.
  const methods: string[] = [];
  if (user.twoFactorTotpEnabled) methods.push("totp");
  if (user.twoFactorEmailEnabled) methods.push("email");
  if (user.twoFactorSmsEnabled) methods.push("sms");

  if (methods.length > 0) {
    // Password is correct but a code is required. Without one, tell the caller
    // which methods exist; the backend dispatches an email/SMS code (via
    // send-2fa-login) and re-calls this endpoint with the code.
    if (!code) {
      return NextResponse.json({ valid: false, requires2FA: true, methods });
    }

    const chosen = typeof method === "string" && methods.includes(method) ? method : methods[0];

    if (chosen === "totp") {
      if (!user.twoFactorTotpSecret) {
        return NextResponse.json({ valid: false, error: "TOTP not configured" }, { status: 400 });
      }
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(user.twoFactorTotpSecret),
        digits: 6,
        period: 30,
      });
      const delta = totp.validate({ token: String(code).replace(/\s/g, ""), window: 1 });
      if (delta === null) {
        return NextResponse.json({ valid: false, error: "Invalid authenticator code" }, { status: 401 });
      }
    } else {
      // email / sms — verify the one-time code sent via send-2fa-login.
      if (!user.pendingLoginToken || !user.pendingLoginExpiry) {
        return NextResponse.json({ valid: false, error: "No code found. Please request a new one." }, { status: 401 });
      }
      if (new Date() > user.pendingLoginExpiry) {
        return NextResponse.json({ valid: false, error: "Code expired. Please request a new one." }, { status: 401 });
      }
      const codeValid = await bcrypt.compare(String(code).trim(), user.pendingLoginToken);
      if (!codeValid) {
        const attempts = (user.pendingLoginAttempts ?? 0) + 1;
        if (attempts >= MAX_CODE_ATTEMPTS) {
          await prisma.user.update({
            where: { id: user.id },
            data: { pendingLoginToken: null, pendingLoginExpiry: null, pendingLoginAttempts: 0 },
          });
          return NextResponse.json(
            { valid: false, error: "Too many incorrect codes. Please request a new one." },
            { status: 429 }
          );
        }
        await prisma.user.update({ where: { id: user.id }, data: { pendingLoginAttempts: attempts } });
        return NextResponse.json({ valid: false, error: "Invalid code" }, { status: 401 });
      }
      // Correct — consume the code so it can't be replayed.
      await prisma.user.update({
        where: { id: user.id },
        data: { pendingLoginToken: null, pendingLoginExpiry: null, pendingLoginAttempts: 0 },
      });
    }
  }

  // Return user info — the backend uses this to look up or create the user.
  return NextResponse.json({
    valid: true,
    email: user.email,
    name: user.name,
  });
}
