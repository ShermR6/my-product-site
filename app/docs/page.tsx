import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help & Documentation",
  description: "Everything you need to get FinalPing set up and running. Setup guides, troubleshooting, integrations, and more.",
};

type Section = {
  id: string;
  title: string;
  items: { q: string; a: string | React.ReactNode }[];
};

const sections: Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    items: [
      {
        q: "How do I download and install FinalPing?",
        a: "Go to the Download page and grab the Windows installer. Run FinalPingSetup.exe, follow the prompts, and the app will launch automatically. A shortcut is added to your desktop and Start menu.",
      },
      {
        q: "How do I activate my license?",
        a: "After purchasing, you will receive a license key by email. Open FinalPing, enter your email address and license key on the activation screen, and click Activate. Your 30-day billing period starts at activation, not at purchase.",
      },
      {
        q: "Can I reinstall on a different computer?",
        a: "Yes. Your license is tied to your email address, not a specific machine. Install FinalPing on any Windows computer and activate with the same email and license key.",
      },
      {
        q: "How do I set my airport location?",
        a: "Go to Airport Config in the sidebar. Search for your airport by ICAO code or name, then click it to load its coordinates. You can also enter coordinates manually for FBOs or non-airport locations. Save when done.",
      },
    ],
  },
  {
    id: "aircraft",
    title: "Aircraft Tracking",
    items: [
      {
        q: "How do I add an aircraft to track?",
        a: "Go to Aircraft in the sidebar and click Add Aircraft. Enter the tail number (e.g. N12345) and the ICAO24 hex code. The ICAO24 code is a 6-character hex identifier (e.g. a1b2c3) found on sites like ADS-B Exchange or FlightAware. A friendly name and aircraft type are optional.",
      },
      {
        q: "Where do I find an aircraft's ICAO24 code?",
        a: "Search the aircraft's tail number on ADSBexchange.com or FlightAware.com. The ICAO24 (sometimes labeled Mode S or hex code) is shown on the aircraft detail page. It is a 6-character hexadecimal value.",
      },
      {
        q: "What alert distances are available?",
        a: "Default zones are 10nm, 5nm, and 2nm. You can customize these in Airport Config. Each zone fires one notification as the aircraft crosses inbound. Once an alert fires for a given approach event, it will not re-fire until the aircraft leaves and returns.",
      },
      {
        q: "How does the ADS-B data source work?",
        a: "FinalPing uses public ADS-B data (via adsb.lol) which is broadcast directly by aircraft transponders. Coverage depends on the network of ground receivers in your area. Most major airports and populated regions have excellent coverage.",
      },
      {
        q: "What is the polling interval?",
        a: "FinalPing checks for aircraft position updates every 10 seconds by default. This is configurable in Airport Config. A shorter interval means faster alerts but slightly more API usage.",
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications & Integrations",
    items: [
      {
        q: "What notification channels are supported?",
        a: "Discord (webhook), Slack (webhook), Microsoft Teams (webhook), Google Chat (webhook), email, SMS (via Twilio), Telegram, and generic webhooks. Available channels depend on your plan tier.",
      },
      {
        q: "How do I set up a Discord webhook?",
        a: "In Discord, go to your server, right-click the channel you want alerts in, and choose Edit Channel. Under Integrations, click Webhooks, then Create Webhook. Copy the webhook URL and paste it into FinalPing under Integrations.",
      },
      {
        q: "How do I customize alert messages?",
        a: "Go to Alerts in the sidebar. Each distance zone has an editable message template. You can use variables like {tail_number}, {distance}, {altitude}, {eta}, {speed}, {airport}, and {time} that get replaced with real data when an alert fires.",
      },
      {
        q: "What are quiet hours?",
        a: "Quiet hours suppress all notifications during a set time window each day. Configure them in Airport Config. You can set a start and end time (e.g. 10:00 PM to 6:00 AM) and toggle quiet hours on or off without losing your settings.",
      },
      {
        q: "Why am I not receiving test notifications?",
        a: "Check that your webhook URL or contact info is correct in Integrations. For Discord, make sure the webhook URL starts with https://discord.com/api/webhooks/. For email, check your spam folder. For SMS, verify your phone number includes the country code.",
      },
    ],
  },
  {
    id: "billing",
    title: "Account & Billing",
    items: [
      {
        q: "How do I upgrade my plan?",
        a: "From within the app, open the Billing tab in Account. You can upgrade directly from there. Your new tier is available immediately after checkout.",
      },
      {
        q: "How do I cancel my subscription?",
        a: "You can cancel from the Billing tab in Account, which opens the Stripe customer portal. You will keep access until the end of your current billing period. No partial refunds are issued for unused time after the 30-day window.",
      },
      {
        q: "What is the refund policy?",
        a: "All plans include a 30-day money-back guarantee. If you are not satisfied within the first 30 days of your billing period, contact support at aircraftalerts@finalpingapp.com and we will issue a full refund, no questions asked.",
      },
      {
        q: "What happens when my subscription renews?",
        a: "Your subscription renews automatically each month or year depending on your billing cycle. You will receive an email receipt from Stripe and your access continues uninterrupted.",
      },
      {
        q: "Can I switch between monthly and yearly billing?",
        a: "Contact support at aircraftalerts@finalpingapp.com and we can switch your billing cycle. Switching to yearly saves 17% compared to monthly.",
      },
    ],
  },
  {
    id: "ground-station",
    title: "Ground Station",
    items: [
      {
        q: "What is Ground Station?",
        a: "Ground Station is an optional add-on that lets you connect a local ADS-B receiver (RTL-SDR with dump1090 or similar) directly to FinalPing. This gives you lower-latency landing and takeoff detection that does not depend on cloud data coverage gaps.",
      },
      {
        q: "What hardware do I need?",
        a: "Any RTL-SDR USB dongle with an appropriate antenna running dump1090 (FlightAware, dump1090-fa, or similar). The Ground Station software runs on the same Windows machine as FinalPing or on a separate machine on your network.",
      },
      {
        q: "How do I get Ground Station access?",
        a: "Ground Station is available on Pro and Team plans. Once your plan is active, contact support to have it enabled on your account. You will receive setup instructions by email.",
      },
      {
        q: "Where do I find the setup instructions?",
        a: "After Ground Station is enabled on your account, the setup guide is available at finalpingapp.com/groundstationsetup when logged in.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    items: [
      {
        q: "The app says 'Connection lost' or can't reach the server.",
        a: "Check your internet connection. If you are on a corporate or restricted network, make sure outbound HTTPS (port 443) is allowed. The FinalPing backend runs at api.finalpingapp.com. If the issue persists, check status.finalpingapp.com for service outages.",
      },
      {
        q: "An aircraft is not appearing even though it's in the air.",
        a: "Verify the ICAO24 code is correct. The aircraft must be within your configured detection radius and within ADS-B coverage. Some aircraft (especially military and some private) may not broadcast ADS-B. Try searching the tail number on ADSBexchange.com to confirm it is visible.",
      },
      {
        q: "I got a 10nm alert but missed the 5nm alert.",
        a: "Alerts are suppressed if the same zone was already triggered in the current approach event. If the aircraft made a go-around and re-entered the zone, it will fire again. Check the Logs screen to see which alerts fired and at what time.",
      },
      {
        q: "My license shows as expired but I just renewed.",
        a: "Stripe renewal webhooks can sometimes take a few minutes to process. Close and reopen the app to force a license sync. If it still shows expired after 5 minutes, contact support with your email address.",
      },
      {
        q: "The app won't update automatically.",
        a: "Auto-updates require the app to be installed via the official installer (FinalPingSetup.exe) and running in production mode. The app checks for updates at launch. If an update is available, you will see a notification in the app. You can also download the latest installer manually from the Download page.",
      },
    ],
  },
];

// Simple React import needed for ReactNode type
import React from "react";

export default function DocsPage() {
  return (
    <>
      <h1>Help &amp; Documentation</h1>
      <p style={{ color: "var(--muted)", marginBottom: 40 }}>
        Setup guides, troubleshooting, and answers to common questions.
        Can&apos;t find what you need?{" "}
        <Link href="/contact" style={{ color: "var(--accent)" }}>Contact support</Link>.
      </p>

      {/* Jump links */}
      <div className="panel" style={{ padding: "16px 20px", marginBottom: 32, display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}
          >
            {s.title}
          </a>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {sections.map((section) => (
          <div key={section.id} id={section.id}>
            <h2 style={{ fontSize: 20, marginBottom: 16, letterSpacing: "-0.01em" }}>{section.title}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {section.items.map((item) => (
                <div key={item.q} className="panel" style={{ padding: 22 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>{item.q}</h3>
                  <p style={{ fontSize: 13, marginBottom: 0, lineHeight: 1.7, color: "var(--muted)" }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ padding: 28, marginTop: 48, textAlign: "center" }}>
        <p style={{ fontSize: 15, marginBottom: 12 }}>Still have questions?</p>
        <Link href="/contact" className="btn btn-solid" style={{ padding: "10px 22px", borderRadius: "999px", fontSize: 14 }}>
          Contact Support
        </Link>
      </div>
    </>
  );
}
