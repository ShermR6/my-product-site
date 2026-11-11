"use client";

// The web app's frame: top bar with the section pills, the live strip, the
// page, and bottom tabs on a phone. Also the three states that replace the
// page entirely: still loading, plan expired, signed out.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, CreditCard, Home, LogOut, Map as MapIcon, MoreHorizontal, Plane, Globe } from "lucide-react";
import { TrackerProvider, useTracker } from "../_lib/store";
import { clockSeconds, etaText, inboundOf, nm, planOf, recentAlertsFor, ringsFor, ringKey, stageOf, STAGE_LABEL } from "../_lib/format";
import { Logo, Btn, Tail } from "./kit";

const SECTIONS = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/aircraft", label: "Aircraft" },
  { href: "/app/map", label: "Live Map" },
  { href: "/app/airport", label: "Airport" },
  { href: "/app/alerts", label: "Alerts" },
  { href: "/app/integrations", label: "Integrations" },
  { href: "/app/logs", label: "Logs" },
  { href: "/app/ground-station", label: "Ground Station" },
];

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(href + "/");
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TrackerProvider>
      <div className="fp-app">
        <Frame>{children}</Frame>
      </div>
    </TrackerProvider>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const t = useTracker();
  const pathname = usePathname() ?? "/app";

  useEffect(() => {
    if (t.blocked === "signedout") {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(pathname)}`;
    }
  }, [t.blocked, pathname]);

  if (t.blocked === "expired") {
    return (
      <>
        <TopBar pathname={pathname} bare />
        <FullMessage title="Your plan has ended">
          <p className="fa-sub" style={{ marginBottom: 20 }}>Renew it to pick up tracking where you left off. Your aircraft and settings are still here.</p>
          <Link className="fa-btn primary" href="/dashboard?tab=billing">Go to billing</Link>
        </FullMessage>
      </>
    );
  }

  if (!t.loaded) {
    return (
      <>
        <TopBar pathname={pathname} bare />
        <FullMessage title={t.offline ? "Can't reach the tracker" : "Loading your aircraft…"}>
          {t.offline && (
            <>
              <p className="fa-sub" style={{ marginBottom: 20 }}>FinalPing&apos;s tracker isn&apos;t answering right now. Your alerts are not affected.</p>
              <Btn variant="primary" onClick={() => t.reload()}>Try again</Btn>
            </>
          )}
        </FullMessage>
      </>
    );
  }

  return (
    <>
      <TopBar pathname={pathname} />
      <LiveStrip />
      <main className="fa-main">
        {t.offline && (
          <div className="fa-page" style={{ paddingBottom: 0 }}>
            <div className="fa-banner warn" role="status">Can&apos;t reach the tracker right now. Showing the last data received; retrying.</div>
          </div>
        )}
        {children}
      </main>
      <BottomTabs pathname={pathname} />
    </>
  );
}

function FullMessage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <main className="fa-main" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <h1 className="fa-title">{title}</h1>
        {children}
      </div>
    </main>
  );
}

function TopBar({ pathname, bare }: { pathname: string; bare?: boolean }) {
  const t = useTracker();
  // The menu belongs to the page it was opened on, so it closes on navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean | ((v: boolean) => boolean)) =>
    setOpenOn((cur) => ((typeof next === "function" ? next(cur === pathname) : next) ? pathname : null));
  useEffect(() => {
    if (!open) return;
    const close = () => setOpenOn(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  const name = t.me?.display_name || t.me?.email || "";
  const initials = name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "FP";

  return (
    <header className="fa-top">
      <Link href="/app" className="fa-brand"><Logo /><span>FinalPing</span></Link>
      <nav className="fa-nav" aria-label="Sections">
        {!bare && (
          <div className="fa-pills">
            {SECTIONS.map((s) => (
              <Link key={s.href} href={s.href} className="fa-pill" aria-current={isActive(pathname, s.href) ? "page" : undefined}>{s.label}</Link>
            ))}
          </div>
        )}
      </nav>
      <div className="fa-top-right">
        {!bare && (
          <Link href="/app/airport" className="fa-chip-btn" title="Airport settings">
            <span className="mono">{t.airport?.airport_code || "Set airport"}</span>
            <ChevronDown size={13} color="var(--muted)" aria-hidden="true" />
          </Link>
        )}
        <button className="fa-avatar" aria-label="Account menu" aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>{initials}</button>
      </div>
      {open && (
        <div className="fa-menu" role="menu" onClick={(e) => e.stopPropagation()}>
          <div className="fa-menu-head">
            <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{t.me?.email ?? "Signed in"}</div>
            {t.me && <div className="fa-note">{planOf(t.me.license_tier).name} plan</div>}
          </div>
          <Link href="/dashboard" role="menuitem"><CreditCard size={15} aria-hidden="true" />Account and billing</Link>
          <Link href="/" role="menuitem"><Globe size={15} aria-hidden="true" />finalpingapp.com</Link>
          <button role="menuitem" onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={15} aria-hidden="true" />Sign out</button>
        </div>
      )}
    </header>
  );
}

/** The nearest tracked aircraft that is closing on the airport, on every screen. */
function LiveStrip() {
  const t = useTracker();
  const inbound = inboundOf(t.live, t.aircraft, t.airport);
  const a = inbound[0];
  if (!a) return null;

  const rings = ringsFor(a.tail_number, t.aircraft, t.airport);
  const stage = stageOf(a, rings);
  const type = t.aircraft.find((x) => x.tail_number === a.tail_number)?.aircraft_type;
  const sent = recentAlertsFor(a.tail_number, t.recent);
  const sentCount = rings.filter((r) => sent.has(ringKey(r))).length;

  return (
    <div className="fa-strip" role="status">
      <span className="fa-strip-tag"><span className="fa-live-dot" />{STAGE_LABEL[stage]}</span>
      <Tail><span style={{ color: "var(--text)" }}>{a.tail_number}</span></Tail>
      {type && <span className="fa-hide-phone">{type}</span>}
      <span style={{ color: "var(--text)" }}>{nm(a.distance_nm)}</span>
      <span>ETA {etaText(a.distance_nm, a.velocity_kts)}</span>
      {inbound.length > 1 && <span>+{inbound.length - 1} more inbound</span>}
      <span className="fa-strip-spacer" />
      {rings.length > 0 && <span className="fa-hide-phone">{sentCount} of {rings.length} ring alerts sent</span>}
      <span className="mono fa-hide-phone" style={{ color: "var(--faint)" }}>Updated {clockSeconds(t.updatedAt)}</span>
    </div>
  );
}

function BottomTabs({ pathname }: { pathname: string }) {
  const [moreOn, setMoreOn] = useState<string | null>(null);
  const more = moreOn === pathname;
  const setMore = (next: boolean | ((v: boolean) => boolean)) =>
    setMoreOn((cur) => ((typeof next === "function" ? next(cur === pathname) : next) ? pathname : null));

  const tabs = [
    { href: "/app", label: "Home", icon: Home },
    { href: "/app/map", label: "Map", icon: MapIcon },
    { href: "/app/aircraft", label: "Aircraft", icon: Plane },
    { href: "/app/alerts", label: "Alerts", icon: Bell },
  ];
  const inMore = ["/app/airport", "/app/integrations", "/app/logs", "/app/ground-station"].some((h) => isActive(pathname, h));

  return (
    <>
      <nav className="fa-tabs" aria-label="Sections">
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="fa-tab" aria-current={isActive(pathname, href) ? "page" : undefined}>
            <Icon size={21} aria-hidden="true" />{label}
          </Link>
        ))}
        <button className="fa-tab" aria-current={inMore ? "page" : undefined} aria-expanded={more} onClick={() => setMore((v) => !v)}>
          <MoreHorizontal size={21} aria-hidden="true" />More
        </button>
      </nav>
      {more && (
        <div className="fa-overlay fa-only-phone" style={{ alignItems: "flex-end", padding: 0, zIndex: 1400 }} onClick={() => setMore(false)}>
          <div className="fa-sheet" onClick={(e) => e.stopPropagation()}>
            <Link href="/app/airport">Airport</Link>
            <Link href="/app/integrations">Integrations</Link>
            <Link href="/app/logs">Logs</Link>
            <Link href="/app/ground-station">Ground Station</Link>
            <Link href="/dashboard">Account and billing</Link>
            <button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
          </div>
        </div>
      )}
    </>
  );
}
