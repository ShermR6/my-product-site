// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

// Self-hosted at build time — no runtime requests to Google (GDPR + CSP).
// Plus Jakarta Sans is a variable font (200–800), so no weight list: asking for
// six static weights made next/font emit a separate module per weight per
// unicode subset — 24 of them — and Turbopack intermittently failed to resolve
// them on Vercel ("next/font/google queries have exactly one entry") while
// building fine locally. The variable axis covers every weight the site uses.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Providers from "./components/Providers";
import CookieConsent from "./components/CookieConsent";

export const metadata: Metadata = {
  title: {
    default: "FinalPing | Real-Time Aircraft Tracking & Alerts",
    template: "%s | FinalPing",
  },
  description: "Get real-time proximity alerts when your aircraft approaches. Track multiple aircraft with Discord, Slack, SMS, and email notifications.",
  keywords: ["aircraft tracking", "ADS-B", "flight alerts", "proximity alerts", "aviation", "FinalPing"],
  authors: [{ name: "FinalPing" }],
  icons: {
    icon: [
      { url: "/favicon.svg?v=7", type: "image/svg+xml" },
      { url: "/favicon.ico?v=7" },
      { url: "/favicon-96x96.png?v=7", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=7" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "FinalPing | Real-Time Aircraft Tracking & Alerts",
    description: "Get real-time proximity alerts when your aircraft approaches. Track multiple aircraft with Discord, Slack, SMS, and email notifications.",
    url: "https://finalpingapp.com",
    siteName: "FinalPing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinalPing | Real-Time Aircraft Tracking & Alerts",
    description: "Get real-time proximity alerts when your aircraft approaches.",
  },
  metadataBase: new URL("https://finalpingapp.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={jakarta.variable}>
      <body>
        <Providers>
          <Navbar />
          <main className="page">
            <div className="container">{children}</div>
          </main>
          <Footer />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
