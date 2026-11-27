"use client";

// Logs: every alert FinalPing has sent, newest first, under a heading per
// day. "By flight" groups each aircraft's alerts into flights (a takeoff
// starts one and it stays open, however long the aircraft is away, until it
// lands; without a takeoff, half an hour of quiet splits them); "Every
// alert" is the plain list. One alert sent to several channels is one entry
// with each channel's logo, and only a failed delivery stands out.

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleAlert, Check, Download, PlaneLanding, PlaneTakeoff, Target, X } from "lucide-react";
import { useTracker } from "../_lib/store";
import { api, errorText } from "../_lib/tracker";
import { airportRings, CHANNELS, channelLabel, clock, dayLabel, eventLabel, parseUtc, ringKey } from "../_lib/format";
import type { LogsPage, NotificationLog } from "../_lib/types";
import { Btn, Empty, PageHead, Tail } from "../_components/kit";
import ChannelIcon from "../_components/ChannelIcon";
import MultiSelect from "../_components/MultiSelect";
import { paintOf, usePaints } from "../_lib/paint";

const PAGE = 50;
const delivered = (n: NotificationLog) => ["sent", "success"].includes(String(n.status).toLowerCase());

function queryOf(page: number, limit: number, f: { aircraft: string[]; event: string[]; channel: string[] }) {
  const p = new URLSearchParams({ page: String(page), limit: String(limit) });
  // Each filter can hold several values; the backend takes them comma-separated.
  if (f.aircraft.length) p.set("aircraft", f.aircraft.join(","));
  if (f.event.length) p.set("alert_type", f.event.join(","));
  if (f.channel.length) p.set("integration", f.channel.join(","));
  return `notifications/logs?${p.toString()}`;
}

/** One alert: the same aircraft, event and moment, whichever channels it went to. */
type Alert = { key: string; at: Date; tail: string; type: string; message: string; sends: { channel: string; ok: boolean }[] };
type Flight = { key: string; tail: string; alerts: Alert[] };
type Day = { key: string; title: string; alerts: Alert[] };

function alertsOf(rows: NotificationLog[]): Alert[] {
  const map = new Map<string, Alert>();
  const out: Alert[] = [];
  for (const n of rows) {
    const at = parseUtc(n.sent_at);
    if (!at) continue;
    // A fan-out to several channels lands within a few seconds: two minutes is one alert.
    const key = `${n.aircraft_tail}|${n.alert_type}|${Math.floor(at.getTime() / 120_000)}`;
    let a = map.get(key);
    if (!a) {
      a = { key, at, tail: n.aircraft_tail, type: n.alert_type, message: n.message ?? "", sends: [] };
      map.set(key, a);
      out.push(a);
    }
    if (!a.sends.some((x) => x.channel === n.integration_type)) a.sends.push({ channel: n.integration_type, ok: delivered(n) });
  }
  return out;
}

function daysOf(alerts: Alert[]): Day[] {
  const out: Day[] = [];
  for (const a of alerts) {
    const key = a.at.toDateString();
    let d = out[out.length - 1];
    if (!d || d.key !== key) {
      const label = dayLabel(a.at);
      const date = a.at.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
      d = { key, title: label === "Today" || label === "Yesterday" ? `${label} · ${date}` : date, alerts: [] };
      out.push(d);
    }
    d.alerts.push(a);
  }
  return out;
}

const FLIGHT_QUIET_MS = 30 * 60_000;
/** After a takeoff the flight waits this long for its inbound alerts and landing:
 *  a lesson or cross-country is often an hour or more away from the rings. */
const FLIGHT_AWAY_MS = 10 * 60 * 60_000;

/** One day's alerts as flights, the one with the latest alert first. */
function flightsOf(alerts: Alert[]): Flight[] {
  const open = new Map<string, Flight>();
  const out: Flight[] = [];
  for (const a of [...alerts].reverse()) {
    let f = open.get(a.tail);
    const last = f?.alerts[f.alerts.length - 1];
    const quiet = last ? a.at.getTime() - last.at.getTime() : 0;
    const away = f?.alerts.some((x) => x.type === "takeoff") ? FLIGHT_AWAY_MS : FLIGHT_QUIET_MS;
    if (!f || a.type === "takeoff" || (quiet > away && a.type !== "landing")) {
      f = { key: a.key, tail: a.tail, alerts: [] };
      open.set(a.tail, f);
      out.push(f);
    }
    f.alerts.push(a);
    if (a.type === "landing") open.delete(a.tail);
  }
  for (const f of out) f.alerts.reverse();
  // Newest activity first: a flight that has just landed sits above one that
  // took off earlier and is still away.
  return out.sort((x, y) => y.alerts[0].at.getTime() - x.alerts[0].at.getTime());
}

function lasted(from: Date, to: Date): string {
  const m = Math.round((to.getTime() - from.getTime()) / 60_000);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
}

function flightSummary(f: Flight): { text: string; span: string } {
  const old = f.alerts[f.alerts.length - 1], neu = f.alerts[0];
  const up = f.alerts.find((a) => a.type === "takeoff");
  const down = f.alerts.find((a) => a.type === "landing");
  const rings = [...f.alerts].reverse().filter((a) => /nm$/.test(a.type)).map((a) => eventLabel(a.type).replace("Crossed ", ""));
  let text: string;
  const inbound = rings.length ? `, inbound ${rings.join(", ")}` : "";
  if (up && down) text = `Took off ${clock(up.at)}${inbound}, landed ${clock(down.at)}`;
  else if (up) text = `Took off ${clock(up.at)}${inbound}`;
  else if (down) text = (rings.length ? `Inbound ${rings.join(", ")}, ` : "") + `landed ${clock(down.at)}`;
  else text = rings.length ? `Inbound: ${rings.join(", ")}, no landing logged` : eventLabel(neu.type);
  const span = clock(old.at) === clock(neu.at) ? clock(old.at) : `${clock(old.at)}–${clock(neu.at)} · ${lasted(old.at, neu.at)}`;
  return { text, span };
}

const EMOJI = /[\p{Extended_Pictographic}️‍]/gu;

/** The useful part of the alert text: ETA, height, speed, airport. Falls back to
 *  the text itself (without emoji) when a custom wording does not say them. */
function detailOf(a: Alert): string {
  const m = a.message.replace(/\*\*/g, "");
  const eta = /ETA\s*~?\s*(\d+)\s*min/i.exec(m)?.[1];
  const alt = /Alt(?:itude)?\s*([\d,]+)\s*ft/i.exec(m)?.[1];
  const kt = /(\d+)\s*kts?\b/i.exec(m)?.[1];
  const field = /\b(?:at|from)\s+([A-Z0-9]{3,4})\b/.exec(m)?.[1];
  const ft = alt ? `${Number(alt.replace(/,/g, "")).toLocaleString()} ft` : null;
  if (a.type === "landing" && field) return `At ${field}`;
  if (a.type === "takeoff" && (field || ft)) return [field && `From ${field}`, ft, kt && `${kt} kt`].filter(Boolean).join(" · ");
  if (eta || ft) return [eta && `ETA ~${eta} min`, ft].filter(Boolean).join(" · ");
  return m.replace(EMOJI, "").replace(/\s*\n\s*/g, " · ").trim();
}

function EventBadge({ type }: { type: string }) {
  const Icon = type === "landing" ? PlaneLanding : type === "takeoff" ? PlaneTakeoff : Target;
  return (
    <span className={`fa-log-event${type === "landing" || type === "takeoff" ? " strong" : ""}`}>
      <Icon size={15} strokeWidth={1.9} aria-hidden="true" />{eventLabel(type)}
    </span>
  );
}

function Sends({ sends }: { sends: Alert["sends"] }) {
  return (
    <span className="fa-log-sends">
      {sends.map((x) => (
        <span key={x.channel} className={`fa-log-send${x.ok ? "" : " failed"}`} title={`${channelLabel(x.channel)}: ${x.ok ? "delivered" : "failed"}`}>
          <ChannelIcon type={x.channel} size={15} />
          {x.ok ? <Check size={13} aria-label="delivered" /> : <><CircleAlert size={13} aria-hidden="true" />Failed</>}
        </span>
      ))}
    </span>
  );
}

function csvCell(v: string) {
  // Stop spreadsheet apps treating a value as a formula.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export default function LogsPageView() {
  const t = useTracker();
  const [aircraft, setAircraft] = useState<string[]>([]);
  const [event, setEvent] = useState<string[]>([]);
  const [channel, setChannel] = useState<string[]>([]);
  const [rows, setRows] = useState<NotificationLog[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState<{ today: number; this_week: number; total: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const paints = usePaints();
  const [view, setViewState] = useState<"flight" | "all">("flight");
  // The view last picked, kept in this browser only.
  useEffect(() => {
    try {
      if (window.localStorage.getItem("fp-logs-view") === "all") setViewState("all");
    } catch { /* a convenience only */ }
  }, []);
  const setView = (v: "flight" | "all") => {
    setViewState(v);
    try { window.localStorage.setItem("fp-logs-view", v); } catch { /* a convenience only */ }
  };
  const days = useMemo(() => (rows ? daysOf(alertsOf(rows)) : []), [rows]);

  const filters = useMemo(() => ({ aircraft, event, channel }), [aircraft, event, channel]);
  const filterIcon = (type: string) => {
    const Icon = type === "landing" ? PlaneLanding : type === "takeoff" ? PlaneTakeoff : Target;
    return <Icon size={15} strokeWidth={1.9} aria-hidden="true" />;
  };

  const load = useCallback(async (p: number, f: typeof filters, append: boolean) => {
    setBusy(true); setErr("");
    try {
      const r = await api<LogsPage>(queryOf(p, PAGE, f));
      setRows((old) => (append && old ? [...old, ...r.logs.filter((n) => !old.some((o) => o.id === n.id))] : r.logs));
      setTotal(r.total); setPage(r.page); setPages(r.pages);
    } catch (e) {
      setErr(errorText(e));
      if (!append) setRows([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { load(1, filters, false); }, [filters, load]);
  useEffect(() => {
    let live = true;
    api<{ today: number; this_week: number; total: number }>("notifications/stats").then((s) => { if (live) setStats(s); }).catch(() => {});
    return () => { live = false; };
  }, []);

  // Choices for the filters: what is tracked now, plus anything in the recent history.
  const tails = useMemo(() => [...new Set([...t.aircraft.map((a) => a.tail_number), ...t.recent.map((n) => n.aircraft_tail)])].sort(), [t.aircraft, t.recent]);
  const eventTypes = useMemo(
    () => [...new Set([...airportRings(t.airport).map(ringKey), "landing", "takeoff", ...t.recent.map((n) => n.alert_type)])],
    [t.airport, t.recent]
  );
  const channelTypes = useMemo(
    () => [...new Set([...t.integrations.map((i) => i.type), ...t.recent.map((n) => n.integration_type)])].filter((c) => c in CHANNELS),
    [t.integrations, t.recent]
  );

  async function exportCsv() {
    setExporting(true); setErr("");
    try {
      const all: NotificationLog[] = [];
      for (let p = 1; p <= 20; p++) {
        const r = await api<LogsPage>(queryOf(p, 500, filters));
        all.push(...r.logs);
        if (p >= r.pages) break;
      }
      const lines = [
        ["Time", "Aircraft", "Event", "Channel", "Status", "Message"].map(csvCell).join(","),
        ...all.map((n) => [
          parseUtc(n.sent_at)?.toISOString() ?? n.sent_at, n.aircraft_tail, eventLabel(n.alert_type), channelLabel(n.integration_type),
          delivered(n) ? "Delivered" : "Failed", n.message ?? "",
        ].map(csvCell).join(",")),
      ];
      const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `finalping-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setExporting(false);
    }
  }

  const filtered = aircraft.length > 0 || event.length > 0 || channel.length > 0;
  const picked = [
    ...aircraft.map((v) => ({ key: `a:${v}`, label: v, drop: () => setAircraft(aircraft.filter((x) => x !== v)) })),
    ...event.map((v) => ({ key: `e:${v}`, label: eventLabel(v), drop: () => setEvent(event.filter((x) => x !== v)) })),
    ...channel.map((v) => ({ key: `c:${v}`, label: channelLabel(v), drop: () => setChannel(channel.filter((x) => x !== v)) })),
  ];

  return (
    <div className="fa-page">
      <PageHead
        title="Logs"
        sub={stats
          ? <>Every alert FinalPing has sent. <b style={{ color: "var(--text)" }}>{stats.today}</b> today, <b style={{ color: "var(--text)" }}>{stats.this_week}</b> this week, <b style={{ color: "var(--text)" }}>{stats.total.toLocaleString()}</b> in all.</>
          : "Every alert FinalPing has sent."}
      >
        <Btn disabled={exporting || !rows?.length} onClick={exportCsv}><Download size={15} aria-hidden="true" />{exporting ? "Preparing…" : "Export CSV"}</Btn>
      </PageHead>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <MultiSelect allLabel="All aircraft" unit="aircraft" selected={aircraft} onChange={setAircraft}
          options={tails.map((x) => ({ value: x, label: x, icon: <span className="fa-paint-dot" style={{ background: paintOf(x, paints) }} /> }))} />
        <MultiSelect allLabel="All events" unit="events" selected={event} onChange={setEvent}
          options={eventTypes.map((x) => ({ value: x, label: eventLabel(x), icon: filterIcon(x) }))} />
        <MultiSelect allLabel="All channels" unit="channels" selected={channel} onChange={setChannel}
          options={channelTypes.map((x) => ({ value: x, label: channelLabel(x), icon: <ChannelIcon type={x} size={15} /> }))} />
        {filtered && <button className="fa-link fa-note" onClick={() => { setAircraft([]); setEvent([]); setChannel([]); }}>Clear filters</button>}
        <div className="fa-seg fa-log-view" role="group" aria-label="View">
          <button aria-pressed={view === "flight"} onClick={() => setView("flight")}>By flight</button>
          <button aria-pressed={view === "all"} onClick={() => setView("all")}>Every alert</button>
        </div>
        {picked.length > 0 && (
          <div className="fa-ms-picked">
            Showing only:
            {picked.map((p) => (
              <span key={p.key} className="fa-ms-chip">{p.label}
                <button type="button" aria-label={`Stop filtering by ${p.label}`} onClick={p.drop}><X size={13} aria-hidden="true" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {err && <div className="fa-banner bad" role="alert">{err}</div>}

      {rows === null ? (
        <div className="fa-table-wrap"><Empty title="Loading…" /></div>
      ) : rows.length === 0 ? (
        <div className="fa-table-wrap">
          <Empty title={filtered ? "Nothing matches" : "No alerts yet"}>{filtered ? "Try a wider filter." : "Alerts show up here as soon as the first one goes out."}</Empty>
        </div>
      ) : (
        <div className="fa-log-days">
          {days.map((d) => {
            const flights = view === "flight" ? flightsOf(d.alerts) : null;
            return (
              <section key={d.key} className="fa-log-day" aria-label={d.title}>
                <div className="fa-log-dayhead">
                  <h2>{d.title}</h2>
                  <span>{d.alerts.length} {d.alerts.length === 1 ? "alert" : "alerts"}{flights ? ` · ${flights.length} ${flights.length === 1 ? "flight" : "flights"}` : ""}</span>
                </div>
                {flights ? flights.map((f) => {
                  const sum = flightSummary(f);
                  return (
                    <article key={f.key} className="fa-log-flight">
                      <div className="fa-log-flighthead">
                        <span className="fa-log-tail"><span className="fa-paint-dot" style={{ background: paintOf(f.tail, paints) }} /><Tail>{f.tail}</Tail></span>
                        <span className="fa-note">{sum.text}</span>
                        <span className="mono fa-log-span">{sum.span}</span>
                      </div>
                      {f.alerts.map((a) => (
                        <div key={a.key} className={`fa-log-row${a.sends.every((x) => x.ok) ? "" : " failed"}`}>
                          <span className="mono fa-log-time">{clock(a.at)}</span>
                          <EventBadge type={a.type} />
                          <span className="fa-log-detail" title={a.message.replace(/\*\*/g, "")}>{detailOf(a)}</span>
                          <Sends sends={a.sends} />
                        </div>
                      ))}
                    </article>
                  );
                }) : (
                  <div className="fa-log-flight">
                    {d.alerts.map((a) => (
                      <div key={a.key} className={`fa-log-row all${a.sends.every((x) => x.ok) ? "" : " failed"}`}>
                        <span className="mono fa-log-time">{clock(a.at)}</span>
                        <span className="fa-log-tail"><span className="fa-paint-dot" style={{ background: paintOf(a.tail, paints) }} /><Tail>{a.tail}</Tail></span>
                        <EventBadge type={a.type} />
                        <span className="fa-log-detail" title={a.message.replace(/\*\*/g, "")}>{detailOf(a)}</span>
                        <Sends sends={a.sends} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
      <div>
        {rows && rows.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 2px" }}>
            <span className="fa-note">Showing {rows.length.toLocaleString()} of {total.toLocaleString()}</span>
            {page < pages && <Btn small disabled={busy} onClick={() => load(page + 1, filters, true)}>{busy ? "Loading…" : "Load more"}</Btn>}
          </div>
        )}
      </div>
    </div>
  );
}
