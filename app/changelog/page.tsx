// app/changelog/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Release history and what's new in each version of FinalPing.",
};

type Entry = {
  version: string;
  date: string;
  tag?: "latest";
  changes: { type: "new" | "fix" | "improved"; text: string }[];
};

const entries: Entry[] = [
  {
    version: "1.1.0",
    date: "June 2026",
    tag: "latest",
    changes: [
      { type: "new", text: "Setup wizard installer — choose your install directory and opt in to a desktop shortcut" },
      { type: "new", text: "Ground Station device key system — permanent non-expiring key replaces JWT, claimed automatically on first boot" },
      { type: "new", text: "Distance alerts now include aircraft speed in knots" },
      { type: "new", text: "Landing alerts now include runway number derived from touchdown heading" },
      { type: "fix", text: "Takeoff notifications no longer show ETA — now shows altitude and speed" },
      { type: "fix", text: "Distance alerts now fire for aircraft that start inside the outer alert boundary" },
      { type: "fix", text: "Fixed duplicate Start Menu entries (FinalPing and FinalPing.exe)" },
      { type: "improved", text: "Live map: aircraft labels are now permanent, stale positions are visually indicated" },
      { type: "improved", text: "SDR coverage polygon tooltip clarified — shows best historical range, not live coverage" },
    ],
  },
  {
    version: "1.0.9",
    date: "June 2026",
    changes: [
      { type: "new", text: "Live Map trail now records the full flight path in the background — switch to any tab and come back to see the complete route from takeoff" },
      { type: "new", text: "App now checks for updates hourly in addition to on launch" },
      { type: "fix", text: "Landing alerts now fire reliably — cloud tracker detects on-ground transitions directly instead of waiting for signal loss" },
      { type: "fix", text: "Takeoff alerts now fire from the cloud tracker when an aircraft transitions from on-ground to airborne" },
      { type: "fix", text: "Dashboard Recent Alerts timestamps now display correctly instead of showing \"Just now\"" },
    ],
  },
  {
    version: "1.0.8",
    date: "May 2026",
    changes: [
      { type: "new", text: "New app icon with runway and radar design" },
      { type: "new", text: "Formatting syntax guide in alert message editor — bold, italic, underline, and strikethrough reference chips" },
      { type: "improved", text: "Help Center button added to the dashboard toolbar" },
      { type: "improved", text: "macOS installer now available for download" },
    ],
  },
  {
    version: "1.0.7",
    date: "May 2026",
    changes: [
      { type: "new", text: "Auto-updater: app now checks for new versions on launch and prompts to install" },
      { type: "improved", text: "Download page updated with direct installer links for Windows and macOS" },
    ],
  },
  {
    version: "1.0.6",
    date: "May 2026",
    changes: [
      { type: "new", text: "Plan upgrades available directly from the Billing tab, no need to contact support" },
      { type: "new", text: "Quiet hours enable/disable toggle, can now fully turn quiet hours off after setting them" },
      { type: "fix", text: "Quiet hours were stored but never enforced; notifications now correctly suppressed during the set window" },
      { type: "improved", text: "ETA on approach alerts now uses actual aircraft groundspeed from ADS-B data instead of a fixed 90-knot estimate" },
      { type: "improved", text: "License tier now syncs from the backend when opening Aircraft or Integrations screens, no restart needed after an upgrade" },
      { type: "improved", text: "Upgrade checkout now supports promotion/discount codes" },
    ],
  },
  {
    version: "1.0.5",
    date: "April 2026",
    changes: [
      { type: "new", text: "Ground Station support: connect a local RTL-SDR/dump1090 receiver for lower-latency landing and takeoff detection" },
      { type: "new", text: "Takeoff detection added alongside existing landing alerts" },
      { type: "improved", text: "Approach alert pipeline now enforces sequential zone crossing (10nm → 5nm → 2nm) to reduce false positives" },
      { type: "improved", text: "Landing detection now cross-checks ADS-B signal loss with last known position and altitude" },
    ],
  },
  {
    version: "1.0.4",
    date: "March 2026",
    changes: [
      { type: "new", text: "Multi-location monitoring for Premium and Pro plans" },
      { type: "new", text: "Alert log export: download your full notification history" },
      { type: "improved", text: "Live Map added to the desktop app dashboard" },
      { type: "fix", text: "Subscription renewal now correctly extends license expiry to match the Stripe billing period end date" },
    ],
  },
  {
    version: "1.0.3",
    date: "February 2026",
    changes: [
      { type: "new", text: "SMS and push notification integrations" },
      { type: "new", text: "Alert history and Logs screen in desktop app" },
      { type: "new", text: "Custom alert message templates per distance zone" },
      { type: "improved", text: "Notification cooldown system to prevent duplicate alerts within the same event" },
    ],
  },
  {
    version: "1.0.2",
    date: "January 2026",
    changes: [
      { type: "new", text: "Yearly billing option with 17% savings" },
      { type: "new", text: "Saved Locations for quick airport/FBO configuration switching" },
      { type: "improved", text: "Detection radius and polling interval now configurable per account" },
    ],
  },
  {
    version: "1.0.1",
    date: "December 2025",
    changes: [
      { type: "new", text: "Windows installer packaging with auto-updater" },
      { type: "improved", text: "License activation now starts the billing period at activation, not purchase" },
      { type: "fix", text: "Various stability improvements to the cloud tracking engine" },
    ],
  },
  {
    version: "1.0.0",
    date: "November 2025",
    changes: [
      { type: "new", text: "Initial release of FinalPing" },
      { type: "new", text: "Real-time aircraft tracking via adsb.lol ADS-B data" },
      { type: "new", text: "Distance-based approach alerts (10nm, 5nm, 2nm)" },
      { type: "new", text: "Discord, Slack, Teams, and email integrations" },
      { type: "new", text: "Starter, Premium, and Pro subscription tiers" },
    ],
  },
];

const TAG_COLORS = {
  new: { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9", label: "New" },
  fix: { bg: "rgba(239,68,68,0.1)", color: "#f87171", label: "Fix" },
  improved: { bg: "rgba(168,85,247,0.1)", color: "#a855f7", label: "Improved" },
};

export default function ChangelogPage() {
  return (
    <>
      <h1>Changelog</h1>
      <p style={{ color: "var(--muted)", marginBottom: 32 }}>
        Release history and what&apos;s new in each version of FinalPing.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {entries.map((entry) => (
          <div key={entry.version} className="panel-white">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>v{entry.version}</span>
              {entry.tag === "latest" && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "rgba(34,197,94,0.12)",
                    color: "#22c55e",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Latest
                </span>
              )}
              <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: "auto" }}>{entry.date}</span>
            </div>

            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {entry.changes.map((c, i) => {
                const tag = TAG_COLORS[c.type];
                return (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14 }}>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: tag.bg,
                        color: tag.color,
                        marginTop: 1,
                      }}
                    >
                      {tag.label}
                    </span>
                    <span>{c.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
