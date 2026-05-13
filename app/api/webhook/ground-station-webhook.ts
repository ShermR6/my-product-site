// app/api/webhooks/route.ts
// Add this handler inside the existing POST function, after the existing
// "checkout.session.completed" block for license purchases.
//
// This handles ground station one-time purchases and enables access on the account.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-01-28.clover" });
const resend = new Resend(process.env.RESEND_API_KEY);

const BACKEND_URL = "https://aircraft-tracker-backend-production.up.railway.app";
const INTERNAL_SECRET = process.env.WEBHOOK_INTERNAL_SECRET ?? "";

// ── Existing webhook POST handler (add ground station block inside) ──────────

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

  // ── Ground Station purchase (one-time payment) ───────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const tier = session.metadata?.tier;
    const customerEmail = session.metadata?.email ?? session.customer_details?.email;

    if (tier === "ground-station" && customerEmail) {
      const email = customerEmail.toLowerCase();

      // 1. Mark ground station as enabled in Prisma (Vercel DB)
      await prisma.user.update({
        where: { email },
        data: { groundStationEnabled: true },
      });

      // 2. Enable on Railway backend
      try {
        await fetch(`${BACKEND_URL}/api/admin/grant-ground-station`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": INTERNAL_SECRET,
          },
          body: JSON.stringify({ email, enabled: true }),
        });
      } catch (err) {
        console.error("Failed to enable ground station on Railway:", err);
      }

      // 3. Send confirmation email with download link
      await resend.emails.send({
        from: "FinalPing <noreply@finalpingapp.com>",
        to: email,
        subject: "FinalPing Ground Station: Setup Instructions",
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
            <div style="font-size:22px;font-weight:700;margin-bottom:4px;">FinalPing</div>
            <div style="font-size:13px;color:#bdbdbd;margin-bottom:28px;">Ground Station</div>

            <p style="font-size:15px;margin-bottom:16px;">
              Thanks for purchasing <strong>FinalPing Ground Station</strong>! Your account is now enabled.
            </p>

            <p style="font-size:13px;color:#bdbdbd;margin-bottom:8px;">
              Download the ground station script and follow the setup guide below:
            </p>

            <a href="https://finalpingapp.com/ground/download" 
               style="display:inline-block;padding:12px 24px;background:#f5b400;color:#000;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px;margin-bottom:20px;">
              Download Ground Station
            </a>

            <p style="font-size:13px;color:#bdbdbd;margin-bottom:8px;">
              <strong>Quick start:</strong>
            </p>
            <ol style="font-size:13px;color:#bdbdbd;padding-left:20px;line-height:1.8;">
              <li>Download and unzip the ground station package</li>
              <li>Open <code style="background:#1a1a1a;padding:2px 6px;border-radius:4px;">finalping_ground.py</code> and fill in your email, password, coordinates, and aircraft</li>
              <li>Run: <code style="background:#1a1a1a;padding:2px 6px;border-radius:4px;">python3 finalping_ground.py</code></li>
              <li>Alerts will fire through your existing FinalPing notification channels</li>
            </ol>

            <p style="font-size:12px;color:#555;margin-top:28px;">
              Questions? Visit <a href="https://finalpingapp.com/dashboard" style="color:#f5b400;">your dashboard</a> or reply to this email.
            </p>
          </div>
        `,
      });

      console.log(`Ground station enabled for ${email}`);
      return NextResponse.json({ received: true });
    }

    // ── Existing license purchase handling continues below ───────────────
    // (keep your existing checkout.session.completed code here for non-ground-station purchases)
  }

  // ── Existing subscription renewal handling ───────────────────────────────
  // (keep your existing invoice.payment_succeeded code here)

  return NextResponse.json({ received: true });
}
