// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Providers from "./components/Providers";

export const metadata: Metadata = {
  title: {
    default: "FinalPing — Real-Time Aircraft Tracking & Alerts",
    template: "%s | FinalPing",
  },
  description: "Get real-time proximity alerts when your aircraft approaches. Track multiple aircraft with Discord, Slack, SMS, and email notifications.",
  keywords: ["aircraft tracking", "ADS-B", "flight alerts", "proximity alerts", "aviation", "FinalPing"],
  authors: [{ name: "FinalPing" }],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "FinalPing — Real-Time Aircraft Tracking & Alerts",
    description: "Get real-time proximity alerts when your aircraft approaches. Track multiple aircraft with Discord, Slack, SMS, and email notifications.",
    url: "https://finalpingapp.com",
    siteName: "FinalPing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinalPing — Real-Time Aircraft Tracking & Alerts",
    description: "Get real-time proximity alerts when your aircraft approaches.",
  },
  metadataBase: new URL("https://finalpingapp.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Providers>
          <Navbar />
          <main className="page">
            <div className="container">{children}</div>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
