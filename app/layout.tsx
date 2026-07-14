// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

// Self-hosted at build time — no runtime requests to Google (GDPR + CSP).
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
