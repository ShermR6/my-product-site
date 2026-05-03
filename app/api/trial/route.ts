import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Please log in first", requireLogin: true }, { status: 401 });
    }

    const email = session.user.email.toLowerCase().trim();

    // One trial per email — check for any existing trial license
    const existing = await prisma.license.findFirst({
      where: { purchaseEmail: email, tier: "starter" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A trial or starter plan already exists for this account. Visit your dashboard to manage it." },
        { status: 409 }
      );
    }

    const priceId = process.env.STRIPE_PRICE_STARTER!;
    if (!priceId) {
      return NextResponse.json({ error: "Starter price not configured" }, { status: 500 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { tier: "starter", email, is_trial: "true" },
      },
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?tab=licenses&success=1&product=starter-trial`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      customer_email: email,
      metadata: { tier: "starter", email, is_trial: "true" },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Trial error:", err);
    return NextResponse.json({ error: "Failed to create trial session" }, { status: 500 });
  }
}
