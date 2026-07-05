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
  return require("crypto").randomInt(100000, 1000000).toString();
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
  } else if (context === "profile-change") {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        pendingProfileCode: hashedCode,
        pendingProfileExpiry: expiry,
        pendingProfileMethod: method,
      },
    });
  } else {
    // covers "password-change" and "account-deletion"
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        pendingPasswordCode: hashedCode,
        pendingPasswordExpiry: expiry,
        pendingPasswordMethod: method,
      },
    });
  }

  const subject = context === "setup"
    ? "FinalPing: Verify 2FA Setup"
    : context === "account-deletion"
      ? "FinalPing: Confirm Account Deletion"
      : context === "profile-change"
        ? "FinalPing: Confirm Profile Change"
        : "FinalPing: Confirm Password Change";

  const bodyText = context === "setup"
    ? `Your FinalPing 2FA setup code is: ${code}. Expires in 10 minutes.`
    : context === "account-deletion"
      ? `Your FinalPing account deletion code is: ${code}. Expires in 10 minutes.`
      : context === "profile-change"
        ? `Your FinalPing profile change code is: ${code}. Expires in 10 minutes.`
        : `Your FinalPing password change code is: ${code}. Expires in 10 minutes.`;

  const headingText = context === "account-deletion" ? "Confirm Account Deletion"
    : context === "setup" ? "Verify 2FA Setup"
    : context === "profile-change" ? "Confirm Profile Change"
    : "Confirm Password Change";

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">${headingText}</h2>
      <p>${context === "account-deletion" ? "Someone requested to permanently delete your FinalPing account. Enter this code to confirm:" : "Your verification code is:"}</p>
      <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0ea5e9; padding: 16px 0;">
        ${code}
      </div>
      <p style="color: #6b7280; font-size: 13px;">This code expires in 10 minutes.</p>
      ${context === "account-deletion" ? '<p style="color: #ef4444; font-size: 13px;">If you did not request this, ignore this email and your account will not be deleted.</p>' : ""}
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
