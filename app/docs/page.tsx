import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Help & Documentation",
  description: "Everything you need to get FinalPing set up and running: your airport, aircraft, alerts, channels, Ground Station and billing.",
};

type Section = {
  id: string;
  title: string;
  items: { q: string; a: React.ReactNode }[];
};

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} style={{ color: "var(--text)" }}>{children}</Link>
);

const sections: Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    items: [
      {
        q: "How do I start using FinalPing?",
        a: <>FinalPing runs in your browser, on a computer or a phone, so there is nothing to install. <A href="/account/create">Create an account</A>, then open <A href="/app">finalpingapp.com/app</A>. Pick your airport, add the aircraft you want to watch, and connect at least one channel (Discord, text message, email and so on) for the alerts to go to.</>,
      },
      {
        q: "Can I look around before paying?",
        a: "Yes. Without a plan the web app opens as a preview: you can see every screen, but nothing can be changed and no aircraft are watched. Start the 7-day free trial to use it for real. A card is needed for the trial, and nothing is charged if you cancel before it ends.",
      },
      {
        q: "How do I set my airport?",
        a: "Open Airport in the web app and search by code (like KDTO) or name. Its position, field elevation and runways load by themselves. You can also limit alerts to aircraft lined up with the runways you choose, which leaves out aircraft just passing by.",
      },
      {
        q: "I used the Windows or Mac desktop app. What now?",
        a: <>The desktop apps were retired on 13 November 2026 and no longer connect. Uninstall them and sign in at <A href="/app">finalpingapp.com/app</A> with the same email: your aircraft, airport, channels and alert settings are stored with your account and are already there.</>,
      },
    ],
  },
  {
    id: "aircraft",
    title: "Aircraft Tracking",
    items: [
      {
        q: "How do I add an aircraft?",
        a: "Open Aircraft and click Add aircraft. Type the tail number (like N12345) and click Look up: FinalPing fills in the transponder code and the aircraft type from the registry. A name is optional. Your plan covers up to 15 aircraft.",
      },
      {
        q: "The lookup didn't find my aircraft. Where do I find its transponder code?",
        a: "Search the tail number on ADSBexchange.com or FlightAware.com. The transponder code (also called ICAO24, Mode S or hex code) is shown on the aircraft's page. It is 6 characters, digits and the letters A to F. Enter it by hand in the Add aircraft window.",
      },
      {
        q: "Can one aircraft use different alert distances?",
        a: "Yes. Open Aircraft, click Edit on that aircraft and switch on Its own alert rings. It then alerts at its own distances instead of the airport's. To put every aircraft back on the airport's rings at once, use Use these rings for all aircraft at the bottom of the Alerts table.",
      },
      {
        q: "How do I change an aircraft's colour?",
        a: "On Aircraft, pick a colour at the bottom of its card, or in its Edit window. The colour is saved to your account, so the Dashboard, the Live Map and the 3D model use it on every device you sign in on.",
      },
      {
        q: "Where does the position data come from?",
        a: <>From two public networks of ADS-B receivers, <a href="https://adsb.lol" style={{ color: "var(--text)" }}>adsb.lol</a> and <a href="https://flyitalyadsb.com" style={{ color: "var(--text)" }}>FlyItalyADSB</a> (data under CC BY-SA 4.0), checked every 30 seconds. FinalPing uses whichever heard each aircraft most recently. Coverage depends on the receivers near your airport, and is often thin close to the ground. With a <a href="#ground-station" style={{ color: "var(--text)" }}>Ground Station</a> at your field, FinalPing also gets positions from your own receiver every few seconds, which is what lets it see landings, takeoffs and taxiing.</>,
      },
      {
        q: "What does the Live Map show?",
        a: "Every tracked aircraft in view, drawn as a 3D model of its type in the colour you picked. Click one to see its details and the whole flight it is on. Follow keeps the map on that aircraft while you zoom or tilt. The 3D button tilts the map and shows the terrain. An aircraft lost from view low and close to the airport is shown as landed.",
      },
      {
        q: "Can I replay a flight?",
        a: "Yes, any flight from the last 48 hours. Pick the aircraft on the Live Map (or press Flights on its card on the Aircraft page) and choose a flight under Recent flights. It plays back on the map from takeoff to landing at 1, 10, 30 or 60 times real speed. Drag the timeline to jump anywhere, or pick an alert to see exactly where the aircraft was when it was sent. A dashed stretch on the timeline is a gap in coverage, where no source heard the aircraft. Flights are kept for 48 hours, then deleted.",
      },
    ],
  },
  {
    id: "notifications",
    title: "Alerts & Channels",
    items: [
      {
        q: "Which channels can alerts go to?",
        a: "Discord, Slack, Microsoft Teams, Google Chat, email, text message (SMS), Telegram, and a webhook to your own system. All of them are included in the plan. Connect them on the Integrations page, where each one has a Send test button.",
      },
      {
        q: "What alerts are there?",
        a: "One alert each time a tracked aircraft crosses one of your distance rings on the way in (new accounts start with 10, 5 and 2 nm), plus Landed and Took off. Add or remove rings on the Alerts page. Landings and takeoffs are reported every time, including every lap of the pattern.",
      },
      {
        q: "How often can a ring alert for the same aircraft?",
        a: "Once per arrival. A ring alerts again only after the aircraft has been seen well outside it (3 nm beyond it, or 1.6 times its distance, whichever is further), or after it has been out of sight for 30 minutes. That keeps an aircraft working near a ring, or flying a wide pattern, from setting it off over and over. Rings of 5 nm and up only alert for aircraft heading roughly towards the airport.",
      },
      {
        q: "Can different alerts go to different channels?",
        a: "Yes. The table on the Alerts page has a column for each connected channel. Untick a box to keep that alert out of that channel, for example only the 2 nm and Landed alerts by text message.",
      },
      {
        q: "How do I change the wording of an alert?",
        a: "On the Alerts page, pick an alert under Message and edit it. Insert fields that are filled in when the alert is sent: tail number, distance, ETA, runway, airport, speed, altitude and time. The preview shows how it will read.",
      },
      {
        q: "What are quiet hours?",
        a: "A time window each day, in the airport's local time, when no alerts are sent (for example 23:00 to 06:00). Set it on the Alerts page. It can be switched off without losing the times.",
      },
      {
        q: "How do I set up a Discord webhook?",
        a: "In Discord, open the settings of the channel you want alerts in (Edit Channel), go to Integrations, then Webhooks, and click New Webhook. Copy the webhook URL and paste it into FinalPing under Integrations, Discord.",
      },
      {
        q: "How do I set up Telegram?",
        a: "Create a bot with @BotFather in Telegram and copy the bot token it gives you. Add the bot to the chat or channel you want alerts in, and find that chat's ID (a number, or @channelname for a public channel). Enter both under Integrations, Telegram.",
      },
      {
        q: "Is there a limit on text messages?",
        a: "Yes, 100 texts per account each calendar month. The SMS card on the Integrations page shows how many have been sent this month. When the limit is reached, texts stop until the 1st of the next month; every other channel keeps working.",
      },
    ],
  },
  {
    id: "ground-station",
    title: "Ground Station",
    items: [
      {
        q: "What is a Ground Station?",
        a: "A Raspberry Pi with an ADS-B radio at or near your airport, running the FinalPing receiver. It sends FinalPing the positions it hears every few seconds, which gives you landing and takeoff alerts at the moment they happen and shows taxiing on the Live Map. Support for it is included in the plan.",
      },
      {
        q: "What hardware do I need?",
        a: <>A Raspberry Pi on your network, a USB ADS-B radio (an RTL-SDR or FlightAware stick) and a 1090 MHz antenna, mounted as high and clear as you can. Or buy the <A href="/groundstationkit">Ground Station Kit</A>. Only Raspberry Pi (and other Debian-based Linux) is supported.</>,
      },
      {
        q: "How do I set it up?",
        a: <>Open Ground Station in the web app. It shows one command, with your device key in it, to paste into the Pi. That installs everything and links the receiver to your account. Enter your antenna&apos;s position there first so the command also turns on MLAT. The full guide, including preparing the SD card, is at <A href="/groundstationsetup">finalpingapp.com/groundstationsetup</A>.</>,
      },
      {
        q: "Can my receiver earn a free plan?",
        a: "Yes. Every FinalPing receiver also shares what it hears with adsb.lol. A receiver that feeds for at least 18 hours a day on 5 of the last 7 days earns the free feeder plan: up to 5 aircraft, with alerts to Discord, email and Slack. The paid plan covers up to 15 aircraft, with texts and every other channel. A new receiver has the feeder plan from its first report. One Raspberry Pi earns the plan for one account. The Ground Station page shows how many days count so far.",
      },
    ],
  },
  {
    id: "billing",
    title: "Account & Billing",
    items: [
      {
        q: "What does the plan include?",
        a: <>One plan with everything: up to 15 aircraft, all eight channels, Ground Station support and 100 text messages a month. It is $19.99 a month, or $155.88 a year, which works out to $12.99 a month (35% less). See <A href="/pricing">Pricing</A>.</>,
      },
      {
        q: "Where do I manage billing, or cancel?",
        a: "In the web app, open the menu under your initials (top right) and choose Account and billing. The Billing tab opens the Stripe customer portal, where you can change your card, download invoices or cancel. After cancelling you keep access until the end of the period you paid for.",
      },
      {
        q: "What is the refund policy?",
        a: "Your first payment comes with a 14-day money-back guarantee. If you are not satisfied within 14 days of that payment, contact support at aircraftalerts@finalpingapp.com and we will issue a full refund, no questions asked. Renewals are not refundable.",
      },
      {
        q: "What happens when my subscription renews?",
        a: "It renews by itself each month or year, depending on what you chose. Stripe emails you a receipt and nothing changes in the app.",
      },
      {
        q: "Can I switch between monthly and yearly billing?",
        a: "Contact support at aircraftalerts@finalpingapp.com and we will switch your billing cycle. Yearly costs 35% less than monthly.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    items: [
      {
        q: "The web app won't load, or says it can't reach the server.",
        a: <>Check your internet connection and reload the page. On a work or school network, make sure finalpingapp.com isn&apos;t blocked. You can see whether FinalPing itself is having a problem on the <A href="/status">status page</A>.</>,
      },
      {
        q: "An aircraft is not showing even though it's flying.",
        a: "Open Aircraft, click Edit on it and check the transponder code (Look up fills in the right one). Then search the tail number on ADSBexchange.com: if it isn't visible there either, it is outside ADS-B coverage or not transmitting. Some aircraft, including many military ones, don't broadcast ADS-B.",
      },
      {
        q: "I got the 10 nm alert but not the 5 nm one.",
        a: "The usual reasons: the aircraft wasn't heading towards the airport when it crossed 5 nm (rings of 5 nm and up need that), it was out of coverage at that moment, or that ring had already alerted on this arrival. Logs shows every alert that was sent and where it went.",
      },
      {
        q: "I'm not getting alerts in one channel.",
        a: "On Integrations, check that the channel is switched on and use Send test. On the Alerts page, check that its boxes are ticked and that quiet hours aren't on at that time. For text messages, check the number includes the country code and that this month's 100 texts aren't used up. For email, check your spam folder.",
      },
      {
        q: "My plan shows as expired but I just renewed.",
        a: "A renewal can take a few minutes to reach FinalPing. Reload the page after a few minutes. If it still shows expired, contact support at aircraftalerts@finalpingapp.com with your account email.",
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <>
      <h1>Help &amp; Documentation</h1>
      <p style={{ color: "var(--muted)", marginBottom: 40 }}>
        Setup guides, troubleshooting, and answers to common questions.
        Can&apos;t find what you need?{" "}
        <Link href="/contact" style={{ color: "var(--text)" }}>Contact support</Link>.
      </p>

      {/* Jump links */}
      <div className="panel" style={{ padding: "16px 20px", marginBottom: 32, display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            style={{ fontSize: 13, color: "var(--text)", textDecoration: "none" }}
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
