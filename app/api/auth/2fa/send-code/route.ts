// app/api/auth/2fa/send-code/route.ts
// Resends a fresh 2FA code via the specified method.
// Used for both setup verification and password change confirmation.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import twilio from "twilio";
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

  const { method, context } = await req.json();
  // context: "setup" | "password-change"

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const code = generateCode();
  const hashedCode = await bcrypt.hash(code, 10);
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  // Determine where to send and what to update
  let toPhone: string | null = null;

  if (method === "sms") {
    toPhone = context === "setup" ? user.pendingTwoFactorPhone : user.twoFactorPhone;
    if (!toPhone) {
      return NextResponse.json({ error: "No phone number found" }, { status: 400 });
    }
  }

  // Update the appropriate pending code field
  if (context === "setup") {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        pendingTwoFactorCode: hashedCode,
        pendingTwoFactorExpiry: expiry,
      },
    });
  } else {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        pendingPasswordCode: hashedCode,
        pendingPasswordExpiry: expiry,
      },
    });
  }

  const subject = context === "setup"
    ? "FinalPing — Verify 2FA Setup"
    : "FinalPing — Confirm Password Change";

  const bodyText = context === "setup"
    ? `Your FinalPing 2FA setup code is: ${code}. Expires in 10 minutes.`
    : `Your FinalPing password change code is: ${code}. Expires in 10 minutes.`;

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">${context === "setup" ? "Verify 2FA Setup" : "Confirm Password Change"}</h2>
      <p>Your verification code is:</p>
      <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0ea5e9; padding: 16px 0;">
        ${code}
      </div>
      <p style="color: #6b7280; font-size: 13px;">This code expires in 10 minutes.</p>
    </div>
  `;

  if (method === "email") {
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: session.user.email,
      subject,
      html: htmlBody,
    });
  } else if (method === "sms" && toPhone) {
    await twilioClient.messages.create({
      body: bodyText,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: toPhone,
    });
  }

  return NextResponse.json({ success: true });
}
