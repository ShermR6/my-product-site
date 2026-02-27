import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory rate limiter: max 3 submissions per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

// Clean up old entries every 30 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 30 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 }
      );
    }

    const { name, email, message, website } = await req.json();

    // Honeypot: if the hidden "website" field is filled in, it's a bot
    if (website) {
      // Silently accept so bots think it worked
      return NextResponse.json({ success: true });
    }

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required." },
        { status: 400 }
      );
    }

    // Basic input length limits
    if (message.length > 5000 || email.length > 254 || (name && name.length > 100)) {
      return NextResponse.json(
        { error: "Input too long." },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "FinalPing Contact Form <support@finalpingapp.com>",
      to: "andrew.p.sherman21@gmail.com",
      replyTo: email,
      subject: `[FinalPing] New message from ${name || "Anonymous"}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <div style="font-size:18px;font-weight:700;margin-bottom:16px;color:#111;">New Contact Form Submission</div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:8px 12px;font-weight:600;color:#374151;width:80px;vertical-align:top;">Name</td>
              <td style="padding:8px 12px;color:#111;">${name || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:600;color:#374151;vertical-align:top;">Email</td>
              <td style="padding:8px 12px;color:#111;"><a href="mailto:${email}" style="color:#2563eb;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:600;color:#374151;vertical-align:top;">Message</td>
              <td style="padding:8px 12px;color:#111;white-space:pre-wrap;">${message}</td>
            </tr>
          </table>
          <div style="margin-top:20px;font-size:12px;color:#9ca3af;">Sent from the FinalPing contact form at finalpingapp.com</div>
        </div>
      `,
    });

    // Send confirmation to the customer
    await resend.emails.send({
      from: "FinalPing <support@finalpingapp.com>",
      to: email,
      subject: "We received your message — FinalPing",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
          <div style="font-size:20px;font-weight:700;margin-bottom:8px;">FinalPing</div>
          <div style="font-size:14px;color:#bdbdbd;margin-bottom:24px;">Real-time aircraft tracking</div>
          <p style="font-size:15px;margin-bottom:16px;">Hi${name ? ` ${name}` : ""},</p>
          <p style="font-size:15px;margin-bottom:16px;">Thanks for reaching out! We received your message and will get back to you within 1 business day.</p>
          <p style="font-size:13px;color:#bdbdbd;margin-bottom:16px;">Please check your spam or junk folder for our reply, and consider adding support@finalpingapp.com to your contacts.</p>
          <p style="font-size:13px;color:#999;margin-top:24px;">— The FinalPing Team</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
