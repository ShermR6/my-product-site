// app/pricing/page.tsx
import type { Metadata } from "next";
import PricingTabs from "./PricingTabs";
import { faqs } from "./faqs";

export const metadata: Metadata = {
  title: "Pricing",
  description: "FinalPing plans starting from $14.99/month. 7-day free trial and 30-day money-back guarantee. Starter, Premium, and Pro tiers for pilots, FBOs, and flight schools.",
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
