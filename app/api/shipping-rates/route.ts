import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { computeShippingRates, type ShippingRate } from "@/lib/shipping";

export async function POST(req: NextRequest) {
  try {
    // Require a session — this drives billable EasyPost calls.
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Please log in first" }, { status: 401 });
    }

    // Throttle the billable EasyPost lookups per account.
    const rl = rateLimit(`shipping-rates:${session.user.email}`, 20, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    const { zip, address, items } = await req.json();

    let rates: ShippingRate[];
    try {
      rates = await computeShippingRates(address, zip, items ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "INVALID_ZIP") return NextResponse.json({ error: "Invalid ZIP code" }, { status: 400 });
      if (msg === "NO_VALID_ITEMS") return NextResponse.json({ error: "No valid items" }, { status: 400 });
      return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
    }

    // Admin-only free shipping for test purchases
    const withAdmin: ShippingRate[] = [...rates];
    if (session.user.email === process.env.ADMIN_EMAIL) {
      withAdmin.unshift({ carrier: "Test", service: "Free Shipping (Admin Test)", token: "free_test", amount: 0, days: null });
    }

    return NextResponse.json({ rates: withAdmin });
  } catch (err) {
    console.error("Shipping rates error:", err);
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}
