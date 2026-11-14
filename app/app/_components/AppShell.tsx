"use client";

// The web app's frame: top bar with the section pills, the live strip, the
// page, and bottom tabs on a phone. Also the states that replace the page
// entirely: still loading, plan expired, signed out. An account with no plan
// yet sees the whole app as a read-only preview.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, CreditCard, Home, LogOut, Map as MapIcon, MoreHorizontal, Plane, Globe } from "lucide-react";
import { TrackerProvider, useTracker } from "../_lib/store";
import { PAYWALL_EVENT } from "../_lib/tracker";
import { clockSeconds, etaText, inboundOf, nm, planOf, recentAlertsFor, ringsFor, ringKey, stageOf, STAGE_LABEL } from "../_lib/format";
import { Logo, Btn, Tail } from "./kit";
import { PLAN as OFFER } from "@/lib/plan";

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

// Preview lock. These are the things a person can operate on a page...
const CONTROLS = "button, input, select, textarea, label, summary, [role='button'], [role='switch'], [role='checkbox'], [role='tab'], [contenteditable='true']";
// ...and these are the places where operating them only changes the view.
const VIEW_ONLY = ".fa-mapcard, .fa-map-full";
// Links inside a page that exist to start setting something up ("Set up
// airport", "Add one", "Connect a channel"). In preview they open the trial
// prompt where they are instead of going to a screen that cannot be used.
const SETUP_LINKS = "a[href^='/app/airport'], a[href^='/app/integrations'], a[href*='add=1']";

/**
 * In preview the page can be read, scrolled and navigated, but its controls do
 * nothing except open the trial prompt, and neither do its setup links. Other
 * links still work. The listeners sit in the capture phase, so the page's own
 * handlers never see the event.
 */
function usePreviewLock(active: boolean) {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !root) return;

    const controlOf = (e: Event) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return null;
      const link = target.closest(SETUP_LINKS);
      if (link && root.contains(link)) return link;
      const el = target.closest(CONTROLS);
      return el && root.contains(el) && !el.closest(VIEW_ONLY) ? el : null;
    };
    const ask = () => window.dispatchEvent(new Event(PAYWALL_EVENT));
    const refuse = (e: Event, el: Element) => {
      e.preventDefault();
      e.stopPropagation();
      if (el instanceof HTMLElement) el.blur();
    };

    // Stops focus, and a dropdown opening, before the click arrives.
    const onDown = (e: Event) => { const el = controlOf(e); if (el) refuse(e, el); };
    const onClick = (e: Event) => { const el = controlOf(e); if (el) { refuse(e, el); ask(); } };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.key === "Escape") return;
      const el = controlOf(e);
      if (el) { refuse(e, el); ask(); }
    };
    // Typing by any route (a phone keyboard, paste, drop) into a field that
    // got focus on its own. Focus alone asks nothing: a page may focus a
    // field as it opens, and that is not the person trying to change it.
    const onInput = (e: Event) => { const el = controlOf(e); if (el) { refuse(e, el); ask(); } };

    root.addEventListener("mousedown", onDown, true);
    root.addEventListener("click", onClick, true);
    root.addEventListener("keydown", onKey, true);
    root.addEventListener("auxclick", onClick, true);
    root.addEventListener("beforeinput", onInput, true);
    return () => {
      root.removeEventListener("mousedown", onDown, true);
      root.removeEventListener("click", onClick, true);
      root.removeEventListener("keydown", onKey, true);
      root.removeEventListener("auxclick", onClick, true);
      root.removeEventListener("beforeinput", onInput, true);
    };
  }, [active, root]);

  return setRoot;
}

function Frame({ children }: { children: React.ReactNode }) {
  const t = useTracker();
  const pathname = usePathname() ?? "/app";
  const preview = t.me?.license_tier === "free";
  const lockRef = usePreviewLock(preview);

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
      {preview ? <Preview /> : <LiveStrip />}
      <main className="fa-main" ref={lockRef}>
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

/** Sends them to Stripe to start the trial; to the pricing page if it is already used. */
function useStartTrial() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billing: "monthly" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) { window.location.href = data.url; return; }
      // Trial already used (409): the pricing page is where they subscribe.
      if (res.status === 409) { window.location.href = "/pricing"; return; }
      setNote(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setNote("Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  return { busy, note, start };
}

/**
 * No plan yet: a bar that says this is a preview, and the prompt that opens
 * when they try to change something (the tracker client fires PAYWALL_EVENT).
 */
function Preview() {
  const trial = useStartTrial();
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    const open = () => setAsking(true);
    window.addEventListener(PAYWALL_EVENT, open);
    return () => window.removeEventListener(PAYWALL_EVENT, open);
  }, []);

  useEffect(() => {
    if (!asking) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAsking(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [asking]);

  return (
    <>
      <div className="fa-strip fa-trialbar" role="status">
        <span className="fa-trialbar-tag">Preview</span>
        <span>You can look around, but nothing can be changed.<span className="fa-hide-phone"> Start your {OFFER.trialDays}-day free trial to add aircraft and get alerts.</span></span>
        <span className="fa-strip-spacer" />
        <Btn small variant="primary" disabled={trial.busy} onClick={trial.start}>{trial.busy ? "Loading…" : "Start free trial"}</Btn>
      </div>
      {asking && (
        <div className="fa-overlay" onClick={() => setAsking(false)}>
          <div className="fa-modal" role="dialog" aria-modal="true" aria-labelledby="fa-trial-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="fa-trial-title">Start your {OFFER.trialDays}-day free trial</h2>
            <p className="fa-sub" style={{ marginTop: 0 }}>
              You can look around for as long as you like. To add aircraft, set your airport and get alerts, start a plan:
              ${OFFER.monthly.toFixed(2)} a month after the trial, or ${OFFER.yearlyPerMonth.toFixed(2)} a month billed yearly, with everything included.
            </p>
            <p className="fa-note" style={{ marginTop: 12 }}>The trial needs a card. Nothing is charged until it ends, and you can cancel before then.</p>
            {trial.note && <p className="fa-error" role="alert">{trial.note}</p>}
            <div className="fa-modal-actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <Link className="fa-link" href="/pricing">See what&apos;s included</Link>
              <span style={{ display: "flex", gap: 10 }}>
                <Btn onClick={() => setAsking(false)}>Not now</Btn>
                <Btn variant="primary" disabled={trial.busy} onClick={trial.start}>{trial.busy ? "Loading…" : "Start free trial"}</Btn>
              </span>
            </div>
          </div>
        </div>
      )}
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
          <Link href="/app/airport" className="fa-chip-btn" title="Airport settings"
            onClick={(e) => {
              // Preview with no airport: this is "set one up", which needs a plan.
              if (t.me?.license_tier === "free" && !t.airport) { e.preventDefault(); window.dispatchEvent(new Event(PAYWALL_EVENT)); }
            }}>
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
            {t.me && <div className="fa-note">{t.me.license_tier === "free" ? "Preview, no plan yet" : `${planOf(t.me.license_tier).name} plan`}</div>}
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
