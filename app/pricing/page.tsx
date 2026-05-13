// app/pricing/page.tsx
import type { Metadata } from "next";
import PricingTabs from "./PricingTabs";

export const metadata: Metadata = {
  title: "Pricing",
  description: "FinalPing plans starting from $9/month. 7-day free trial and 30-day money-back guarantee. Starter, Premium, and Pro tiers for pilots, FBOs, and flight schools.",
};

export default function PricingPage() {
  return (
    <main className="page">
      <div className="container">
        <div style={{ paddingTop: "48px" }}></div>
        <PricingTabs />
      </div>
    </main>
  );
}
