// Server only: what Stripe Checkout should charge for the plan.

import type Stripe from "stripe";
import { PLAN, type Billing } from "@/lib/plan";

/**
 * The plan as a Checkout line item, at the price in lib/plan.ts.
 *
 * A Stripe price set in the environment (STRIPE_PRICE_STARTER for monthly,
 * STRIPE_PRICE_PLAN_YEARLY for yearly) is used only when its amount and
 * interval match lib/plan.ts. Otherwise the amount is given inline against the
 * same Stripe product, so a price change in lib/plan.ts takes effect without
 * anything being created in the Stripe dashboard first, and an out-of-date
 * Stripe price is never charged. Running subscriptions keep the price they
 * started on: Stripe never changes those.
 */
export async function planLineItem(
  stripe: Stripe,
  billing: Billing
): Promise<Stripe.Checkout.SessionCreateParams.LineItem> {
  const monthlyPrice = process.env.STRIPE_PRICE_STARTER;
  if (!monthlyPrice) throw new Error("STRIPE_PRICE_STARTER is not set");

  const yearly = billing === "yearly";
  const amount = Math.round((yearly ? PLAN.yearly : PLAN.monthly) * 100);
  const interval = yearly ? "year" : "month";

  const configured = yearly ? process.env.STRIPE_PRICE_PLAN_YEARLY : monthlyPrice;
  if (configured) {
    const price = await stripe.prices.retrieve(configured);
    if (price.unit_amount === amount && price.recurring?.interval === interval) return { price: configured, quantity: 1 };
  }

  const monthly = await stripe.prices.retrieve(monthlyPrice);
  const product = typeof monthly.product === "string" ? monthly.product : monthly.product.id;
  return {
    price_data: { currency: "usd", product, unit_amount: amount, recurring: { interval } },
    quantity: 1,
  };
}
