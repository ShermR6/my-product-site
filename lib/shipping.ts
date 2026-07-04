// Shared shipping-rate computation. Used by both /api/shipping-rates (to show
// options) and /api/checkout (to re-derive the price server-side so a tampered
// client amount can't set shipping to $0).

const FROM_ZIP = "76247";

const PARCEL_SPECS: Record<string, { length: number; width: number; height: number; weight: number }> = {
  "ground-station-kit":              { length: 12, width: 10, height: 6, weight: 2.0 },
  "ground-station-kit-built":        { length: 12, width: 10, height: 6, weight: 2.0 },
  "ground-station-kit-stubby":       { length: 12, width: 10, height: 5, weight: 1.5 },
  "ground-station-kit-stubby-built": { length: 12, width: 10, height: 5, weight: 1.5 },
  "pro-stick-plus":                  { length: 5,  width: 4,  height: 2, weight: 0.25 },
  "stand-antenna":                   { length: 10, width: 4,  height: 3, weight: 0.65 },
  "stubby-antenna-solo":             { length: 6,  width: 4,  height: 2, weight: 0.25 },
};

const ALLOWED_SERVICES = [
  { carrier: "UPSDAP", service: "Ground",    token: "ups_ground" },
  { carrier: "UPSDAP", service: "2ndDayAir", token: "ups_2day" },
];

export type ShippingAddress = { line1?: string; line2?: string; city?: string; state?: string; zip?: string };
export type ShippingRate = { carrier: string; service: string; token: string; amount: number; days: number | null };

export async function computeShippingRates(
  address: ShippingAddress | null | undefined,
  zip: string | null | undefined,
  items: { tier: string; quantity: number }[],
): Promise<ShippingRate[]> {
  const destZip = address?.zip ?? zip;
  if (!destZip || !/^\d{5}$/.test(destZip)) {
    throw new Error("INVALID_ZIP");
  }

  const addressTo = address
    ? { street1: address.line1, street2: address.line2 || "", city: address.city, state: address.state, zip: address.zip, country: "US" }
    : { zip: destZip, country: "US" };

  let totalWeight = 0;
  let maxL = 0, maxW = 0, totalH = 0;
  for (const item of items) {
    const spec = PARCEL_SPECS[item.tier];
    if (!spec) continue;
    const qty = Math.max(1, item.quantity || 1);
    totalWeight += spec.weight * qty;
    maxL = Math.max(maxL, spec.length);
    maxW = Math.max(maxW, spec.width);
    totalH += spec.height * qty;
  }

  if (totalWeight === 0) {
    throw new Error("NO_VALID_ITEMS");
  }

  const apiKey = process.env.EASYPOST_API_KEY!;
  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  const res = await fetch("https://api.easypost.com/v2/shipments", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
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
    throw new Error("RATES_FAILED");
  }

  const data = await res.json();
  const serviceLabel: Record<string, string> = {
    ups_ground: "UPS Ground",
    ups_2day: "UPS 2nd Day Air",
  };

  return ((data.rates as any[]) || [])
    .filter(r => ALLOWED_SERVICES.some(s => s.carrier === r.carrier && s.service === r.service))
    .sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))
    .map(r => {
      const svc = ALLOWED_SERVICES.find(s => s.carrier === r.carrier && s.service === r.service)!;
      return {
        carrier: r.carrier as string,
        service: serviceLabel[svc.token] ?? r.service,
        token: svc.token,
        amount: parseFloat(r.rate) + 2,
        days: (r.estimated_delivery_days as number | null) ?? null,
      };
    });
}
