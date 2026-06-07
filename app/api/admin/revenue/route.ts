import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-01-28.clover" });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthTs = Math.floor(startOfMonth.getTime() / 1000);

  // Fetch all active subscriptions
  let activeSubscribers = 0;
  let newThisMonth = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const subs = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const sub of subs.data) {
      activeSubscribers++;
      if (sub.created >= startOfMonthTs) newThisMonth++;
    }

    hasMore = subs.has_more;
    if (subs.data.length > 0) startingAfter = subs.data[subs.data.length - 1].id;
    else break;
  }

  // Cancelled subs this month
  const cancelledSubs = await stripe.subscriptions.list({
    status: "canceled",
    limit: 100,
    created: { gte: startOfMonthTs },
  });
  const churnThisMonth = cancelledSubs.data.length;

  // Total revenue from successful charges (last 12 months for performance)
  const twelveMonthsAgo = Math.floor(new Date(now.getFullYear() - 1, now.getMonth(), 1).getTime() / 1000);
  let totalRevenue = 0;
  let hardwareRevenue = 0;
  let revenueThisMonth = 0;

  const charges = await stripe.charges.list({
    limit: 100,
    created: { gte: twelveMonthsAgo },
  });

  for (const charge of charges.data) {
    if (charge.status !== "succeeded" || charge.refunded) continue;
    const amount = charge.amount / 100;
    totalRevenue += amount;
    if (charge.created >= startOfMonthTs) revenueThisMonth += amount;
    // Hardware orders are one-time (no invoice subscription link)
    if (!(charge as any).invoice) hardwareRevenue += amount;
  }

  return NextResponse.json({
    activeSubscribers,
    newThisMonth,
    churnThisMonth,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    hardwareRevenue: Math.round(hardwareRevenue * 100) / 100,
    revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
  });
}
