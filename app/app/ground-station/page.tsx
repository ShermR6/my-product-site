"use client";

// Ground Station: the person's own receiver. Is it up, what does it hear,
// how far does it reach.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTracker } from "../_lib/store";
import { api } from "../_lib/tracker";
import { ago, duration, parseUtc } from "../_lib/format";
import type { FeederStatus, GroundRange, GroundStatus } from "../_lib/types";
import { Card, PageHead } from "../_components/kit";
import DeviceKey from "../_components/DeviceKey";

export default function GroundStationPage() {
  const t = useTracker();
  const [range, setRange] = useState<GroundRange | null>(null);
  // Without a plan the app polls nothing, so this page asks after the
  // receiver itself: someone setting one up to feed needs to see it arrive.
  const [own, setOwn] = useState<GroundStatus | null>(null);
  const noPlan = t.groundEnabled === false;
  const reload = t.reload;

  useEffect(() => {
    if (!noPlan) return;
    let live = true;
    const load = () => api<GroundStatus>("ground/status").then((s) => {
      if (!live) return;
      setOwn(s);
      // A feeding receiver's first report starts the plan: leave the preview.
      if (s.feeder && s.feeder.plan !== "none") reload();
    }).catch(() => {});
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, 15_000);
    return () => { live = false; clearInterval(id); };
  }, [noPlan, reload]);

  useEffect(() => {
    if (t.groundEnabled !== true) return;
    let live = true;
    const load = () => api<GroundRange>("ground/range").then((r) => { if (live) setRange(r); }).catch(() => {});
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, 60_000);
    return () => { live = false; clearInterval(id); };
  }, [t.groundEnabled]);

  if (noPlan) {
    const seen = own?.last_seen_seconds != null;
    return (
      <div className="fa-page">
        <PageHead title="Ground Station" sub="Your own receiver at the field. Feed adsb.lol with it and earn the free feeder plan.">
          {seen && <span className={`fa-pilltag ${own?.online ? "" : "warn"}`}><span className={`fa-dot ${own?.online ? "" : "warn"}`} />{own?.online ? "Receiver online" : "Receiver offline"}</span>}
        </PageHead>
        <div className="fa-grid fa-cols-2">
          <Card title="What it adds">
            <div className="fa-kv"><span>Position updates</span><span>About once a second</span></div>
            <div className="fa-kv"><span>Low-altitude coverage</span><span>Down to the runway</span></div>
            <div className="fa-kv"><span>Depends on the public network</span><span>No</span></div>
            <p className="fa-note" style={{ marginTop: 12, lineHeight: 1.6 }}>
              A small receiver and antenna at your airport hears your aircraft&apos;s transponder directly, so alerts keep coming on short final where public coverage often drops out.
            </p>
          </Card>
          <Card title="Set one up">
            <div className="fa-kv" style={{ borderTop: "none" }}><span>1</span><span>A Raspberry Pi with an ADS-B radio and antenna</span></div>
            <div className="fa-kv"><span>2</span><span>Paste the install command below into the Pi</span></div>
            <div className="fa-kv"><span>3</span><span>It shows up here within a minute</span></div>
            <p className="fa-note" style={{ margin: "12px 0 16px", lineHeight: 1.6 }}>
              You do not need a plan to set one up. The installer also feeds adsb.lol, the open network FinalPing draws on, and a receiver that keeps feeding earns the free feeder plan: up to 5 aircraft, with alerts to Discord, email and Slack.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="fa-btn primary" href="/groundstationkit">See the kit</Link>
              <Link className="fa-btn" href="/groundstationsetup">Setup guide</Link>
            </div>
          </Card>
        </div>
        <div style={{ marginTop: 16 }}><FeederCard feeder={own?.feeder ?? null} feedingNow={own?.stats?.feeding} online={!!own?.online} /></div>
        <div style={{ marginTop: 16 }}><DeviceKey /></div>
      </div>
    );
  }

  const g = t.ground;
  const stats = g?.stats ?? null;
  const bearings = range?.range_nm ?? null;
  const mapped = bearings ? bearings.filter((n) => n > 0) : [];
  const maxRange = mapped.length ? Math.max(...mapped) : null;
  const step = bearings?.length ? 360 / bearings.length : 10;
  const bestIdx = bearings && maxRange != null ? bearings.indexOf(maxRange) : -1;
  const minRange = mapped.length ? Math.min(...mapped) : null;
  const worstIdx = bearings && minRange != null ? bearings.indexOf(minRange) : -1;
  const deg = (i: number) => `${String(Math.round(i * step)).padStart(3, "0")}°`;
  const rangeAt = parseUtc(range?.updated_at);

  return (
    <div className="fa-page">
      <PageHead title="Ground Station" sub="Your own receiver at the field. It hears your aircraft directly, about once a second.">
        <span className={`fa-pilltag ${g?.online ? "" : "warn"}`}><span className={`fa-dot ${g?.online ? "" : "warn"}`} />{g ? (g.online ? "Online" : "Offline") : "Checking…"}</span>
        <Link className="fa-btn" href="/groundstationsetup">Setup guide</Link>
      </PageHead>

      {g && !g.online && (
        <div className="fa-banner warn" role="status">
          {g.last_seen_seconds == null
            ? "This receiver has never checked in. Follow the setup guide to bring it online."
            : `No word from the receiver for ${ago(g.last_seen_seconds).replace(" ago", "")}. Check its power and internet. Alerts continue from the public network meanwhile.`}
        </div>
      )}

      <div className="fa-grid fa-cols-4">
        <Card><div className="fa-stat-label">Last heard</div><div className="fa-stat">{g?.last_seen_seconds != null ? ago(g.last_seen_seconds).replace(" ago", "") : "—"}<small>{g?.last_seen_seconds != null ? "ago" : ""}</small></div></Card>
        <Card><div className="fa-stat-label">Aircraft in view</div><div className="fa-stat">{stats?.aircraft_count ?? "—"}</div></Card>
        <Card><div className="fa-stat-label">Max range</div><div className="fa-stat">{maxRange != null ? maxRange.toFixed(1) : "—"}<small>{maxRange != null ? "nm" : ""}</small></div></Card>
        <Card><div className="fa-stat-label">Uptime</div><div className="fa-stat" style={{ fontSize: 28, paddingTop: 6 }}>{stats?.uptime_s != null ? duration(stats.uptime_s) : "—"}</div></Card>
      </div>

      <div className="fa-split" style={{ marginTop: 16 }}>
        <Card title="Receiver range" note={bearings ? `${mapped.length} of ${bearings.length} bearings mapped` : undefined}>
          {!bearings || mapped.length === 0 ? (
            <div className="fa-empty"><strong>No range mapped yet</strong>The shape fills in as aircraft fly through each bearing.</div>
          ) : (
            <div className="fa-range">
              <RangePlot bearings={bearings} max={maxRange ?? 1} />
              <div style={{ minWidth: 0 }}>
                <div className="fa-kv" style={{ borderTop: "none" }}><span>Best bearing</span><span className="mono">{deg(bestIdx)} · {maxRange?.toFixed(1)} nm</span></div>
                <div className="fa-kv"><span>Weakest bearing</span><span className="mono">{deg(worstIdx)} · {minRange?.toFixed(1)} nm</span></div>
                <div className="fa-kv"><span>Coverage</span><span className="mono">{Math.round((mapped.length / bearings.length) * 100)}% mapped</span></div>
                {rangeAt && <div className="fa-kv"><span>Updated</span><span className="mono">{ago((t.now - rangeAt.getTime()) / 1000)}</span></div>}
                <p className="fa-note" style={{ marginTop: 12, lineHeight: 1.6 }}>A dent usually means a building or trees in the way. North is up.</p>
              </div>
            </div>
          )}
        </Card>

        <Card title="Receiver">
          <div className="fa-kv"><span>Last heartbeat</span><span className="mono">{g?.last_seen_seconds != null ? ago(g.last_seen_seconds) : "Never"}</span></div>
          <div className="fa-kv"><span>Software</span><span className="mono">{stats?.version ? `v${stats.version}` : "—"}</span></div>
          <div className="fa-kv"><span>Messages per second</span><span className="mono">{stats?.msg_rate != null ? Math.round(stats.msg_rate) : "—"}</span></div>
          <div className="fa-kv"><span>Airport</span><span>{[t.airport?.airport_code, t.airport?.airport_name].filter(Boolean).join(" · ") || "—"}</span></div>
          <div className="fa-kv"><span>adsb.lol feed</span><span>{stats?.feeding === true ? "Feeding" : stats?.feeding === false ? "Not feeding" : "—"}</span></div>
          <div className="fa-kv"><span>MLAT</span><span>{stats?.mlat === true ? (stats.mlat_peers ? `On · in sync with ${stats.mlat_peers} receiver${stats.mlat_peers === 1 ? "" : "s"}` : "On · no receivers in sync yet") : stats?.mlat === false ? "Off" : "—"}</span></div>
          {stats?.mlat === false && g?.online && <p className="fa-note" style={{ marginTop: 10, lineHeight: 1.6 }}>MLAT is off because adsb.lol does not know where your antenna is. Enter its position in the install card below and run the command on the Pi.</p>}
          {!stats && g?.online && <p className="fa-note" style={{ marginTop: 10 }}>Version, uptime and message rate appear once the receiver updates itself to software 3.7.</p>}
        </Card>
      </div>

      <div style={{ marginTop: 16 }}><FeederCard feeder={g?.feeder ?? null} feedingNow={stats?.feeding} online={!!g?.online} /></div>
      <div style={{ marginTop: 16 }}><DeviceKey /></div>
    </div>
  );
}

/** Where the account stands on the free plan for feeding adsb.lol. */
function FeederCard({ feeder, feedingNow, online }: { feeder: FeederStatus | null; feedingNow: boolean | undefined; online: boolean }) {
  const needed = feeder?.days_needed ?? 5;
  const windowDays = feeder?.window_days ?? 7;
  const counted = Math.min(feeder?.days_counted ?? 0, windowDays);
  const plan = feeder?.plan ?? "none";
  const perDayH = Math.round((feeder?.minutes_per_day ?? 360) / 60);
  const today = feeder?.minutes_today ?? 0;
  const day = (iso: string | null | undefined) => {
    const d = iso ? new Date(`${iso}T00:00:00Z`) : null;
    return d && !isNaN(d.getTime()) ? d.toLocaleDateString([], { month: "short", day: "numeric", timeZone: "UTC" }) : null;
  };
  const until = day(feeder?.valid_until);
  const since = day(feeder?.since);
  // A new feeder is credited the days before its first feed.
  const credited = !!feeder && feeder.days_fed < counted;
  const device = feeder?.device ?? null;
  const taken = device?.linked === false;
  const whyNot =
    device?.why === "no_feed_client" ? "This receiver has no adsb.lol feed of its own. Run the install command below again to add it."
    : device?.why === "no_data" ? "The adsb.lol feed is connected but carries no data. Check that the radio is plugged in."
    : "adsb.lol is not getting a feed from this receiver. Run the install command below again to repair it.";

  const lead =
    plan === "feeder" ? "You are on the free feeder plan while this receiver keeps feeding adsb.lol: up to 5 aircraft, with alerts to Discord, email and Slack. The paid plan covers up to 15 aircraft, with texts and every other channel."
    : plan === "paid" && feeder?.qualifies ? "You are on the paid plan, and this receiver feeds enough to earn the free feeder plan. If the paid plan ends, the feeder plan takes over."
    : plan === "paid" ? `You are on the paid plan. A receiver that feeds adsb.lol for ${perDayH} hours a day, on ${needed} of every ${windowDays} days, earns the free feeder plan.`
    : `Feed adsb.lol for ${perDayH} hours a day, on ${needed} of every ${windowDays} days, and get the feeder plan free: up to 5 aircraft, with alerts to Discord, email and Slack. A new receiver gets it from its first report.`;

  return (
    <Card title="Feeder plan" note={plan === "feeder" ? "Active" : feeder?.qualifies ? "Earned" : "Not earned yet"}>
      <p className="fa-note" style={{ lineHeight: 1.6, marginBottom: 14 }}>{lead}</p>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }} role="img" aria-label={`${counted} of the last ${windowDays} days count. ${needed} are needed.`}>
        {Array.from({ length: windowDays }, (_, i) => (
          <span key={i} style={{ flex: 1, height: 8, borderRadius: 3, background: i < counted ? "#FAFAFA" : "#242424", marginRight: i === needed - 1 && needed < windowDays ? 8 : 0 }} />
        ))}
      </div>
      <div className="fa-kv" style={{ borderTop: "none" }}><span>Days that count, last {windowDays}</span><span className="mono">{counted} of {windowDays} · {needed} needed</span></div>
      <div className="fa-kv"><span>Today</span><span className="mono">{today >= perDayH * 60 ? "Counted" : `${duration(today * 60)} fed · counts at ${perDayH} h`}</span></div>
      <div className="fa-kv"><span>Feeding adsb.lol now</span><span>{feedingNow === true ? "Yes" : feedingNow === false ? "No" : "—"}</span></div>
      {until && <div className="fa-kv"><span>{plan === "feeder" ? "Covered through" : "Would cover through"}</span><span className="mono">{until}</span></div>}
      {device?.model && <div className="fa-kv"><span>Receiver</span><span>{device.model}</span></div>}
      {taken && (
        <div className="fa-banner warn" role="status" style={{ marginTop: 12, marginBottom: 0, display: "block", lineHeight: 1.6 }}>
          <strong>This receiver already earns the feeder plan for another FinalPing account.</strong> One receiver earns it for one account, so its feeding does not count here. A receiver that stops feeding for its old account is free again after 14 days. If that is not what happened, contact us.
        </div>
      )}
      {credited && since && (
        <p className="fa-note" style={{ marginTop: 10, lineHeight: 1.6 }}>The days before your first feed on {since} count in your favour, once. After that it is the days the receiver really fed.</p>
      )}
      {feedingNow === false && online && (
        <p className="fa-note" style={{ marginTop: 10, lineHeight: 1.6 }}>{whyNot}</p>
      )}
      {online && device?.linked == null && device?.why == null && (
        <p className="fa-note" style={{ marginTop: 10, lineHeight: 1.6 }}>The feeder plan needs receiver software 4.0, which says which receiver is feeding. Yours updates itself within the hour.</p>
      )}
    </Card>
  );
}

/** Polar plot of how far the receiver hears in each direction. */
function RangePlot({ bearings, max }: { bearings: number[]; max: number }) {
  const R = 120;
  const C = 140;
  const step = (2 * Math.PI) / bearings.length;
  const at = (angle: number, nm: number) => {
    const r = (Math.max(nm, 0) / max) * R;
    return `${(C + Math.sin(angle) * r).toFixed(1)} ${(C - Math.cos(angle) * r).toFixed(1)}`;
  };
  // One wedge per mapped bearing, so a bearing with no data is a gap, not a spike to the center.
  const wedge = (i: number, nm: number) => {
    const r = ((nm / max) * R).toFixed(1);
    return `M${C} ${C} L${at((i - 0.5) * step, nm)} A${r} ${r} 0 0 1 ${at((i + 0.5) * step, nm)} Z`;
  };
  const mid = max / 2;
  return (
    <svg viewBox="0 0 280 280" width="100%" style={{ maxWidth: 300, display: "block", margin: "0 auto" }} role="img"
      aria-label={`Receiver range by bearing, up to ${max.toFixed(1)} nautical miles`}>
      <circle cx={C} cy={C} r={R} fill="none" stroke="#2A2A2A" />
      <circle cx={C} cy={C} r={R / 2} fill="none" stroke="#222222" strokeDasharray="3 4" />
      <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="#1C1C1C" />
      <line x1={C - R} y1={C} x2={C + R} y2={C} stroke="#1C1C1C" />
      {bearings.map((n, i) => (n > 0 ? <path key={i} d={wedge(i, n)} fill="rgba(250,250,250,0.16)" stroke="#FAFAFA" strokeWidth="1" strokeLinejoin="round" /> : null))}
      <circle cx={C} cy={C} r="3.5" fill="#FAFAFA" />
      <text x={C} y={C - R - 6} textAnchor="middle" fontFamily="var(--mono)" fontSize="10.5" fill="#8A8A8A">N</text>
      <text x={C + R + 4} y={C + 4} fontFamily="var(--mono)" fontSize="10.5" fill="#8A8A8A">E</text>
      <text x={C} y={C + R + 14} textAnchor="middle" fontFamily="var(--mono)" fontSize="10.5" fill="#8A8A8A">S</text>
      <text x={C - R - 4} y={C + 4} textAnchor="end" fontFamily="var(--mono)" fontSize="10.5" fill="#8A8A8A">W</text>
      <text x={C + 4} y={C - R / 2 - 3} fontFamily="var(--mono)" fontSize="9.5" fill="#737373">{mid.toFixed(1)} nm</text>
      <text x={C + 4} y={C - R + 12} fontFamily="var(--mono)" fontSize="9.5" fill="#737373">{max.toFixed(1)} nm</text>
    </svg>
  );
}
