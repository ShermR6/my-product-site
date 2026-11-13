// app/pricing/faqs.ts
// Shared between the pricing UI (PricingTabs) and the FAQPage JSON-LD in page.tsx.

export const faqs = [
  {
    q: "How does the free trial work?",
    a: "You get 7 days of the full plan. Starting the trial needs a card, but nothing is charged until the trial ends, and you can cancel before then from your dashboard and pay nothing. Each account gets one trial.",
  },
  {
    q: "What is the difference between monthly and yearly?",
    a: "Only the price. Monthly is $14.99 a month. Yearly is $107.88 charged once a year, which works out to $8.99 a month and saves 40%. Both include everything.",
  },
  {
    q: "Are there other plans or paid add-ons?",
    a: "No. There is one plan and it includes every feature: up to 15 aircraft, every notification channel and Ground Station support. The only thing sold separately is receiver hardware, if you want your own Ground Station.",
  },
  {
    q: "Is there a limit on text message alerts?",
    a: "Yes, 100 text messages a month per account, because each one has a carrier cost. Every other channel, including Discord, email, Slack, Microsoft Teams, Google Chat, Telegram and webhooks, has no monthly limit.",
  },
  {
    q: "What if I need more than 15 aircraft?",
    a: "Contact us. Flight schools, FBOs and fleet operators are better served by FinalPing for Teams, which is in development, and we can arrange something in the meantime.",
  },
  {
    q: "How does the 30-day refund work?",
    a: "If you're not satisfied for any reason within the first 30 days, contact us and we'll issue a full refund, no questions asked.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. FinalPing runs in your browser at finalpingapp.com/app. Sign in on any computer and your aircraft, airport and alerts are there.",
  },
  {
    q: "What happens when my subscription renews?",
    a: "It renews automatically each month or year depending on your billing period. You'll receive an email receipt from Stripe, and tracking continues uninterrupted.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your dashboard or by contacting support. You keep access until the end of the period you have paid for. After that, tracking and alerts stop, and your aircraft and settings are kept in case you come back.",
  },
];
