// app/api/auth/change-profile/route.ts
// Step 1 of profile edit: sends a 2FA verification code (or email fallback).
// No profile data is accepted yet — identity is verified before the form is shown.

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
  return require("crypto").randomInt(100000, 1000000).toString();
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { method } = await req.json().catch(() => ({}));

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

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

  const chosenMethod: "email" | "sms" | "totp" = method ?? (has2FA ? availableMethods[0].id : "email");
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  if (chosenMethod === "totp") {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        pendingProfileEmail: null,
        pendingProfileName: null,
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
      pendingProfileEmail: null,
      pendingProfileName: null,
      pendingProfileCode: hashedCode,
      pendingProfileExpiry: expiry,
      pendingProfileMethod: chosenMethod,
    },
  });

  if (chosenMethod === "email") {
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: session.user.email,
      subject: "FinalPing: Verify Profile Edit",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">Verify Profile Edit</h2>
          <p>You requested to edit your FinalPing account profile. Enter the code below to unlock the edit form.</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0ea5e9; padding: 16px 0;">${code}</div>
          <p style="color: #6b7280; font-size: 13px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } else if (chosenMethod === "sms") {
    await twilioClient.messages.create({
      body: `Your FinalPing profile edit code is: ${code}. Expires in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: user.twoFactorPhone!,
    });
  }

  return NextResponse.json({ step: "enter-code", method: chosenMethod });
}
