"use client";

// Logs: every alert FinalPing has sent, newest first.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useTracker } from "../_lib/store";
import { api, errorText } from "../_lib/tracker";
import { airportRings, CHANNELS, channelLabel, clockSeconds, dayLabel, eventLabel, parseUtc, ringKey } from "../_lib/format";
import type { LogsPage, NotificationLog } from "../_lib/types";
import { Btn, Empty, PageHead, Tail } from "../_components/kit";

const PAGE = 50;
const delivered = (n: NotificationLog) => ["sent", "success"].includes(String(n.status).toLowerCase());

function queryOf(page: number, limit: number, f: { aircraft: string; event: string; channel: string }) {
  const p = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (f.aircraft) p.set("aircraft", f.aircraft);
  if (f.event) p.set("alert_type", f.event);
  if (f.channel) p.set("integration", f.channel);
  return `notifications/logs?${p.toString()}`;
}

function csvCell(v: string) {
  // Stop spreadsheet apps treating a value as a formula.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export default function LogsPageView() {
  const t = useTracker();
  const [aircraft, setAircraft] = useState("");
  const [event, setEvent] = useState("");
  const [channel, setChannel] = useState("");
  const [rows, setRows] = useState<NotificationLog[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState<{ today: number; this_week: number; total: number } | null>(null);
  const [exporting, setExporting] = useState(false);

  const filters = useMemo(() => ({ aircraft, event, channel }), [aircraft, event, channel]);

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

  const filtered = aircraft || event || channel;

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
        <select className="fa-input fa-filter" aria-label="Filter by aircraft" value={aircraft} onChange={(e) => setAircraft(e.target.value)}>
          <option value="">All aircraft</option>
          {tails.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className="fa-input fa-filter" aria-label="Filter by event" value={event} onChange={(e) => setEvent(e.target.value)}>
          <option value="">All events</option>
          {eventTypes.map((x) => <option key={x} value={x}>{eventLabel(x)}</option>)}
        </select>
        <select className="fa-input fa-filter" aria-label="Filter by channel" value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option value="">All channels</option>
          {channelTypes.map((x) => <option key={x} value={x}>{channelLabel(x)}</option>)}
        </select>
        {filtered && <button className="fa-link fa-note" onClick={() => { setAircraft(""); setEvent(""); setChannel(""); }}>Clear filters</button>}
      </div>

      {err && <div className="fa-banner bad" role="alert">{err}</div>}

      <div className="fa-table-wrap">
        {rows === null ? (
          <Empty title="Loading…" />
        ) : rows.length === 0 ? (
          <Empty title={filtered ? "Nothing matches" : "No alerts yet"}>{filtered ? "Try a wider filter." : "Alerts show up here as soon as the first one goes out."}</Empty>
        ) : (
          <div className="fa-table-scroll">
            <table className="fa-table">
              <thead>
                <tr><th>Time</th><th>Aircraft</th><th>Event</th><th>Channel</th><th>Status</th><th>Message</th></tr>
              </thead>
              <tbody>
                {rows.map((n) => {
                  const at = parseUtc(n.sent_at);
                  const ok = delivered(n);
                  return (
                    <tr key={n.id} className={ok ? undefined : "failed"}>
                      <td className="mono" style={{ whiteSpace: "nowrap", color: "var(--muted)", fontSize: 12.5 }}>
                        <span style={{ color: "var(--faint)" }}>{dayLabel(at)}</span> {clockSeconds(at)}
                      </td>
                      <td><Tail>{n.aircraft_tail}</Tail></td>
                      <td style={{ whiteSpace: "nowrap" }}>{eventLabel(n.alert_type)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{channelLabel(n.integration_type)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: ok ? "var(--text-2)" : "var(--warn)" }}>
                          <span className={`fa-dot ${ok ? "" : "warn"}`} style={{ width: 6, height: 6 }} />{ok ? "Delivered" : "Failed"}
                        </span>
                      </td>
                      <td style={{ color: "var(--muted)", maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={n.message}>
                        {(n.message ?? "").replace(/\*\*/g, "").replace(/\s*\n\s*/g, " · ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows && rows.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 22px", borderTop: "1px solid #1E1E1E" }}>
            <span className="fa-note">Showing {rows.length.toLocaleString()} of {total.toLocaleString()}</span>
            {page < pages && <Btn small disabled={busy} onClick={() => load(page + 1, filters, true)}>{busy ? "Loading…" : "Load more"}</Btn>}
          </div>
        )}
      </div>
    </div>
  );
}
