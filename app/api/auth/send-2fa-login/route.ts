import { NextRequest, NextResponse } from "next/server";
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
  try {
    const { email, password, method } = await req.json();
    if (!email || !password || !method) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid request." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid request." }, { status: 401 });
    }

    const code = generateCode();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email: user.email! },
      data: { pendingLoginToken: hashedCode, pendingLoginExpiry: expiry },
    });

    if (method === "email") {
      await resend.emails.send({
        from: "FinalPing <noreply@finalpingapp.com>",
        to: user.email!,
        subject: "FinalPing — Login Verification Code",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
            <div style="font-size:20px;font-weight:700;margin-bottom:4px;">FinalPing</div>
            <div style="font-size:13px;color:#bdbdbd;margin-bottom:24px;">Real-time aircraft tracking</div>
            <p style="font-size:15px;margin-bottom:8px;">Your login verification code is:</p>
            <div style="font-size:36px;font-weight:900;letter-spacing:0.15em;color:#0ea5e9;padding:16px 0;">${code}</div>
            <p style="font-size:13px;color:#9ca3af;">This code expires in 10 minutes. If you didn't try to log in, ignore this email.</p>
          </div>
        `,
      });
    } else if (method === "sms" && user.twoFactorPhone) {
      await twilioClient.messages.create({
        body: `Your FinalPing login code is: ${code}. Expires in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: user.twoFactorPhone,
      });
    }

    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
