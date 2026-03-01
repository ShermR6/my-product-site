import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ success: true });

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Store token in VerificationToken table (reusing NextAuth's table)
    await prisma.verificationToken.upsert({
      where: { identifier_token: { identifier: email, token } },
      update: { token, expires },
      create: { identifier: email, token, expires },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/login/reset?token=${token}&email=${encodeURIComponent(email)}`;

    await resend.emails.send({
      from: "FinalPing <noreply@finalpingapp.com>",
      to: email,
      subject: "Reset your FinalPing password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
          <div style="font-size:20px;font-weight:700;margin-bottom:8px;">FinalPing</div>
          <div style="font-size:14px;color:#bdbdbd;margin-bottom:24px;">Real-time aircraft tracking</div>
          <p style="font-size:15px;margin-bottom:8px;">You requested a password reset. Click the button below to set a new password.</p>
          <p style="font-size:13px;color:#9ca3af;margin-bottom:24px;">This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#fff;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px;">Reset Password</a>
          <p style="font-size:12px;color:#666;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
