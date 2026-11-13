// Server only: what Stripe Checkout should charge for the plan.

import type Stripe from "stripe";
import { PLAN, type Billing } from "@/lib/plan";

/**
 * The plan as a Checkout line item.
 *
 * Monthly is the existing $14.99 Stripe price (STRIPE_PRICE_STARTER). Yearly
 * uses STRIPE_PRICE_PLAN_YEARLY when that is set; otherwise the amount is
 * given inline against the same Stripe product, so the yearly price works
 * without anything being created in the Stripe dashboard first.
 */
export async function planLineItem(
  stripe: Stripe,
  billing: Billing
): Promise<Stripe.Checkout.SessionCreateParams.LineItem> {
  const monthlyPrice = process.env.STRIPE_PRICE_STARTER;
  if (!monthlyPrice) throw new Error("STRIPE_PRICE_STARTER is not set");

  if (billing !== "yearly") return { price: monthlyPrice, quantity: 1 };

  const yearlyPrice = process.env.STRIPE_PRICE_PLAN_YEARLY;
  if (yearlyPrice) return { price: yearlyPrice, quantity: 1 };

  const monthly = await stripe.prices.retrieve(monthlyPrice);
  const product = typeof monthly.product === "string" ? monthly.product : monthly.product.id;
  return {
    price_data: {
      currency: "usd",
      product,
      unit_amount: Math.round(PLAN.yearly * 100),
      recurring: { interval: "year" },
    },
    quantity: 1,
  };
}
