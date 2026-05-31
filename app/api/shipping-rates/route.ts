import { NextRequest, NextResponse } from "next/server";

const FROM_ZIP = "76247";

const PARCEL_SPECS: Record<string, { length: number; width: number; height: number; weight: number }> = {
  "ground-station-kit":           { length: 12, width: 10, height: 6,  weight: 2.0 },
  "ground-station-kit-built":     { length: 12, width: 10, height: 6,  weight: 2.0 },
  "ground-station-kit-stubby":    { length: 12, width: 10, height: 5,  weight: 1.5 },
  "ground-station-kit-stubby-built": { length: 12, width: 10, height: 5, weight: 1.5 },
  "pro-stick-plus":               { length: 5,  width: 4,  height: 2,  weight: 0.25 },
  "stand-antenna":                { length: 10, width: 4,  height: 3,  weight: 0.65 },
  "stubby-antenna-solo":          { length: 6,  width: 4,  height: 2,  weight: 0.25 },
};

const ALLOWED_SERVICE_TOKENS = ["usps_ground_advantage", "usps_priority"];

export async function POST(req: NextRequest) {
  try {
    const { zip, items } = await req.json();

    if (!zip || !/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: "Invalid ZIP code" }, { status: 400 });
    }

    // Combine all items into one parcel
    let totalWeight = 0;
    let maxL = 0, maxW = 0, totalH = 0;

    for (const item of items as { tier: string; quantity: number }[]) {
      const spec = PARCEL_SPECS[item.tier];
      if (!spec) continue;
      const qty = Math.max(1, item.quantity || 1);
      totalWeight += spec.weight * qty;
      maxL = Math.max(maxL, spec.length);
      maxW = Math.max(maxW, spec.width);
      totalH += spec.height * qty;
    }

    if (totalWeight === 0) {
      return NextResponse.json({ error: "No valid items" }, { status: 400 });
    }

    const parcel = {
      length: String(maxL),
      width: String(maxW),
      height: String(Math.max(totalH, 2)),
      distance_unit: "in",
      weight: String(Math.max(totalWeight, 0.1)),
      mass_unit: "lb",
    };

    const res = await fetch("https://api.goshippo.com/shipments/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address_from: { zip: FROM_ZIP, country: "US" },
        address_to: { zip, country: "US" },
        parcels: [parcel],
        async: false,
      }),
    });

    if (!res.ok) {
      console.error("Shippo error:", await res.text());
      return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
    }

    const data = await res.json();

    const rates = ((data.rates as any[]) || [])
      .filter(r => ALLOWED_SERVICE_TOKENS.includes(r.servicelevel?.token))
      .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
      .map(r => ({
        carrier: r.provider as string,
        service: r.servicelevel.token === "usps_ground_advantage" ? "USPS Ground Advantage (4–7 days)" : "USPS Priority Mail (2–3 days)",
        token: r.servicelevel.token as string,
        amount: parseFloat(r.amount) + 2,
        days: null,
      }));

    return NextResponse.json({ rates });
  } catch (err) {
    console.error("Shipping rates error:", err);
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}
