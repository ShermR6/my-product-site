// app/api/auth/2fa/setup/route.ts
// Initiates 2FA setup for a given method.
// - email: sends a 6-digit code to their email
// - sms: sends a 6-digit code to the provided phone number
// - totp: generates a TOTP secret and returns a QR code URI

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import twilio from "twilio";
import * as OTPAuth from "otpauth";
const bcrypt = require("bcryptjs");

const resend = new Resend(process.env.RESEND_API_KEY!);
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { method, phone } = await req.json();

  if (!["email", "sms", "totp"].includes(method)) {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }
  if (method === "sms" && !phone) {
    return NextResponse.json({ error: "Phone number required for SMS 2FA" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  if (method === "totp") {
    // Generate a new TOTP secret
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: "FinalPing",
      label: session.user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });

    const otpauthUrl = totp.toString();
    const secretBase32 = secret.base32;

    // Store secret temporarily until verified
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        twoFactorTotpSecret: secretBase32,
        pendingTwoFactorMethod: "totp",
        pendingTwoFactorExpiry: expiry,
      },
    });

    return NextResponse.json({
      success: true,
      method: "totp",
      otpauthUrl,
      secret: secretBase32,
    });
  }

  // email or sms — generate and send a 6-digit code
  const code = generateCode();
  const hashedCode = await bcrypt.hash(code, 10);

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      pendingTwoFactorCode: hashedCode,
      pendingTwoFactorExpiry: expiry,
      pendingTwoFactorMethod: method,
      ...(method === "sms" ? { pendingTwoFactorPhone: phone } : {}),
    },
  });

  if (method === "email") {
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: session.user.email,
      subject: "FinalPing — Verify Email 2FA Setup",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">Verify Email Two-Factor Authentication</h2>
          <p>Enter this code to enable email 2FA on your FinalPing account:</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0ea5e9; padding: 16px 0;">
            ${code}
          </div>
          <p style="color: #6b7280; font-size: 13px;">This code expires in 10 minutes.</p>
        </div>
      `,
    });
  } else if (method === "sms") {
    await twilioClient.messages.create({
      body: `Your FinalPing 2FA setup code is: ${code}. Expires in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: phone,
    });
  }

  return NextResponse.json({ success: true, method });
}
