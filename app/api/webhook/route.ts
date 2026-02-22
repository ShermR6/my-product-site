import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-01-28.clover" });
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

function generateLicenseKey(tier: string): string {
  const prefix = tier === "pro" ? "PRO" : tier === "premium" ? "PRM" : "STR";
  const segments = Array.from({ length: 4 }, () =>
    crypto.randomBytes(2).toString("hex").toUpperCase()
  );
  return `${prefix}-${segments.join("-")}`;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const tier = session.metadata?.tier ?? "starter";
    const customerEmail = session.customer_details?.email;

    if (!customerEmail) {
      console.error("No customer email in session");
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!user) {
      user = await prisma.user.create({ data: { email: customerEmail } });
    }

    // Check if already has license — if so, just resend
    let license = await prisma.license.findUnique({ where: { userId: user.id } });
    if (!license) {
      const licenseKey = generateLicenseKey(tier);
      license = await prisma.license.create({
        data: {
          userId: user.id,
          licenseKey,
          tier,
          stripeSessionId: session.id,
        },
      });
    }

    const tierLabel = tier === "pro" ? "Pro" : tier === "premium" ? "Premium" : "Starter";

    // Send license key email
    await resend.emails.send({
      from: "SkyPing <noreply@skyping.xyz>",
      to: customerEmail,
      subject: `Your SkyPing ${tierLabel} License Key`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
          <div style="font-size:22px;font-weight:700;margin-bottom:4px;">SkyPing</div>
          <div style="font-size:13px;color:#bdbdbd;margin-bottom:28px;">Real-time aircraft tracking</div>

          <p style="font-size:15px;margin-bottom:8px;">Thanks for your purchase! Here is your <strong>${tierLabel}</strong> license key:</p>

          <div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:18px;text-align:center;margin:20px 0;">
            <div style="font-size:22px;font-weight:900;letter-spacing:0.08em;color:#f5b400;">${license.licenseKey}</div>
          </div>

          <p style="font-size:13px;color:#bdbdbd;margin-bottom:20px;">
            To activate, open the SkyPing desktop app, enter this key and your email address (<strong>${customerEmail}</strong>).
          </p>

          <a href="https://skyping.xyz/download" style="display:inline-block;padding:12px 24px;background:#f5b400;color:#000;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px;">Download the app</a>

          <p style="font-size:12px;color:#555;margin-top:28px;">
            You can also view your license at any time by logging into <a href="https://skyping.xyz/dashboard" style="color:#f5b400;">skyping.xyz/dashboard</a>
          </p>
        </div>
      `,
    });

    console.log(`License created for ${customerEmail}: ${license.licenseKey}`);
  }

  return NextResponse.json({ received: true });
}
