"use client";

// Dashboard: what is happening right now, in one sentence, then the detail.

import Link from "next/link";
import { useTracker } from "./_lib/store";
import {
  ago, airportRings, channelLabel, clock, etaMinutes, eventLabel, groupEvents, inboundOf, nm, parseUtc, planOf,
  recentAlertsFor, ringsFor, stageOf, STAGE_LABEL,
} from "./_lib/format";
import { Card, PageHead, Tail } from "./_components/kit";
import ApproachLadder, { ladderSteps } from "./_components/ApproachLadder";
import RingMap from "./_components/RingMap";

function plural(n: number, one: string, many = one + "s") {
  return `${n} ${n === 1 ? one : many}`;
}

export default function DashboardPage() {
  const t = useTracker();
  const inbound = inboundOf(t.live, t.aircraft, t.airport);
  const lead = inbound[0] ?? null;
  const airborne = t.live.filter((a) => !a.on_ground);
  const place = t.airport?.airport_name || t.airport?.airport_code || "";
  const today = new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });

  // The headline.
  let title = "All quiet.";
  let sub = "";
  const leadRings = lead ? ringsFor(lead.tail_number, t.aircraft, t.airport) : airportRings(t.airport);
  const leadSent = lead ? recentAlertsFor(lead.tail_number, t.recent) : new Map<string, Date>();
  const steps = ladderSteps(leadRings, leadSent, lead);

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
      m ? `About ${plural(m, "minute")} away.` : "Inbound.",
      leadRings.length ? `${plural(done, "ring alert")} sent, ${left} to go.` : "",
      inbound.length > 1 ? `${plural(inbound.length - 1, "more aircraft", "more aircraft")} inbound.` : "",
    ].filter(Boolean).join(" ");
  } else if (airborne.length === 1) {
    title = `${airborne[0].tail_number} is airborne.`;
    sub = `${nm(airborne[0].distance_nm)} from ${t.airport?.airport_code ?? "the airport"}, not inbound yet.`;
  } else if (airborne.length > 1) {
    title = `${airborne.length} aircraft airborne.`;
    sub = "None inbound right now.";
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
  const leadAge = lead ? Math.max(0, (t.now - (parseUtc(lead.last_seen)?.getTime() ?? t.now)) / 1000) : null;

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
        <div className={`fa-mapcard ${t.hasAirport && leadRings.length > 0 ? "has-ladder" : ""}`}>
          <div className="fa-mapcard-art">
            <RingMap airport={t.airport} rings={leadRings} live={t.live} focusTail={lead?.tail_number ?? airborne[0]?.tail_number} bottomPad={t.hasAirport && leadRings.length > 0 ? 84 : 0} />
          </div>
          <div className="fa-map-chip" style={{ position: "absolute", left: 16, top: 16 }}>
            <span className={`fa-dot ${lead ? "live" : "hollow"}`} style={{ width: 6, height: 6 }} />
            {lead
              ? `Live · ${lead.source === "ground_station" ? "Ground Station" : "Network"} · position ${ago(leadAge).replace(" ago", "")} old`
              : t.live.length ? `${plural(t.live.length, "aircraft", "aircraft")} in view` : "No tracked aircraft in view"}
          </div>
          {t.hasAirport && leadRings.length > 0 && (
            <div className="fa-ladder-wrap">
              <ApproachLadder steps={steps} />
            </div>
          )}
        </div>

        <Card title="Today" note={plural(events.length, "event")} style={{ display: "flex", flexDirection: "column" }}>
          {events.length === 0 && <div className="fa-row fa-note" style={{ padding: "16px 0" }}>No alerts yet today.</div>}
          {events.slice(0, 6).map((e, i) => (
            <div key={e.key} className="fa-row" style={{ alignItems: "flex-start", gap: 14, padding: "9px 0" }}>
              <span className="mono" style={{ width: 42, fontSize: 12, paddingTop: 1, color: i === 0 && lead?.tail_number === e.tail ? "var(--accent)" : "var(--faint)" }}>{clock(e.time)}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5 }}><Tail>{e.tail}</Tail> {eventLabel(e.alertType).toLowerCase()}</div>
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
                <span className={`fa-dot ${hot ? "live" : stage === "airborne" ? "" : "hollow"}`} style={{ width: 8, height: 8 }} />
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
