import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    // Throttle by IP — this is unauthenticated and sends email.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`waitlist:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
    }

    const { email, source } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Detect genuine first signup — upsert always "succeeds", so it can't tell
    // a new entry from a repeat, which previously re-sent the email every time.
    let created = false;
    const existing = await prisma.waitlistEntry.findUnique({ where: { email: normalized } });
    if (!existing) {
      try {
        await prisma.waitlistEntry.create({ data: { email: normalized, source: source ?? "teams-waitlist" } });
        created = true;
      } catch {
        created = false; // unique-constraint race — treat as already-signed-up
      }
    }

    // Only send emails on first signup, not duplicate submissions
    if (created) {
      await Promise.allSettled([
        // Confirmation to the user
        resend.emails.send({
          from: "FinalPing <support@finalpingapp.com>",
          to: normalized,
          subject: "You're on the FinalPing for Teams waitlist",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#f9fafb;border-radius:12px;">
              <div style="font-size:20px;font-weight:800;margin-bottom:4px;">FinalPing</div>
              <div style="font-size:12px;color:#6b7280;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:28px;">Aircraft Alerts</div>
              <p style="font-size:16px;font-weight:700;margin:0 0 12px;">You're on the list ✓</p>
              <p style="font-size:14px;color:#d1d5db;line-height:1.7;margin:0 0 16px;">
                Thanks for signing up for the <strong style="color:#fff;">FinalPing for Teams</strong> waitlist.
                We'll send you one email the moment it's ready to launch — no spam, nothing else.
              </p>
              <p style="font-size:14px;color:#d1d5db;line-height:1.7;margin:0 0 28px;">
                In the meantime, the personal edition is fully available if you'd like to start tracking aircraft today.
              </p>
              <a href="https://finalpingapp.com/pricing" style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#fff;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;">
                View personal plans →
              </a>
              <p style="font-size:12px;color:#4b5563;margin-top:32px;">
                The FinalPing Team · <a href="https://finalpingapp.com" style="color:#4b5563;">finalpingapp.com</a>
              </p>
            </div>
          `,
        }),
        // Internal notification to you
        resend.emails.send({
          from: "FinalPing <support@finalpingapp.com>",
          to: "aircraftalerts@finalpingapp.com",
          subject: `New Teams waitlist signup: ${normalized}`,
          text: `${normalized} just joined the FinalPing for Teams waitlist.\n\nView all signups: https://finalpingapp.com/admin`,
        }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
