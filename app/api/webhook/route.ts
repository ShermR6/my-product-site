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

async function createLicenseInBackend(licenseKey: string, tier: string, email: string, stripeSubscriptionId?: string) {
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
        stripe_subscription_id: stripeSubscriptionId || null,
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

    // ── Plan upgrade payment ──────────────────────────────────────────────
    if (session.metadata?.type === "upgrade") {
      const { licenseKey, newTier, subscriptionId, newPriceId } = session.metadata;
      const upgradeEmail = session.customer_details?.email ?? "";

      try {
        // Update the Stripe subscription price for next renewal (no proration)
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await stripe.subscriptions.update(subscriptionId, {
          items: [{ id: sub.items.data[0].id, price: newPriceId }],
          proration_behavior: "none",
        });

        // Update tier in web dashboard DB
        await prisma.license.update({
          where: { licenseKey },
          data: { tier: newTier },
        });

        // Update tier in backend DB
        await fetch(`${BACKEND_URL}/api/licenses/${licenseKey}/tier`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.WEBHOOK_INTERNAL_SECRET || "",
          },
          body: JSON.stringify({ tier: newTier }),
        });

        const tierLabel = newTier === "pro" ? "Pro" : newTier === "premium" ? "Premium" : "Starter";
        if (upgradeEmail) {
          await resend.emails.send({
            from: "FinalPing <noreply@finalpingapp.com>",
            to: upgradeEmail,
            subject: `You've upgraded to FinalPing ${tierLabel}`,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
                <div style="font-size:22px;font-weight:700;margin-bottom:4px;">FinalPing</div>
                <div style="font-size:13px;color:#bdbdbd;margin-bottom:28px;">Real-time aircraft tracking</div>
                <p style="font-size:15px;margin-bottom:8px;">Your plan has been upgraded to <strong>${tierLabel}</strong>.</p>
                <p style="font-size:13px;color:#bdbdbd;margin-bottom:20px;">Your new limits are active immediately in the desktop app. Your subscription will renew at the ${tierLabel} plan price on your next billing date.</p>
                <a href="https://finalpingapp.com/dashboard?tab=billing" style="display:inline-block;padding:12px 24px;background:#f5b400;color:#000;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px;">View Dashboard</a>
              </div>
            `,
          });
        }

        console.log(`Plan upgraded for ${upgradeEmail}: ${licenseKey} → ${newTier}`);
      } catch (err) {
        console.error("Upgrade webhook error:", err);
      }

      return NextResponse.json({ received: true });
    }

    const tier = session.metadata?.tier ?? "starter";
    const customerEmail = session.customer_details?.email ?? session.metadata?.email;

    if (!customerEmail) {
      console.error("No customer email in session");
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    const email = customerEmail.toLowerCase().trim();

    // ── Ground Station one-time purchase ──────────────────────────────────
    if (tier === "ground-station") {
      await prisma.user.updateMany({
        where: { email },
        data: { groundStationEnabled: true },
      });

      try {
        await fetch(`${BACKEND_URL}/api/admin/grant-ground-station`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.WEBHOOK_INTERNAL_SECRET || "",
          },
          body: JSON.stringify({ email, enabled: true }),
        });
      } catch (err) {
        console.error("Failed to enable ground station on Railway:", err);
      }

      await resend.emails.send({
        from: "FinalPing <noreply@finalpingapp.com>",
        to: email,
        subject: "FinalPing Ground Station — You're all set!",
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
            <div style="font-size:22px;font-weight:700;margin-bottom:4px;">FinalPing</div>
            <div style="font-size:13px;color:#bdbdbd;margin-bottom:28px;">Ground Station</div>
            <p style="font-size:15px;margin-bottom:16px;">Thanks for purchasing <strong>FinalPing Ground Station</strong>! Your account is now enabled.</p>
            <p style="font-size:13px;color:#bdbdbd;margin-bottom:20px;">Follow the setup guide to get your receiver connected and running in minutes.</p>
            <a href="https://finalpingapp.com/groundstationsetup" style="display:inline-block;padding:12px 24px;background:#f5b400;color:#000;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px;margin-bottom:12px;">View Setup Guide</a>
            <br />
            <a href="https://finalpingapp.com/groundstationdevices" style="display:inline-block;padding:12px 24px;background:transparent;color:#f5b400;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px;border:1px solid #f5b400;">Buy a Receiver</a>
            <p style="font-size:12px;color:#555;margin-top:28px;">
              Questions? Reply to this email or visit <a href="https://finalpingapp.com/dashboard" style="color:#f5b400;">your dashboard</a>.
            </p>
          </div>
        `,
      });

      console.log(`Ground station enabled for ${email}`);
      return NextResponse.json({ received: true });
    }

    // ── Regular license purchase ──────────────────────────────────────────
    const licenseKey = generateLicenseKey();

    // Get the Stripe subscription ID so we can resume billing on activation
    const stripeSubscriptionId = session.subscription as string | null;

    // Pause the subscription until the user activates their license key
    // Skip pause for trial subscriptions — they're already not charging
    if (stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        if (sub.status !== "trialing") {
          await stripe.subscriptions.update(stripeSubscriptionId, {
            pause_collection: { behavior: "void" },
          });
          console.log(`Paused subscription ${stripeSubscriptionId} until activation`);
        } else {
          console.log(`Skipped pause for trial subscription ${stripeSubscriptionId}`);
        }
      } catch (err) {
        console.error("Failed to pause subscription:", err);
      }
    }

    const user = await prisma.user.findUnique({ where: { email } });

    await prisma.license.create({
      data: {
        purchaseEmail: email,
        userId: user?.id ?? undefined,
        licenseKey,
        tier,
        status: "inactive",
        stripeSessionId: session.id,
        stripeSubscriptionId: stripeSubscriptionId ?? undefined,
      },
    });

    await createLicenseInBackend(licenseKey, tier, email, stripeSubscriptionId ?? undefined);

    const tierLabel = tier === "pro" ? "Pro" : tier === "premium" ? "Premium" : "Starter";

    await resend.emails.send({
      from: "FinalPing <noreply@finalpingapp.com>",
      to: email,
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
            To activate, open the FinalPing desktop app, enter this key and your email address (<strong>${email}</strong>).
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

    console.log(`License created for ${email}: ${licenseKey} (sub: ${stripeSubscriptionId || 'none'})`);
  }

  // ── Subscription renewal — extend existing license by 30 days ──────────────
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;

    if (invoice.billing_reason === "subscription_cycle") {
      const customerEmail =
        typeof invoice.customer_email === "string"
          ? invoice.customer_email
          : null;

      if (!customerEmail) {
        console.error("No customer email in renewal invoice");
        return NextResponse.json({ received: true });
      }

      const email = customerEmail.toLowerCase().trim();

      const license = await prisma.license.findFirst({
        where: { purchaseEmail: email, status: "active" },
        orderBy: { activatedAt: "desc" },
      });

      if (!license) {
        console.error(`No active license found for renewal: ${email}`);
        return NextResponse.json({ received: true });
      }

      // Use Stripe's authoritative period end so license expiry always matches
      // the next billing date. Fall back to +30 days if the field is missing.
      const periodEnd = invoice.lines.data[0]?.period?.end;
      const newExpiry = periodEnd
        ? new Date(periodEnd * 1000)
        : new Date((license.expiresAt ?? new Date()).getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.license.update({
        where: { id: license.id },
        data: { expiresAt: newExpiry },
      });

      try {
        await fetch(`${BACKEND_URL}/api/licenses/renew`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Secret": process.env.WEBHOOK_INTERNAL_SECRET || "",
          },
          body: JSON.stringify({
            license_key: license.licenseKey,
            expires_at: newExpiry.toISOString(),
          }),
        });
      } catch (err) {
        console.error("Failed to update Railway on renewal:", err);
      }

      const tierLabel =
        license.tier === "pro" ? "Pro" :
        license.tier === "premium" ? "Premium" : "Starter";

      await resend.emails.send({
        from: "FinalPing <noreply@finalpingapp.com>",
        to: email,
        subject: `FinalPing ${tierLabel} — Subscription Renewed`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
            <div style="font-size:22px;font-weight:700;margin-bottom:4px;">FinalPing</div>
            <div style="font-size:13px;color:#bdbdbd;margin-bottom:28px;">Real-time aircraft tracking</div>
            <p style="font-size:15px;margin-bottom:8px;">Your <strong>${tierLabel}</strong> subscription has been renewed successfully.</p>
            <p style="font-size:13px;color:#bdbdbd;margin-bottom:8px;">Your access has been extended through <strong>${newExpiry.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.</p>
            <p style="font-size:13px;color:#bdbdbd;margin-bottom:20px;">No action needed — FinalPing will continue tracking your aircraft automatically.</p>
            <a href="https://finalpingapp.com/dashboard" style="display:inline-block;padding:12px 24px;background:#f5b400;color:#000;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px;">View Dashboard</a>
            <p style="font-size:12px;color:#555;margin-top:28px;">
              To cancel your subscription, visit your <a href="https://finalpingapp.com/dashboard?tab=billing" style="color:#f5b400;">billing settings</a>.
            </p>
          </div>
        `,
      });

      console.log(`License renewed for ${email} until ${newExpiry.toISOString()}`);
    }
  }

  return NextResponse.json({ received: true });
}
