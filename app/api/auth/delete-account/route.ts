import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-01-28.clover" });

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://aircraft-tracker-backend-production.up.railway.app";
const INTERNAL_SECRET = process.env.WEBHOOK_INTERNAL_SECRET ?? "skyping-internal-secret";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email.toLowerCase();

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Cancel active Stripe subscriptions
    const customers = await stripe.customers.list({ email, limit: 5 });
    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 10 });
      for (const sub of subscriptions.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
    }

    // Delete all backend data (aircraft, logs, integrations, etc.)
    const backendRes = await fetch(`${BACKEND_URL}/api/internal/user`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({ email }),
    });
    if (!backendRes.ok) {
      const body = await backendRes.text().catch(() => "");
      console.error(`Backend user delete failed: ${backendRes.status} ${body}`);
      throw new Error("Backend user deletion failed");
    }

    // Delete all Prisma-side licenses before deleting the user
    await prisma.license.deleteMany({ where: { userId: user.id } });

    // Delete web dashboard user — cascades sessions and accounts
    await prisma.user.delete({ where: { email } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Account deletion error:", err);
    return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
  }
}
