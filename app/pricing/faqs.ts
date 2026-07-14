// app/pricing/faqs.ts
// Shared between the pricing UI (PricingTabs) and the FAQPage JSON-LD in page.tsx.

export const faqs = [
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade your plan at any time directly from your dashboard. You'll be charged the flat price difference between plans today, and your subscription renews at the new plan's price on your next billing date. Downgrades can be arranged by contacting support.",
  },
  {
    q: "How does the 30-day refund work?",
    a: "If you're not satisfied for any reason within the first 30 days, contact us and we'll issue a full refund, no questions asked.",
  },
  {
    q: "Do I need a license per device?",
    a: "Personal licenses are tied to your email, not a specific device. You can reinstall or switch computers and activate with the same license key.",
  },
  {
    q: "What happens when my subscription renews?",
    a: "Your subscription renews automatically each month or year depending on your billing cycle. You'll receive an email receipt from Stripe, and your access continues uninterrupted.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. You can cancel your subscription at any time from your dashboard or by contacting support. You'll keep access until the end of your current billing period.",
  },
  {
    q: "What's the difference between Personal and Team plans?",
    a: "Personal plans are for individual users tracking their own aircraft. Team plans are built for businesses like FBOs, fuel services, and flight schools. Multiple team members can log in and monitor a shared fleet, with much higher limits on tracked aircraft and notification channels.",
  },
];
