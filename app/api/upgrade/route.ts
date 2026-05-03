import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const SUBSCRIPTION_PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  premium: process.env.STRIPE_PRICE_PREMIUM!,
  pro: process.env.STRIPE_PRICE_PRO!,
  "starter-yearly": process.env.STRIPE_PRICE_STARTER_YEARLY!,
  "premium-yearly": process.env.STRIPE_PRICE_PREMIUM_YEARLY!,
  "pro-yearly": process.env.STRIPE_PRICE_PRO_YEARLY!,
};

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

const TIER_LABELS: Record<string, string> = {
  starter: "Starter", premium: "Premium", pro: "Pro",
};

const TIER_ORDER = ["starter", "premium", "pro"];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { licenseKey, newTier } = await req.json();

    if (!licenseKey || !newTier || !TIER_ORDER.includes(newTier)) {
      return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
    }

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

    const currentIndex = TIER_ORDER.indexOf(license.tier);
    const newIndex = TIER_ORDER.indexOf(newTier);
    if (newIndex <= currentIndex) {
      return NextResponse.json({ error: "Can only upgrade to a higher tier" }, { status: 400 });
    }

    // Get subscription to determine billing interval and customer ID
    const subscription = await stripe.subscriptions.retrieve(license.stripeSubscriptionId);
    const interval = subscription.items.data[0].price.recurring?.interval;
    const customerId = subscription.customer as string;

    const priceTable = interval === "year" ? YEARLY_PRICES_CENTS : MONTHLY_PRICES_CENTS;
    const differenceCents = priceTable[newTier] - priceTable[license.tier];

    if (differenceCents <= 0) {
      return NextResponse.json({ error: "Invalid price difference" }, { status: 400 });
    }

    const newPriceKey = interval === "year" ? `${newTier}-yearly` : newTier;
    const newPriceId = SUBSCRIPTION_PRICE_MAP[newPriceKey];
    if (!newPriceId) {
      return NextResponse.json({ error: "Price ID not configured for this tier" }, { status: 500 });
    }

    // Create a Stripe Checkout session for the flat price difference
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `Plan Upgrade: ${TIER_LABELS[license.tier]} → ${TIER_LABELS[newTier]}`,
            description: `Price difference for upgrading now. Your subscription renews at the full ${TIER_LABELS[newTier]} plan price on your next billing date.`,
          },
          unit_amount: differenceCents,
        },
        quantity: 1,
      }],
      allow_promotion_codes: true,
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?tab=billing&upgraded=1`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?tab=billing`,
      metadata: {
        type: "upgrade",
        licenseKey: license.licenseKey,
        newTier,
        subscriptionId: license.stripeSubscriptionId,
        newPriceId,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Upgrade error:", err);
    return NextResponse.json({ error: "Failed to create upgrade session. Please try again." }, { status: 500 });
  }
}
