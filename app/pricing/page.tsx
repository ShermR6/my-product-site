// app/pricing/page.tsx
import type { Metadata } from "next";
import PricingTabs from "./PricingTabs";
import { faqs } from "./faqs";

export const metadata: Metadata = {
  title: "Pricing",
  description: "FinalPing is one plan with everything included: $14.99 a month, or $8.99 a month billed yearly. Up to 15 aircraft, every alert channel and Ground Station support. 7-day free trial and 30-day money-back guarantee.",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function PricingPage() {
  return (
    <main className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="container">
        <div style={{ paddingTop: "48px" }}></div>
        <PricingTabs />
      </div>
    </main>
  );
}
