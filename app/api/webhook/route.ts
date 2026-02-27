import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-01-28.clover" });
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const BACKEND_URL = "https://aircraft-tracker-backend-production.up.railway.app";

function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => chars[crypto.randomInt(chars.length)]).join("")
  );
  return segments.join("-");
}

async function createLicenseInBackend(licenseKey: string, tier: string, email: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/licenses/provision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.WEBHOOK_INTERNAL_SECRET || "finalping-internal-secret",
      },
      body: JSON.stringify({
        license_key: licenseKey,
        tier,
        email,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Backend license creation failed:", errorText);
    } else {
      console.log(`Backend license created for ${email}`);
    }
  } catch (err) {
    console.error("Failed to reach backend for license creation:", err);
  }
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

    // Always generate a new unique license key for every purchase
    const licenseKey = generateLicenseKey();

    // Optionally link to existing user if they have an account
    const user = await prisma.user.findUnique({ where: { email: customerEmail } });

    await prisma.license.create({
      data: {
        purchaseEmail: customerEmail,
        userId: user?.id ?? undefined,
        licenseKey,
        tier,
        status: "inactive", // becomes "active" when activated in desktop app
        stripeSessionId: session.id,
      },
    });

    // Also create the license in the FastAPI backend database
    await createLicenseInBackend(licenseKey, tier, customerEmail);

    const tierLabel = tier === "pro" ? "Pro" : tier === "premium" ? "Premium" : "Starter";

    // Send license key email
    await resend.emails.send({
      from: "FinalPing <noreply@finalpingapp.com>",
      to: customerEmail,
      subject: `Your FinalPing ${tierLabel} License Key`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
          <div style="font-size:22px;font-weight:700;margin-bottom:4px;">FinalPing</div>
          <div style="font-size:13px;color:#bdbdbd;margin-bottom:28px;">Real-time aircraft tracking</div>

          <p style="font-size:15px;margin-bottom:8px;">Thanks for your purchase! Here is your <strong>${tierLabel}</strong> license key:</p>

          <div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:18px;text-align:center;margin:20px 0;">
            <div style="font-size:22px;font-weight:900;letter-spacing:0.08em;color:#f5b400;">${licenseKey}</div>
          </div>

          <p style="font-size:13px;color:#bdbdbd;margin-bottom:6px;">
            To activate, open the FinalPing desktop app, enter this key and your email address (<strong>${customerEmail}</strong>).
          </p>
          <p style="font-size:13px;color:#bdbdbd;margin-bottom:20px;">
            Your 30-day access period begins when you activate — not when you purchase.
          </p>

          <a href="https://finalpingapp.com/download" style="display:inline-block;padding:12px 24px;background:#f5b400;color:#000;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px;">Download the app</a>

          <p style="font-size:12px;color:#555;margin-top:28px;">
            You can also view your licenses by logging into <a href="https://finalpingapp.com/dashboard" style="color:#f5b400;">finalpingapp.com/dashboard</a>.
            <br />Please check your spam or junk folder for future emails, and consider adding noreply@finalpingapp.com to your contacts.
          </p>
        </div>
      `,
    });

    console.log(`License created for ${customerEmail}: ${licenseKey}`);
  }

  return NextResponse.json({ received: true });
}
