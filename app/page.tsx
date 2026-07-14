import LandingPageV3 from "./components/LandingPageV3";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FinalPing",
  url: "https://finalpingapp.com",
  logo: "https://finalpingapp.com/finalping-1024.png",
  contactPoint: {
    "@type": "ContactPoint",
    email: "aircraftalerts@finalpingapp.com",
    contactType: "customer support",
  },
};

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FinalPing",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Windows",
  url: "https://finalpingapp.com",
  description:
    "Real-time aircraft tracking and alert platform. Get proximity, landing, and takeoff alerts for your aircraft via Discord, Slack, SMS, and email.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "14.99",
    highPrice: "49.99",
    offerCount: "3",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />
      <LandingPageV3 />
    </>
  );
}
