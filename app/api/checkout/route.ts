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
  "ground-station-kit-stubby": process.env.STRIPE_PRICE_GROUND_STATION_KIT_STUBBY!,
  "ground-station-kit-stubby-built": process.env.STRIPE_PRICE_GROUND_STATION_KIT_STUBBY_BUILT!,
  "pro-stick-plus": process.env.STRIPE_PRICE_PRO_STICK_PLUS!,
  "stand-antenna": process.env.STRIPE_PRICE_STAND_ANTENNA!,
  "stubby-antenna-solo": process.env.STRIPE_PRICE_STUBBY_ANTENNA_SOLO!,
};

const ONE_TIME_TIERS = new Set([
  "ground-station",
  "ground-station-kit",
  "ground-station-kit-built",
  "ground-station-kit-stubby",
  "ground-station-kit-stubby-built",
  "pro-stick-plus",
  "stand-antenna",
  "stubby-antenna-solo",
]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Please log in first", requireLogin: true }, { status: 401 });
    }

    const { tier, addons = [], cartItems } = await req.json();

    const HARDWARE_TIERS = new Set([
      "ground-station-kit", "ground-station-kit-built",
      "ground-station-kit-stubby", "ground-station-kit-stubby-built",
      "pro-stick-plus", "stand-antenna", "stubby-antenna-solo",
    ]);

    const shippingOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "AU"] },
      phone_number_collection: { enabled: true },
      shipping_options: [
        { shipping_rate: process.env.STRIPE_SHIPPING_STANDARD! },
        { shipping_rate: process.env.STRIPE_SHIPPING_EXPEDITED! },
      ],
    };

    // Cart checkout — multiple individual parts in one session
    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      const lineItems = (cartItems as { tier: string; quantity: number }[])
        .map(item => ({ price: PRICE_MAP[item.tier], quantity: item.quantity || 1 }))
        .filter(item => item.price);
      if (lineItems.length === 0) {
        return NextResponse.json({ error: "No valid items" }, { status: 400 });
      }
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        success_url: `${process.env.NEXTAUTH_URL}/checkout/kit-success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/groundstationkit`,
        customer_email: session.user.email,
        metadata: { email: session.user.email, cart: "true" },
        allow_promotion_codes: true,
        ...shippingOptions,
      });
      return NextResponse.json({ url: checkoutSession.url });
    }

    const priceId = PRICE_MAP[tier];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const isOneTime = ONE_TIME_TIERS.has(tier);
    const isHardware = HARDWARE_TIERS.has(tier);

    const lineItems = [
      { price: priceId, quantity: 1 },
      ...((addons as string[])
        .map((addon) => ({ price: PRICE_MAP[addon], quantity: 1 }))
        .filter((item) => item.price)),
    ];

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: isOneTime ? "payment" : "subscription",
      line_items: lineItems,
      success_url: isHardware
        ? `${process.env.NEXTAUTH_URL}/checkout/kit-success`
        : `${process.env.NEXTAUTH_URL}/dashboard?tab=licenses&success=1&product=${tier}`,
      cancel_url: isHardware
        ? `${process.env.NEXTAUTH_URL}/groundstationkit`
        : `${process.env.NEXTAUTH_URL}/pricing?cancelled=1`,
      customer_email: session.user.email,
      metadata: { tier, email: session.user.email },
      allow_promotion_codes: true,
      ...(isHardware ? shippingOptions : {}),
      ...(isOneTime ? {} : {
        subscription_data: { metadata: { tier, email: session.user.email } },
      }),
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
