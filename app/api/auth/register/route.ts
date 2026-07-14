import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { rateLimit } from "@/lib/rateLimit";
const bcrypt = require("bcryptjs");

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed, retryAfter } = rateLimit(`register:${ip}`, 5, 15 * 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, {
      status: 429, headers: { "Retry-After": String(retryAfter) }
    });
  }

  try {
    const { email: rawEmail, password, name } = await req.json();

    if (!rawEmail || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // Normalise so the account can be found at login (which lowercases) and to
    // avoid case-variant duplicate accounts.
    const email = String(rawEmail).trim().toLowerCase();

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one uppercase letter." }, { status: 400 });
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one number." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name?.trim() || null,
      },
    });

    // Send welcome email — non-blocking
    try {
      await resend.emails.send({
        from: "FinalPing <noreply@finalpingapp.com>",
        to: email,
        subject: "Welcome to FinalPing",
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
            <div style="font-size:22px;font-weight:700;margin-bottom:4px;">FinalPing</div>
            <div style="font-size:13px;color:#bdbdbd;margin-bottom:28px;">Real-time aircraft tracking</div>
            <p style="font-size:15px;margin-bottom:16px;">Welcome! Your account is ready.</p>
            <p style="font-size:13px;color:#bdbdbd;margin-bottom:24px;">Browse plans to get started tracking aircraft and receive real-time proximity alerts.</p>
            <a href="https://finalpingapp.com/pricing" style="display:inline-block;padding:12px 24px;background:#f5b400;color:#000;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px;margin-right:12px;margin-bottom:12px;">Browse Plans</a>
            <a href="https://finalpingapp.com/download" style="display:inline-block;padding:12px 24px;background:transparent;color:#f5b400;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px;border:1px solid #f5b400;">Download the App</a>
            <p style="font-size:12px;color:#555;margin-top:28px;">
              Questions? Visit <a href="https://finalpingapp.com/dashboard" style="color:#f5b400;">your dashboard</a> anytime.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Welcome email failed:", emailErr);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
