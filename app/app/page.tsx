"use client";

// Dashboard: what is happening right now, in one sentence, then the detail.

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Box, Crosshair, Maximize2 } from "lucide-react";
import { useTracker } from "./_lib/store";
import {
  ago, airportRings, channelLabel, clock, etaMinutes, eventLabel, groupEvents, inboundOf, isLost, nm, parseUtc, planOf,
  recentAlertsFor, ringsFor, runwayFor, stageOf, STAGE_LABEL, whole,
} from "./_lib/format";
import { Card, PageHead, Tail } from "./_components/kit";
import ApproachLadder, { ladderSteps } from "./_components/ApproachLadder";
import Plane3D from "./_components/Plane3D";
import { paintOf, usePaints } from "./_lib/paint";
import { mapPlanes } from "./_lib/mapPlanes";

// The same map as the Live Map screen, in a card.
const MapGL = dynamic(() => import("./_components/MapGL"), {
  ssr: false,
  loading: () => <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Loading map…</div>,
});

function plural(n: number, one: string, many = one + "s") {
  return `${n} ${n === 1 ? one : many}`;
}

export default function DashboardPage() {
  const t = useTracker();
  const saved = usePaints();
  const [picked, setPicked] = useState<string | null>(null);
  const [tilt, setTilt] = useState(false);
  const [fitSeq, setFitSeq] = useState(0);
  const paints = Object.fromEntries(t.aircraft.map((a) => [a.tail_number, paintOf(a.tail_number, saved)]));
  const inbound = inboundOf(t.live, t.aircraft, t.airport);
  const lead = inbound[0] ?? null;
  const airborne = t.live.filter((a) => !a.on_ground && !isLost(a, t.now));
  const lost = t.live.filter((a) => isLost(a, t.now));
  const place = t.airport?.airport_name || t.airport?.airport_code || "";
  const today = new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });

  // The headline.
  let title = "All quiet.";
  let sub = "";
  const leadRings = lead ? ringsFor(lead.tail_number, t.aircraft, t.airport) : airportRings(t.airport);
  const leadSent = lead ? recentAlertsFor(lead.tail_number, t.recent) : new Map<string, Date>();
  const steps = ladderSteps(leadRings, leadSent, lead);
  const leadRunway = lead ? runwayFor(lead, t.airport?.runway_info) : null;

  // The map follows whichever aircraft was clicked, or else the one closest in.
  const focus = (picked ? t.live.find((a) => a.tail_number === picked) : null) ?? lead;
  const focusRings = focus ? ringsFor(focus.tail_number, t.aircraft, t.airport) : airportRings(t.airport);
  const focusSteps = focus === lead ? steps : ladderSteps(focusRings, recentAlertsFor(focus!.tail_number, t.recent), focus);
  const focusStage = focus ? stageOf(focus, focusRings) : null;
  const focusHot = focusStage === "final" || focusStage === "inbound";
  const focusAge = focus ? Math.max(0, (t.now - (parseUtc(focus.last_seen)?.getTime() ?? t.now)) / 1000) : null;

  const lat = Number(t.airport?.latitude);
  const lon = Number(t.airport?.longitude);
  const center = useMemo(() => (t.airport && isFinite(lat) && isFinite(lon) ? { lat, lon } : null), [t.airport, lat, lon]);
  const planes = mapPlanes(t.live, t.aircraft, t.airport, saved);
  const landing = t.airport?.approach_corridor_enabled
    ? (t.airport.approach_runway_headings?.length ? t.airport.approach_runway_headings : t.airport.approach_runway_heading != null ? [t.airport.approach_runway_heading] : []).map(Number)
    : [];

  if (t.hasAirport === false) {
    title = "Pick your airport to start.";
    sub = "FinalPing needs to know where to watch before it can alert you.";
  } else if (t.aircraft.length === 0) {
    title = "Add your first aircraft.";
    sub = "Enter a tail number and FinalPing starts watching for it.";
  } else if (lead) {
    title = `${lead.tail_number} is ${lead.distance_nm.toFixed(1)} nm out.`;
    const m = etaMinutes(lead.distance_nm, lead.velocity_kts);
    const done = steps.filter((s) => s.key !== "landing" && s.state === "done").length;
    const left = steps.filter((s) => s.key !== "landing").length - done;
    sub = [
      m ? `About ${plural(m, "minute")} away${leadRunway ? `, lined up for runway ${leadRunway}` : ""}.` : leadRunway ? `Inbound, lined up for runway ${leadRunway}.` : "Inbound.",
      leadRings.length ? `${plural(done, "ring alert")} sent, ${left} to go.` : "",
      inbound.length > 1 ? `${plural(inbound.length - 1, "more aircraft", "more aircraft")} inbound.` : "",
    ].filter(Boolean).join(" ");
  } else if (airborne.length === 1) {
    title = `${airborne[0].tail_number} is airborne.`;
    sub = `${nm(airborne[0].distance_nm)} from ${t.airport?.airport_code ?? "the airport"}, not inbound yet.`;
  } else if (airborne.length > 1) {
    title = `${airborne.length} aircraft airborne.`;
    sub = "None inbound right now.";
  } else if (lost.length === 1) {
    title = `Lost track of ${lost[0].tail_number}.`;
    sub = `Last heard ${nm(lost[0].distance_nm)} from ${t.airport?.airport_code ?? "the airport"}, ${ago((t.now - (parseUtc(lost[0].last_seen)?.getTime() ?? t.now)) / 1000)}.`;
  } else {
    title = place ? `All quiet at ${t.airport?.airport_code ?? place}.` : "All quiet.";
    sub = `Watching ${plural(t.aircraft.length, "aircraft", "aircraft")}. You'll get an alert as soon as one heads in.`;
  }

  // Today.
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const events = groupEvents(t.recent.filter((n) => (parseUtc(n.sent_at)?.getTime() ?? 0) >= startOfDay.getTime()));

  // Delivery over the last 7 days (from the latest 200 notifications).
  const weekAgo = t.now - 7 * 86400000;
  const delivery = new Map<string, { ok: number; total: number }>();
  for (const n of t.recent) {
    if ((parseUtc(n.sent_at)?.getTime() ?? 0) < weekAgo) continue;
    const d = delivery.get(n.integration_type) ?? { ok: 0, total: 0 };
    d.total += 1;
    if (["sent", "success"].includes(String(n.status).toLowerCase())) d.ok += 1;
    delivery.set(n.integration_type, d);
  }

  const plan = planOf(t.me?.license_tier);

  // The hangar strip: whatever is flying first, then the rest, four across.
  const hangar = t.aircraft
    .map((ac) => {
      const lv = t.live.find((x) => x.tail_number === ac.tail_number);
      const stage = lv ? stageOf(lv, ringsFor(ac.tail_number, t.aircraft, t.airport)) : null;
      return { ac, lv, stage, hot: stage === "final" || stage === "inbound" };
    })
    .sort((a, b) => Number(b.hot) - Number(a.hot) || Number(!!b.lv && !b.lv.on_ground) - Number(!!a.lv && !a.lv.on_ground))
    .slice(0, 4);

  return (
    <div className="fa-page">
      <PageHead hero eyebrow={[today, place].filter(Boolean).join(" · ")} title={title} sub={sub}>
        {t.hasAirport === false ? (
          <Link className="fa-btn primary" href="/app/airport">Set up airport</Link>
        ) : (
          <>
            <Link className="fa-btn" href="/app/map">Open live map</Link>
            <Link className="fa-btn primary" href="/app/aircraft?add=1">Add aircraft</Link>
          </>
        )}
      </PageHead>

      <div className="fa-split">
        <div className="fa-mapcard stack">
          <div className="fa-mapcard-art">
            <MapGL
              center={center} code={t.airport?.airport_code} rings={focusRings} planes={planes}
              selected={focus?.tail_number ?? null} onSelect={setPicked} fitSeq={fitSeq} tilt={tilt}
              runways={t.airport?.runway_info} approach={landing}
            />
            <div className="fa-map-chip" style={{ position: "absolute", zIndex: 450, left: 16, top: 16, maxWidth: "calc(100% - 190px)" }}>
              <span className={`fa-dot ${focusHot ? "live" : "hollow"}`} style={{ width: 6, height: 6, flex: "none" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {focus
                  ? [
                      focus.tail_number,
                      focus.on_ground ? "On the ground" : [whole(focus.velocity_kts, "kt"), whole(focus.altitude_ft_msl, "ft")].filter((v) => v !== "—").join(" · "),
                      focus.source === "ground_station" ? "Ground Station" : "Network",
                      `${ago(focusAge).replace(" ago", "")} old`,
                    ].filter(Boolean).join(" · ")
                  : t.live.length ? `${plural(t.live.length, "aircraft", "aircraft")} in view` : "No tracked aircraft in view"}
              </span>
            </div>
            <div className="fa-map-layers" style={{ left: "auto", right: 16 }}>
              <button className="fa-map-chip" aria-pressed={tilt} onClick={() => setTilt((v) => !v)} aria-label="Tilt the map for a 3D view">
                <Box size={13} aria-hidden="true" />3D
              </button>
              <button className="fa-map-chip" onClick={() => setFitSeq((n) => n + 1)} aria-label="Center on the airport">
                <Crosshair size={13} aria-hidden="true" />
              </button>
              <Link className="fa-map-chip" href="/app/map" aria-label="Open the full live map">
                <Maximize2 size={13} aria-hidden="true" />
              </Link>
            </div>
          </div>
          {t.hasAirport && focusRings.length > 0 && (
            <div className="fa-ladder-wrap">
              <ApproachLadder steps={focusSteps} />
            </div>
          )}
        </div>

        <Card title="Today" note={plural(events.length, "event")} style={{ display: "flex", flexDirection: "column" }}>
          {events.length === 0 && <div className="fa-row fa-note" style={{ padding: "16px 0" }}>No alerts yet today.</div>}
          {events.slice(0, 6).map((e, i) => (
            <div key={e.key} className="fa-row" style={{ alignItems: "flex-start", gap: 14, padding: "9px 0" }}>
              <span className="mono" style={{ width: 42, fontSize: 12, paddingTop: 1, color: i === 0 && lead?.tail_number === e.tail ? "var(--accent)" : "var(--faint)" }}>{clock(e.time)}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5 }}><span className="fa-paint-dot" style={{ background: paints[e.tail] ?? "var(--faint)", marginRight: 8 }} /><Tail>{e.tail}</Tail> {eventLabel(e.alertType).toLowerCase()}</div>
                <div style={{ fontSize: 12, color: "var(--faint)" }}>
                  {e.channels.join(" · ")}
                  {e.failed.length > 0 && <span style={{ color: "var(--warn)" }}>{e.channels.length ? " · " : ""}{e.failed.join(", ")} failed</span>}
                </div>
              </div>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ paddingTop: 10, borderTop: "1px solid #1E1E1E" }}>
            <Link className="fa-link" href="/app/logs">View all in Logs →</Link>
          </div>
        </Card>
      </div>

      {hangar.length > 0 && (
        <div className="fa-hangar" style={{ marginTop: 16 }}>
          {hangar.map(({ ac, lv, stage, hot }, i) => (
            <div key={ac.id} className="fa-hangar-item" style={hot ? { borderColor: "rgba(56,189,248,0.45)" } : undefined}>
              <Plane3D tail={ac.tail_number} type={ac.aircraft_type} color={paints[ac.tail_number]} height={132} start={-0.6 - i * 0.5} tag={false} />
              <Link href="/app/aircraft" className="fa-hangar-meta">
                <Tail>{ac.tail_number}</Tail>
                <span className="fa-note" style={{ color: hot ? "var(--accent)" : undefined }}>
                  {lv && !lv.on_ground ? `${nm(lv.distance_nm)} · ${STAGE_LABEL[stage!].toLowerCase()}` : stage ? STAGE_LABEL[stage] : ac.aircraft_type || "Not in view"}
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="fa-grid fa-cols-3" style={{ marginTop: 16 }}>
        <Card title="Aircraft" note={plan.aircraft ? `${t.aircraft.length} of ${plan.aircraft}` : `${t.aircraft.length}`}>
          {t.aircraft.length === 0 && (
            <div className="fa-row fa-note">None yet. <Link className="fa-link" href="/app/aircraft?add=1">Add one</Link></div>
          )}
          {t.aircraft.slice(0, 6).map((ac) => {
            const lv = t.live.find((x) => x.tail_number === ac.tail_number);
            const stage = lv ? stageOf(lv, ringsFor(ac.tail_number, t.aircraft, t.airport)) : null;
            const hot = stage === "final" || stage === "inbound";
            return (
              <Link key={ac.id} href="/app/aircraft" className="fa-row">
                <span className="fa-paint-dot" style={{ background: paints[ac.tail_number] }} />
                <span className="mono" style={{ width: 76, fontWeight: 600 }}>{ac.tail_number}</span>
                <span style={{ flex: 1, fontSize: 13, color: hot ? "var(--accent)" : "var(--muted)" }}>{stage ? STAGE_LABEL[stage] : "Not in view"}</span>
                <span className="mono" style={{ fontSize: 13, color: lv && !lv.on_ground ? "var(--text)" : "var(--muted)" }}>{lv && !lv.on_ground ? nm(lv.distance_nm) : ""}</span>
              </Link>
            );
          })}
          {t.aircraft.length > 6 && <div className="fa-row"><Link className="fa-link" href="/app/aircraft">All {t.aircraft.length} aircraft →</Link></div>}
        </Card>

        <Card title="Alert delivery" note="Last 7 days">
          {delivery.size === 0 && (
            <div className="fa-row fa-note">
              {t.integrations.length ? "No alerts sent this week." : <>Nowhere to send alerts yet. <Link className="fa-link" href="/app/integrations">Connect a channel</Link></>}
            </div>
          )}
          {[...delivery.entries()].map(([type, d]) => {
            const pct = d.total ? Math.round((d.ok / d.total) * 100) : 100;
            const bad = d.ok < d.total;
            return (
              <div key={type} className="fa-row">
                <span style={{ width: 84, fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{channelLabel(type)}</span>
                <span style={{ flex: 1, height: 4, borderRadius: 2, background: `linear-gradient(90deg, var(--text) 0%, var(--text) ${pct}%, var(--warn) ${pct}%)` }} />
                <span className="mono" style={{ width: 80, textAlign: "right", fontSize: 13, color: bad ? "var(--warn)" : "var(--text)" }}>{d.ok} / {d.total}</span>
              </div>
            );
          })}
        </Card>

        <Card
          title="Ground Station"
          note={t.groundEnabled === false ? "Add-on" : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--text-2)" }}>
              <span className={`fa-dot ${t.ground?.online ? "" : "hollow"}`} style={{ width: 6, height: 6 }} />{t.ground?.online ? "Online" : "Offline"}
            </span>
          )}
        >
          {t.groundEnabled === false ? (
            <div className="fa-row fa-note" style={{ display: "block", lineHeight: 1.55 }}>
              Your own receiver at the field: positions every second instead of every few.{" "}
              <Link className="fa-link" href="/app/ground-station">See how it works</Link>
            </div>
          ) : (
            <>
              <div className="fa-kv"><span>Last heard</span><span className="mono">{t.ground?.last_seen_seconds != null ? ago(t.ground.last_seen_seconds) : "Never"}</span></div>
              <div className="fa-kv"><span>Aircraft in view</span><span className="mono">{t.ground?.stats?.aircraft_count ?? "—"}</span></div>
              <div className="fa-kv"><span>Messages</span><span className="mono">{t.ground?.stats?.msg_rate != null ? `${Math.round(t.ground.stats.msg_rate)} / s` : "—"}</span></div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
