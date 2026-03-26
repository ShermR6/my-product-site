// app/api/auth/change-password/route.ts
// Initiates a password change — hashes new password, sends 2FA code via chosen method.
// The password is NOT applied until confirm-password-change verifies the code.

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

  const { newPassword, confirmPassword, method } = await req.json();

  if (!newPassword || !confirmPassword) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check they have at least one 2FA method enabled
  const has2FA = user.twoFactorEmailEnabled || user.twoFactorSmsEnabled || user.twoFactorTotpEnabled;
  if (!has2FA) {
    return NextResponse.json({ error: "NO_2FA" }, { status: 403 });
  }

  // Validate the chosen method is actually enabled for this user
  if (method === "email" && !user.twoFactorEmailEnabled) {
    return NextResponse.json({ error: "Email 2FA not enabled" }, { status: 400 });
  }
  if (method === "sms" && !user.twoFactorSmsEnabled) {
    return NextResponse.json({ error: "SMS 2FA not enabled" }, { status: 400 });
  }
  if (method === "totp" && !user.twoFactorTotpEnabled) {
    return NextResponse.json({ error: "Authenticator 2FA not enabled" }, { status: 400 });
  }

  // Hash the new password and store it pending confirmation
  const pendingPasswordHash = await bcrypt.hash(newPassword, 12);
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  if (method === "totp") {
    // TOTP: no code to send, user reads it from their authenticator app
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        pendingPasswordHash,
        pendingPasswordCode: null,
        pendingPasswordExpiry: expiry,
        pendingPasswordMethod: "totp",
      },
    });
    return NextResponse.json({ success: true, method: "totp" });
  }

  // Generate and hash a 6-digit code
  const code = generateCode();
  const hashedCode = await bcrypt.hash(code, 10);

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      pendingPasswordHash,
      pendingPasswordCode: hashedCode,
      pendingPasswordExpiry: expiry,
      pendingPasswordMethod: method,
    },
  });

  // Send the code via the chosen method
  if (method === "email") {
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: session.user.email,
      subject: "FinalPing — Confirm Password Change",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">Confirm Password Change</h2>
          <p>You requested a password change for your FinalPing account.</p>
          <p>Your confirmation code is:</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0ea5e9; padding: 16px 0;">
            ${code}
          </div>
          <p style="color: #6b7280; font-size: 13px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } else if (method === "sms") {
    await twilioClient.messages.create({
      body: `Your FinalPing password change code is: ${code}. Expires in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: user.twoFactorPhone!,
    });
  }

  return NextResponse.json({ success: true, method });
}
