import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-01-28.clover" });
const prisma = new PrismaClient();
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
        "X-Webhook-Secret": process.env.WEBHOOK_INTERNAL_SECRET || "finalping-internal-secret",
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

      const shippingDetails = (fullSession as any).shipping_details ?? (fullSession as any).shipping;
      const shippingAddress = shippingDetails?.address ?? fullSession.customer_details?.address;
      const shippingName = shippingDetails?.name ?? fullSession.customer_details?.name ?? email;
      const addressLine = shippingAddress
        ? `${shippingAddress.line1}${shippingAddress.line2 ? ", " + shippingAddress.line2 : ""}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}`
        : "No address captured";

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
      ]);

      console.log(`Hardware order received from ${email}`);
      return NextResponse.json({ received: true });
    }

    // ── Regular license purchase ─────────────────────────────────────────────
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
          headers: { "Content-Type": "application/json", "X-Webhook-Secret": process.env.WEBHOOK_INTERNAL_SECRET || "" },
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
      const customerEmail = typeof (subscription as any).customer_email === "string"
        ? (subscription as any).customer_email : null;

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

  return NextResponse.json({ received: true });
}
