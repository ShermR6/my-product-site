import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { INTERNAL_SECRET } from "@/lib/internalSecret";
import { Resend } from "resend";
import crypto from "crypto";
import * as React from "react";

import { OrderConfirmation } from "@/emails/OrderConfirmation";
import { AdminOrderAlert } from "@/emails/AdminOrderAlert";
import { ShippingNotification } from "@/emails/ShippingNotification";
import { LicenseKey } from "@/emails/LicenseKey";
import { GroundStationEnabled } from "@/emails/GroundStationEnabled";
import { SubscriptionRenewed } from "@/emails/SubscriptionRenewed";
import { SubscriptionCancelled } from "@/emails/SubscriptionCancelled";
import { TrialEndingSoon } from "@/emails/TrialEndingSoon";
import { PaymentFailed } from "@/emails/PaymentFailed";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-01-28.clover" });
const resend = new Resend(process.env.RESEND_API_KEY);

const BACKEND_URL = "https://aircraft-tracker-backend-production.up.railway.app";

const HARDWARE_TIERS = new Set([
  "ground-station-kit", "ground-station-kit-built",
  "ground-station-kit-stubby", "ground-station-kit-stubby-built",
  "pro-stick-plus", "stand-antenna", "stubby-antenna-solo",
]);

function generateLicenseKey(tier: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => chars[crypto.randomInt(chars.length)]).join("")
  );
  const prefix = tier.startsWith("team-") ? "FPT" : "FP";
  return `${prefix}-${segments.join("-")}`;
}

async function createLicenseInBackend(licenseKey: string, tier: string, email: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/licenses/provision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({ license_key: licenseKey, tier, email }),
    });
    if (!res.ok) console.error("Backend license creation failed:", await res.text());
    else console.log(`Backend license created for ${email}`);
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

  // ── checkout.session.completed ─────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // ── Plan upgrade (one-time difference charge) ───────────────────────────
    // Must run before the license branch below, otherwise the paid upgrade
    // falls through and mints a bogus empty-tier "Starter" license.
    if (session.metadata?.type === "upgrade") {
      const { licenseKey, newTier, subscriptionId, newPriceId } =
        (session.metadata ?? {}) as Record<string, string>;
      try {
        if (subscriptionId && newPriceId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await stripe.subscriptions.update(subscriptionId, {
            items: [{ id: sub.items.data[0].id, price: newPriceId }],
            proration_behavior: "none",
          });
        }
        if (licenseKey && newTier) {
          await prisma.license.updateMany({ where: { licenseKey }, data: { tier: newTier } });
          await fetch(`${BACKEND_URL}/api/licenses/${licenseKey}/tier`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
            body: JSON.stringify({ tier: newTier }),
          });
        }
        console.log(`Plan upgraded to ${newTier} for license ${licenseKey}`);
      } catch (err) {
        console.error("Upgrade fulfillment failed:", err);
      }
      return NextResponse.json({ received: true });
    }

    const tier = session.metadata?.tier ?? "";
    const customerEmail = session.customer_details?.email ?? session.metadata?.email;

    if (!customerEmail) {
      console.error("No customer email in session");
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    const email = customerEmail.toLowerCase().trim();

    // ── Ground Station software purchase ────────────────────────────────────
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
            "x-internal-secret": INTERNAL_SECRET,
          },
          body: JSON.stringify({ email, enabled: true }),
        });
      } catch (err) {
        console.error("Failed to enable ground station on Railway:", err);
      }

      await resend.emails.send({
        from: "FinalPing <noreply@finalpingapp.com>",
        to: email,
        subject: "FinalPing Ground Station: You're all set!",
        react: React.createElement(GroundStationEnabled),
      });

      console.log(`Ground station enabled for ${email}`);
      return NextResponse.json({ received: true });
    }

    // ── Physical hardware order ──────────────────────────────────────────────
    const isCartOrder = session.metadata?.cart === "true";

    if (isCartOrder || HARDWARE_TIERS.has(tier)) {
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items"],
      });

      let shippingName = fullSession.customer_details?.name ?? email;
      let addressLine = "No address captured";

      const rawAddr = session.metadata?.shippingAddress;
      if (rawAddr) {
        try {
          const addr = JSON.parse(rawAddr);
          shippingName = addr.name || shippingName;
          const parts = [addr.line1];
          if (addr.line2) parts.push(addr.line2);
          parts.push(`${addr.city}, ${addr.state} ${addr.zip}`);
          addressLine = parts.join(", ");
        } catch {}
      } else {
        const sd = (fullSession as any).shipping_details ?? (fullSession as any).shipping;
        const sa = sd?.address ?? fullSession.customer_details?.address;
        if (sd?.name) shippingName = sd.name;
        if (sa) addressLine = `${sa.line1}${sa.line2 ? ", " + sa.line2 : ""}, ${sa.city}, ${sa.state} ${sa.postal_code}`;
      }

      const lineItems = fullSession.line_items?.data ?? [];
      const amountTotal = fullSession.amount_total ?? 0;
      const firstName = shippingName.split(" ")[0];

      const items = lineItems.map(item => ({
        description: item.description ?? "Item",
        amount: item.amount_total != null ? `$${(item.amount_total / 100).toFixed(2)}` : "",
        quantity: item.quantity ?? 1,
      }));

      const totalFormatted = `$${(amountTotal / 100).toFixed(2)}`;

      await Promise.allSettled([
        resend.emails.send({
          from: "FinalPing <noreply@finalpingapp.com>",
          to: email,
          subject: "Your FinalPing order is confirmed",
          react: React.createElement(OrderConfirmation, {
            firstName,
            shippingName,
            shippingAddress: addressLine,
            items,
            totalFormatted,
          }),
        }),
        resend.emails.send({
          from: "FinalPing <noreply@finalpingapp.com>",
          to: process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL!,
          subject: `New order: ${shippingName} — ${totalFormatted}`,
          react: React.createElement(AdminOrderAlert, {
            customerName: shippingName,
            customerEmail: email,
            shippingAddress: addressLine,
            items,
            totalFormatted,
            stripeSession: session.id,
          }),
        }),
        prisma.order.upsert({
          where: { stripeSessionId: session.id },
          create: {
            stripeSessionId: session.id,
            customerEmail: email,
            customerName: shippingName,
            shippingAddress: addressLine,
            items,
            totalFormatted,
            status: "pending",
          },
          update: {},
        }),
      ]);

      console.log(`Hardware order received from ${email}`);
      return NextResponse.json({ received: true });
    }

    // ── Regular license purchase ─────────────────────────────────────────────
    // Idempotency: Stripe delivers at-least-once, so bail if this checkout
    // session already produced a license (avoids duplicate keys + emails).
    const alreadyProvisioned = await prisma.license.findFirst({
      where: { stripeSessionId: session.id },
    });
    if (alreadyProvisioned) {
      console.log(`License already provisioned for session ${session.id}, skipping`);
      return NextResponse.json({ received: true });
    }

    const licenseKey = generateLicenseKey(tier);
    const user = await prisma.user.findUnique({ where: { email } });

    await prisma.license.create({
      data: {
        purchaseEmail: email,
        userId: user?.id ?? undefined,
        licenseKey,
        tier,
        status: "inactive",
        stripeSessionId: session.id,
        // Mark the trial as used so it can't be started again (M4).
        hadTrial: session.metadata?.is_trial === "true",
      },
    });

    await createLicenseInBackend(licenseKey, tier, email);

    const tierLabel = tier === "pro" ? "Pro" : tier === "premium" ? "Premium" : tier.startsWith("team-") ? tier.replace("team-", "Team ") : "Starter";

    await resend.emails.send({
      from: "FinalPing <noreply@finalpingapp.com>",
      to: email,
      subject: `Your FinalPing ${tierLabel} License Key`,
      react: React.createElement(LicenseKey, { email, licenseKey, tierLabel }),
    });

    console.log(`License created for ${email}: ${licenseKey}`);
  }

  // ── invoice.payment_succeeded — subscription renewal ──────────────────────
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;

    if (invoice.billing_reason === "subscription_cycle") {
      const customerEmail = typeof invoice.customer_email === "string" ? invoice.customer_email : null;
      if (!customerEmail) return NextResponse.json({ received: true });

      const email = customerEmail.toLowerCase().trim();
      const license = await prisma.license.findFirst({
        where: { purchaseEmail: email, status: "active" },
        orderBy: { activatedAt: "desc" },
      });

      if (!license) {
        console.error(`No active license found for renewal: ${email}`);
        return NextResponse.json({ received: true });
      }

      const now = new Date();
      const currentExpiry = license.expiresAt ?? now;
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.license.update({ where: { id: license.id }, data: { expiresAt: newExpiry } });

      try {
        await fetch(`${BACKEND_URL}/api/licenses/renew`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Webhook-Secret": INTERNAL_SECRET },
          body: JSON.stringify({ license_key: license.licenseKey, expires_at: newExpiry.toISOString() }),
        });
      } catch (err) {
        console.error("Failed to update Railway on renewal:", err);
      }

      const tierLabel = license.tier === "pro" ? "Pro" : license.tier === "premium" ? "Premium" : "Starter";
      const expiryFormatted = newExpiry.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      await resend.emails.send({
        from: "FinalPing <noreply@finalpingapp.com>",
        to: email,
        subject: `FinalPing ${tierLabel}: Subscription Renewed`,
        react: React.createElement(SubscriptionRenewed, { tierLabel, expiryFormatted }),
      });

      console.log(`License renewed for ${email} until ${newExpiry.toISOString()}`);
    }
  }

  // ── customer.subscription.deleted — subscription cancelled ────────────────
  if (event.type === "customer.subscription.deleted") {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      // Stripe Subscription objects have no customer_email — resolve it from the
      // customer, matching the trial_will_end branch below. Without this the
      // handler always early-returned and licenses were never expired.
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      const customerEmail = (customer as Stripe.Customer).email;

      if (!customerEmail) return NextResponse.json({ received: true });

      const email = customerEmail.toLowerCase().trim();
      const license = await prisma.license.findFirst({
        where: { purchaseEmail: email, status: "active" },
        orderBy: { activatedAt: "desc" },
      });

      if (!license) {
        console.error(`No active license to expire for: ${email}`);
        return NextResponse.json({ received: true });
      }

      const now = new Date();
      await prisma.license.update({ where: { id: license.id }, data: { status: "expired", expiresAt: now } });

      const tierLabel = license.tier === "pro" ? "Pro" : license.tier === "premium" ? "Premium" : "Starter";
      const expiredFormatted = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      await resend.emails.send({
        from: "FinalPing <noreply@finalpingapp.com>",
        to: email,
        subject: "Your FinalPing subscription has ended",
        react: React.createElement(SubscriptionCancelled, { tierLabel, expiredFormatted }),
      });

      console.log(`License expired for ${email} (subscription.deleted)`);
    } catch (err) {
      console.error("Error handling subscription.deleted:", err);
    }
  }

  // ── customer.subscription.trial_will_end — 3-day warning ─────────────────
  if (event.type === "customer.subscription.trial_will_end") {
    try {
      const subscription = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      const customerEmail = (customer as Stripe.Customer).email;

      if (customerEmail) {
        const trialEnd = new Date((subscription.trial_end ?? 0) * 1000);
        const trialEndFormatted = trialEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

        await resend.emails.send({
          from: "FinalPing <noreply@finalpingapp.com>",
          to: customerEmail,
          subject: "Your FinalPing trial ends in 3 days",
          react: React.createElement(TrialEndingSoon, { trialEndFormatted }),
        });

        console.log(`Trial ending email sent to ${customerEmail}`);
      }
    } catch (err) {
      console.error("Error handling trial_will_end:", err);
    }
  }

  // ── invoice.payment_failed — notify customer to update card ──────────────
  if (event.type === "invoice.payment_failed") {
    try {
      const invoice = event.data.object as Stripe.Invoice;
      const customerEmail = typeof invoice.customer_email === "string" ? invoice.customer_email : null;
      if (!customerEmail) return NextResponse.json({ received: true });

      const email = customerEmail.toLowerCase().trim();
      const attemptCount = invoice.attempt_count ?? 1;

      const license = await prisma.license.findFirst({
        where: { purchaseEmail: email, status: "active" },
        orderBy: { activatedAt: "desc" },
      });

      const tierLabel = license?.tier === "pro" ? "Pro" : license?.tier === "premium" ? "Premium" : "Starter";

      await resend.emails.send({
        from: "FinalPing <noreply@finalpingapp.com>",
        to: email,
        subject: "Action required: your FinalPing payment failed",
        react: React.createElement(PaymentFailed, { tierLabel, attemptCount }),
      });

      console.log(`Payment failed email sent to ${email} (attempt ${attemptCount})`);
    } catch (err) {
      console.error("Error handling invoice.payment_failed:", err);
    }
  }

  return NextResponse.json({ received: true });
}
