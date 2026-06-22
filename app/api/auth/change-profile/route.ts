// app/api/auth/change-profile/route.ts
// Initiates a profile change (name and/or email).
// Sends a 2FA verification code; falls back to account email if no 2FA is configured.
// Changes are NOT applied until confirm-profile-change verifies the code.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import twilio from "twilio";
const bcrypt = require("bcryptjs");

const resend = new Resend(process.env.RESEND_API_KEY!);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name, email, method } = await req.json();

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

  // If email is changing, make sure it's not already taken
  if (trimmedEmail !== session.user.email) {
    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return NextResponse.json({ error: "That email is already in use by another account" }, { status: 409 });
    }
  }

  const availableMethods = [
    ...(user.twoFactorEmailEnabled ? [{ id: "email" as const, label: "Email" }] : []),
    ...(user.twoFactorSmsEnabled ? [{ id: "sms" as const, label: `SMS (${user.twoFactorPhone ?? ""})` }] : []),
    ...(user.twoFactorTotpEnabled ? [{ id: "totp" as const, label: "Authenticator App" }] : []),
  ];
  const has2FA = availableMethods.length > 0;

  // If multiple methods and none chosen yet, ask the client to pick
  if (has2FA && availableMethods.length > 1 && !method) {
    return NextResponse.json({ step: "choose-method", methods: availableMethods });
  }

  // Determine which method to use
  let chosenMethod: "email" | "sms" | "totp" = method ?? (has2FA ? availableMethods[0].id : "email");

  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  if (chosenMethod === "totp") {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        pendingProfileName: trimmedName,
        pendingProfileEmail: trimmedEmail,
        pendingProfileCode: null,
        pendingProfileExpiry: expiry,
        pendingProfileMethod: "totp",
      },
    });
    return NextResponse.json({ step: "totp-code", method: "totp" });
  }

  const code = generateCode();
  const hashedCode = await bcrypt.hash(code, 10);

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      pendingProfileName: trimmedName,
      pendingProfileEmail: trimmedEmail,
      pendingProfileCode: hashedCode,
      pendingProfileExpiry: expiry,
      pendingProfileMethod: chosenMethod,
    },
  });

  if (chosenMethod === "email") {
    // Always send to the CURRENT email, even if it's changing
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: session.user.email,
      subject: "FinalPing: Confirm Profile Change",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">Confirm Profile Change</h2>
          <p>You requested a change to your FinalPing account profile.</p>
          <p>Your confirmation code is:</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0ea5e9; padding: 16px 0;">${code}</div>
          <p style="color: #6b7280; font-size: 13px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } else if (chosenMethod === "sms") {
    await twilioClient.messages.create({
      body: `Your FinalPing profile change code is: ${code}. Expires in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: user.twoFactorPhone!,
    });
  }

  return NextResponse.json({ step: "enter-code", method: chosenMethod });
}
