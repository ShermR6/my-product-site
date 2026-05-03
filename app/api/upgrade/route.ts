import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const BACKEND_URL = "https://aircraft-tracker-backend-production.up.railway.app";

const SUBSCRIPTION_PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  premium: process.env.STRIPE_PRICE_PREMIUM!,
  pro: process.env.STRIPE_PRICE_PRO!,
  "starter-yearly": process.env.STRIPE_PRICE_STARTER_YEARLY!,
  "premium-yearly": process.env.STRIPE_PRICE_PREMIUM_YEARLY!,
  "pro-yearly": process.env.STRIPE_PRICE_PRO_YEARLY!,
};

// Flat prices in cents
const MONTHLY_PRICES_CENTS: Record<string, number> = {
  starter: 1499,
  premium: 2499,
  pro: 4999,
};
const YEARLY_PRICES_CENTS: Record<string, number> = {
  starter: 14900,
  premium: 24900,
  pro: 49900,
};

const TIER_ORDER = ["starter", "premium", "pro"];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { licenseKey, newTier } = await req.json();

    if (!licenseKey || !newTier) {
      return NextResponse.json({ error: "Missing licenseKey or newTier" }, { status: 400 });
    }

    if (!TIER_ORDER.includes(newTier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Find the active license owned by this user
    const license = await prisma.license.findFirst({
      where: {
        licenseKey,
        status: "active",
        OR: [
          { purchaseEmail: session.user.email },
          { user: { email: session.user.email } },
        ],
      },
    });

    if (!license) {
      return NextResponse.json({ error: "Active license not found" }, { status: 404 });
    }

    if (!license.stripeSubscriptionId) {
      return NextResponse.json({ error: "No subscription linked to this license" }, { status: 400 });
    }

    // Validate this is an actual upgrade (higher tier only)
    const currentIndex = TIER_ORDER.indexOf(license.tier);
    const newIndex = TIER_ORDER.indexOf(newTier);
    if (newIndex <= currentIndex) {
      return NextResponse.json({ error: "Can only upgrade to a higher tier" }, { status: 400 });
    }

    // Fetch the Stripe subscription to get billing interval and customer ID
    const subscription = await stripe.subscriptions.retrieve(license.stripeSubscriptionId);
    const interval = subscription.items.data[0].price.recurring?.interval;
    const customerId = subscription.customer as string;

    // Calculate flat price difference
    const priceTable = interval === "year" ? YEARLY_PRICES_CENTS : MONTHLY_PRICES_CENTS;
    const currentPriceCents = priceTable[license.tier];
    const newPriceCents = priceTable[newTier];

    if (currentPriceCents === undefined || newPriceCents === undefined) {
      return NextResponse.json({ error: "Could not determine price for tier" }, { status: 500 });
    }

    const differenceCents = newPriceCents - currentPriceCents;
    if (differenceCents <= 0) {
      return NextResponse.json({ error: "Invalid price difference" }, { status: 400 });
    }

    // Determine the new Stripe price ID based on billing interval
    const newPriceKey = interval === "year" ? `${newTier}-yearly` : newTier;
    const newPriceId = SUBSCRIPTION_PRICE_MAP[newPriceKey];
    if (!newPriceId) {
      return NextResponse.json({ error: "Price ID not configured for this tier" }, { status: 500 });
    }

    // 1. Create a one-time invoice item for the flat price difference
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: differenceCents,
      currency: "usd",
      description: `Plan upgrade: ${license.tier} → ${newTier}`,
    });

    // 2. Create, finalize, and pay the invoice immediately
    const draft = await stripe.invoices.create({ customer: customerId });
    const finalized = await stripe.invoices.finalizeInvoice(draft.id);
    await stripe.invoices.pay(finalized.id);

    // 3. Update the subscription price for next renewal — no proration
    await stripe.subscriptions.update(license.stripeSubscriptionId, {
      items: [{ id: subscription.items.data[0].id, price: newPriceId }],
      proration_behavior: "none",
    });

    // 4. Update tier in web dashboard DB
    await prisma.license.update({
      where: { id: license.id },
      data: { tier: newTier },
    });

    // 5. Update tier in backend DB
    const backendRes = await fetch(`${BACKEND_URL}/api/licenses/${licenseKey}/tier`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.WEBHOOK_INTERNAL_SECRET || "",
      },
      body: JSON.stringify({ tier: newTier }),
    });
    if (!backendRes.ok) {
      console.error("Failed to update tier in backend:", await backendRes.text());
    }

    return NextResponse.json({
      success: true,
      newTier,
      charged: differenceCents,
    });
  } catch (err: any) {
    console.error("Upgrade error:", err);
    if (err?.type === "StripeCardError" || err?.code === "card_declined") {
      return NextResponse.json({ error: "Payment failed: " + err.message }, { status: 402 });
    }
    return NextResponse.json({ error: "Upgrade failed. Please try again." }, { status: 500 });
  }
}
