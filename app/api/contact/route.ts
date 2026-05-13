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
      from: "FinalPing Support <support@finalpingapp.com>",
      to: "aircraftalerts@finalpingapp.com",
      replyTo: email,
      subject: `New message from ${name || "a customer"} — FinalPing`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="background:#0f172a;border-radius:12px 12px 0 0;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">FinalPing</div>
                <div style="font-size:12px;color:#64748b;margin-top:2px;letter-spacing:0.05em;text-transform:uppercase;">Support Request</div>
              </td>
              <td align="right">
                <div style="background:#1e293b;border-radius:6px;padding:6px 12px;display:inline-block;font-size:11px;color:#94a3b8;white-space:nowrap;">${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;">

          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.5;">
            You have a new message from the FinalPing contact form. Reply directly to this email to respond to the customer.
          </p>

          <!-- Sender card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                <div style="font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">From</div>
                <div style="font-size:15px;font-weight:600;color:#111827;">${name || "Anonymous"}</div>
                <div style="font-size:13px;color:#6b7280;margin-top:2px;"><a href="mailto:${email}" style="color:#2563eb;text-decoration:none;">${email}</a></div>
              </td>
            </tr>
          </table>

          <!-- Message -->
          <div style="font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">Message</div>
          <div style="background:#f8fafc;border-left:3px solid #0ea5e9;border-radius:0 6px 6px 0;padding:16px 20px;font-size:14px;color:#1e293b;line-height:1.7;white-space:pre-wrap;">${message}</div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:16px 32px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
            Submitted via <a href="https://finalpingapp.com/contact" style="color:#0ea5e9;text-decoration:none;">finalpingapp.com/contact</a>
            &nbsp;·&nbsp; Reply to this email to respond directly to the customer
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
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
