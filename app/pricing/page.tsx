// app/pricing/page.tsx
import PricingTabs from "./PricingTabs";

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
