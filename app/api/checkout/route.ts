import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  premium: process.env.STRIPE_PRICE_PREMIUM!,
  pro: process.env.STRIPE_PRICE_PRO!,
  "team-starter": process.env.STRIPE_PRICE_TEAM_STARTER!,
  "team-premium": process.env.STRIPE_PRICE_TEAM_PREMIUM!,
  "team-pro": process.env.STRIPE_PRICE_TEAM_PRO!,
};

export async function POST(req: NextRequest) {
  try {
    const { tier } = await req.json();

    const priceId = PRICE_MAP[tier];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=1`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?cancelled=1`,
      metadata: { tier },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
