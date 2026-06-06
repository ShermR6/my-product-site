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

const ALLOWED_SERVICES = [
  { carrier: "UPSDAP", service: "Ground",     token: "ups_ground" },
  { carrier: "UPSDAP", service: "2ndDayAir",  token: "ups_2day" },
  { carrier: "UPSDAP", service: "NextDayAir", token: "ups_next_day" },
];

export async function POST(req: NextRequest) {
  try {
    const { zip, address, items } = await req.json();

    const destZip = address?.zip ?? zip;
    if (!destZip || !/^\d{5}$/.test(destZip)) {
      return NextResponse.json({ error: "Invalid ZIP code" }, { status: 400 });
    }

    const addressTo = address
      ? { street1: address.line1, street2: address.line2 || "", city: address.city, state: address.state, zip: address.zip, country: "US" }
      : { zip: destZip, country: "US" };

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

    const apiKey = process.env.EASYPOST_API_KEY!;
    const auth = Buffer.from(`${apiKey}:`).toString("base64");

    const res = await fetch("https://api.easypost.com/v2/shipments", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipment: {
          from_address: { street1: "1 Main St", city: "Justin", state: "TX", zip: FROM_ZIP, country: "US" },
          to_address: addressTo,
          parcel: {
            length: maxL,
            width: maxW,
            height: Math.max(totalH, 2),
            weight: Math.max(totalWeight * 16, 1.6), // EasyPost uses ounces
          },
        },
      }),
    });

    if (!res.ok) {
      console.error("EasyPost error:", await res.text());
      return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
    }

    const data = await res.json();

    if (process.env.SHIPPING_DEBUG === "true") {
      console.log("RAW RATES:", JSON.stringify((data.rates as any[]).map(r => `${r.carrier}::${r.service} $${r.rate}`)));
    }

    const rates = ((data.rates as any[]) || [])
      .filter(r => ALLOWED_SERVICES.some(s => s.carrier === r.carrier && s.service === r.service))
      .sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))
      .map(r => {
        const svc = ALLOWED_SERVICES.find(s => s.carrier === r.carrier && s.service === r.service)!;
        const serviceLabel: Record<string, string> = {
          usps_ground_advantage: "USPS Ground Advantage",
          usps_priority: "USPS Priority Mail",
          ups_ground: "UPS Ground",
          ups_2day: "UPS 2nd Day Air",
          ups_next_day: "UPS Next Day Air",
        };
        return {
          carrier: r.carrier as string,
          service: serviceLabel[svc.token] ?? r.service,
          token: svc.token,
          amount: parseFloat(r.rate) + 2,
          days: (r.estimated_delivery_days as number | null) ?? null,
        };
      });

    // Dev-only free shipping option — never shown in production
    if (process.env.FREE_SHIPPING_TEST === "true") {
      rates.unshift({
        carrier: "USPS",
        service: "Free Shipping (Dev Only)",
        token: "free_test",
        amount: 0,
        days: null,
      });
    }

    return NextResponse.json({ rates });
  } catch (err) {
    console.error("Shipping rates error:", err);
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}
