import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { computeShippingRates, type ShippingAddress } from "@/lib/shipping";

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

const HARDWARE_TIERS = new Set([
  "ground-station-kit", "ground-station-kit-built",
  "ground-station-kit-stubby", "ground-station-kit-stubby-built",
  "pro-stick-plus", "stand-antenna", "stubby-antenna-solo",
]);

type ShippingRateInput = { token?: string; label?: string; days?: number | null };

async function buildShippingParams(
  rate: ShippingRateInput | null | undefined,
  address: ShippingAddress | null | undefined,
  items: { tier: string; quantity: number }[],
  isAdmin: boolean,
): Promise<Partial<Stripe.Checkout.SessionCreateParams>> {
  const base: Partial<Stripe.Checkout.SessionCreateParams> = {};

  // No selection → the fixed default options.
  if (!rate?.token) {
    base.shipping_options = [
      { shipping_rate: process.env.STRIPE_SHIPPING_STANDARD! },
      { shipping_rate: process.env.STRIPE_SHIPPING_EXPEDITED! },
    ];
    return base;
  }

  // Admin-only free shipping for test purchases — verified server-side.
  if (rate.token === "free_test") {
    if (!isAdmin) throw new Error("SHIPPING_FORBIDDEN");
    const sr = await stripe.shippingRates.create({
      display_name: "Free Shipping",
      type: "fixed_amount",
      fixed_amount: { amount: 0, currency: "usd" },
    });
    base.shipping_options = [{ shipping_rate: sr.id }];
    return base;
  }

  // Re-derive the price server-side from the carrier — never trust a
  // client-supplied amount (which could be tampered to $0).
  const rates = await computeShippingRates(address, address?.zip, items);
  const match = rates.find(r => r.token === rate.token);
  if (!match) throw new Error("SHIPPING_RATE_UNAVAILABLE");

  const sr = await stripe.shippingRates.create({
    display_name: match.service,
    type: "fixed_amount",
    fixed_amount: { amount: Math.round(match.amount * 100), currency: "usd" },
    ...(match.days != null ? {
      delivery_estimate: {
        minimum: { unit: "business_day" as const, value: match.days },
        maximum: { unit: "business_day" as const, value: match.days + 2 },
      },
    } : {}),
  });
  base.shipping_options = [{ shipping_rate: sr.id }];
  return base;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Please log in first", requireLogin: true }, { status: 401 });
    }

    const { tier, addons = [], cartItems, shippingRate, shippingAddress } = await req.json();
    const addrMeta = shippingAddress ? JSON.stringify(shippingAddress) : undefined;
    const isAdmin = session.user.email === process.env.ADMIN_EMAIL;

    // Cart checkout — multiple items
    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      const lineItems = (cartItems as { tier: string; quantity: number }[])
        .map(item => ({ price: PRICE_MAP[item.tier], quantity: item.quantity || 1 }))
        .filter(item => item.price);
      if (lineItems.length === 0) {
        return NextResponse.json({ error: "No valid items" }, { status: 400 });
      }
      const shippingParams = await buildShippingParams(
        shippingRate,
        shippingAddress,
        cartItems as { tier: string; quantity: number }[],
        isAdmin,
      );
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: lineItems,
        success_url: `${process.env.NEXTAUTH_URL}/checkout/kit-success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/groundstationkit`,
        customer_email: session.user.email,
        metadata: { email: session.user.email, cart: "true", ...(addrMeta ? { shippingAddress: addrMeta } : {}) },
        allow_promotion_codes: true,
        ...shippingParams,
      });
      return NextResponse.json({ url: checkoutSession.url });
    }

    // Single-tier checkout
    const priceId = PRICE_MAP[tier];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const isOneTime = ONE_TIME_TIERS.has(tier);
    const isHardware = HARDWARE_TIERS.has(tier);

    const lineItems = [
      { price: priceId, quantity: 1 },
      ...((addons as string[])
        .map(addon => ({ price: PRICE_MAP[addon], quantity: 1 }))
        .filter(item => item.price)),
    ];

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: isOneTime ? "payment" : "subscription",
      payment_method_types: ["card"],
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
      ...(isHardware ? await buildShippingParams(shippingRate, shippingAddress, [{ tier, quantity: 1 }], isAdmin) : {}),
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
