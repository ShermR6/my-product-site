import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  "starter-yearly": process.env.STRIPE_PRICE_STARTER_YEARLY!,
  "premium-yearly": process.env.STRIPE_PRICE_PREMIUM_YEARLY!,
  "pro-yearly": process.env.STRIPE_PRICE_PRO_YEARLY!,
  "team-starter-yearly": process.env.STRIPE_PRICE_TEAM_STARTER_YEARLY!,
  "team-premium-yearly": process.env.STRIPE_PRICE_TEAM_PREMIUM_YEARLY!,
  "team-pro-yearly": process.env.STRIPE_PRICE_TEAM_PRO_YEARLY!,
  "ground-station": process.env.STRIPE_PRICE_GROUND_STATION!,
  "ground-station-kit": process.env.STRIPE_PRICE_GROUND_STATION_KIT!,
  "ground-station-kit-built": process.env.STRIPE_PRICE_GROUND_STATION_KIT_BUILT!,
};

const ONE_TIME_TIERS = new Set(["ground-station", "ground-station-kit", "ground-station-kit-built"]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Please log in first", requireLogin: true }, { status: 401 });
    }

    const { tier } = await req.json();

    const priceId = PRICE_MAP[tier];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const isOneTime = ONE_TIME_TIERS.has(tier);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: isOneTime ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: tier.startsWith("ground-station-kit")
        ? `${process.env.NEXTAUTH_URL}/checkout/kit-success`
        : `${process.env.NEXTAUTH_URL}/dashboard?tab=licenses&success=1&product=${tier}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?cancelled=1`,
      customer_email: session.user.email,
      metadata: { tier, email: session.user.email },
      allow_promotion_codes: true,
      // Pause subscription billing until user activates their license key
      ...(isOneTime ? {} : {
        subscription_data: {
          metadata: { tier, email: session.user.email },
        },
      }),
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
