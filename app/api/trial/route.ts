import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { PLAN, type Billing } from "@/lib/plan";
import { planLineItem } from "@/lib/planCheckout";

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

    // Block if the account has ever had a trial or currently has an active plan
    const existing = await prisma.license.findFirst({
      where: {
        purchaseEmail: email,
        OR: [{ hadTrial: true }, { status: "active" }],
      },
    });
    if (existing) {
      const msg = existing.status === "active"
        ? "Your account already has an active plan. Visit your dashboard to manage it."
        : "You've already used your free trial. Subscribe to continue.";
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    if (!process.env.STRIPE_PRICE_STARTER) {
      return NextResponse.json({ error: "Plan price not configured" }, { status: 500 });
    }

    // The trial runs on whichever billing period they picked; nothing is charged until it ends.
    const body = await req.json().catch(() => ({}));
    const billing: Billing = body?.billing === "yearly" ? "yearly" : "monthly";
    const meta = { tier: PLAN.tier, billing, email, is_trial: "true" };

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [await planLineItem(stripe, billing)],
      subscription_data: { trial_period_days: PLAN.trialDays, metadata: meta },
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?tab=licenses&success=1&product=starter-trial`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      customer_email: email,
      metadata: meta,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Trial error:", err);
    return NextResponse.json({ error: "Failed to create trial session" }, { status: 500 });
  }
}
