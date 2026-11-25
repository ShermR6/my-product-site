"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { GapPoint } from "./GapMap";

const GapMap = dynamic(() => import("./GapMap"), { ssr: false, loading: () => <div style={{ height: 460 }} /> });

// Coverage gaps: every time a tracked aircraft near its airport went unheard
// by every source, plus how the adsb.lol requests went. Data from the
// backend's /api/internal/coverage (see coverage.py there).

type Tally = Record<string, { gaps: number; minutes: number }>;
type Gap = {
  account: string; tail: string | null; icao24: string; outcome: string; cause: string;
  started_at: string; ended_at: string | null; seconds: number;
  start_nm: number | null; start_agl: number | null; start_source: string | null;
  end_nm: number | null; end_agl: number | null; end_on_ground: boolean | null; end_source: string | null;
  receiver: string | null; fetch_failures: number; missed_cycles: number;
};
type Report = {
  days: number;
  fetch: Fetch;
  /** Request stats per network source (adsb.lol, FlyItalyADSB). Older backends send only `fetch`. */
  fetch_sources?: Record<string, Fetch>;
  total: { gaps: number; minutes: number };
  by_cause: Tally; by_distance: Tally; by_height: Tally; by_receiver: Tally;
  by_source_before: Tally; by_source_after: Tally; by_tail: Tally; by_account: Tally;
  recent: Gap[];
  /** Every gap with a position, for the map (newer backends). */
  points?: GapPoint[];
};

type Fetch = {
  hours: number; requests: number; ok_first_try: number; ok_after_retry: number; failed: number;
  median_seconds: number | null; p95_seconds: number | null; errors: Record<string, number>; since: string | null;
};

const SOURCE_NAMES: Record<string, string> = {
  adsb_icao: "ADS-B", adsb_icao_nt: "ADS-B (non-transponder)", adsr_icao: "UAT, rebroadcast",
  tisb_icao: "TIS-B", tisb_trackfile: "TIS-B", tisb_other: "TIS-B", adsc: "ADS-C",
  mlat: "MLAT", mode_s: "Mode S", other: "Other", adsb_other: "ADS-B (other)",
  adsr_other: "UAT, rebroadcast", receiver: "Your receiver", adsb: "adsb.lol", "not heard again": "Not heard again",
};
const sourceName = (k: string | null) => (k ? SOURCE_NAMES[k] ?? k : "none");
const cap = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);

const ORDER: Record<string, string[]> = {
  by_distance: ["under 2 nm", "2 to 5 nm", "5 to 10 nm", "10 to 25 nm", "unknown"],
  by_height: ["under 500 ft", "500 to 1,500 ft", "1,500 to 3,000 ft", "over 3,000 ft", "unknown"],
};

const card: React.CSSProperties = {
  background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px",
};
const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em",
};

function utc(iso: string) {
  return new Date(iso.endsWith("Z") ? iso : iso + "Z");
}

function duration(seconds: number) {
  if (seconds < 90) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toFixed(1)} h`;
}

function Stat({ value, name }: { value: React.ReactNode; name: string }) {
  return (
    <div style={{ ...card, padding: "16px 20px" }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{name}</div>
    </div>
  );
}

function Bars({ title, tally, order, names, limit }: {
  title: string; tally: Tally; order?: string[]; names?: (k: string) => string; limit?: number;
}) {
  let rows = Object.entries(tally);
  if (order) rows = rows.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  else rows = rows.sort((a, b) => b[1].minutes - a[1].minutes);
  if (limit) rows = rows.slice(0, limit);
  const max = Math.max(1, ...rows.map(([, v]) => v.minutes));
  return (
    <div style={card}>
      <div style={{ ...label, marginBottom: 14 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Nothing yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map(([k, v]) => (
            <div key={k}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{names ? names(k) : k}</span>
                <span style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {v.gaps} · {v.minutes} min
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--panel-2)" }}>
                <div style={{ height: 4, borderRadius: 2, width: `${(v.minutes / max) * 100}%`, background: "var(--text-2)" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FetchStats({ name, f }: { name: string; f: Fetch }) {
  const failRate = f.requests ? ((f.failed / f.requests) * 100).toFixed(1) : null;
  return (
    <section>
      <div style={{ ...label, marginBottom: 10 }}>{name} requests, last 24 h{f.since ? ` (since ${utc(f.since).toLocaleString()})` : ""}</div>
      {f.requests === 0 ? (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>No requests yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))", gap: 10 }}>
          <Stat value={f.requests} name="Requests" />
          <Stat value={f.ok_first_try} name="Answered first try" />
          <Stat value={f.ok_after_retry} name="Answered on a retry" />
          <Stat value={failRate !== null ? `${f.failed} (${failRate}%)` : f.failed} name="Failed" />
          <Stat value={f.median_seconds !== null ? `${f.median_seconds}s` : "–"} name="Typical answer time" />
          <Stat value={f.p95_seconds !== null ? `${f.p95_seconds}s` : "–"} name="Slowest 5%" />
        </div>
      )}
      {Object.keys(f.errors).length > 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
          Errors seen: {Object.entries(f.errors).map(([k, v]) => `${k} ${v}`).join(" · ")}
        </div>
      )}
    </section>
  );
}

export default function CoverageTab() {
  const [days, setDays] = React.useState(7);
  const [report, setReport] = React.useState<Report | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let live = true;
    setLoading(true);
    setFailed(false);
    fetch(`/api/admin/coverage?days=${days}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Report) => { if (live) setReport(d); })
      .catch(() => { if (live) setFailed(true); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [days]);

  const f = report?.fetch;
  const sources: [string, Fetch][] = report
    ? Object.entries(report.fetch_sources ?? { "adsb.lol": report.fetch })
    : [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "var(--text)" }}>Coverage gaps</h2>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: 0, maxWidth: 640 }}>
            Each time a tracked aircraft, airborne within 25 nm of its airport, went unheard by every source for 80 seconds or more.
          </p>
        </div>
        <div role="group" aria-label="Period" style={{ display: "flex", gap: 4, background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
          {[1, 7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} aria-pressed={days === d}
              style={{
                padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: days === d ? "var(--panel)" : "transparent", color: days === d ? "var(--text)" : "var(--muted)",
              }}>
              {d === 1 ? "24 h" : `${d} days`}
            </button>
          ))}
        </div>
      </div>

      {loading && !report ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading coverage...</div>
      ) : failed && !report ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Could not load the coverage report.</div>
      ) : report && f ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 28, opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
          {sources.map(([name, s]) => <FetchStats key={name} name={name} f={s} />)}

          <section>
            <div style={{ ...label, marginBottom: 10 }}>Gaps, last {report.days === 1 ? "24 h" : `${report.days} days`}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))", gap: 10, marginBottom: 10 }}>
              <Stat value={report.total.gaps} name="Gaps" />
              <Stat value={`${report.total.minutes} min`} name="Unheard in total" />
            </div>
            {report.total.gaps === 0 ? (
              <div style={{ ...card, fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "36px 24px" }}>
                No gaps logged in this period. Logging started with backend f5213d0 on Nov 18.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {report.points && (
                <div style={card}>
                  <div style={{ ...label, marginBottom: 12 }}>Where gaps happen</div>
                  <GapMap points={report.points} />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10 }}>
                <Bars title="What happened" tally={report.by_cause} names={cap} />
                <Bars title="Distance from the airport when it went quiet" tally={report.by_distance} order={ORDER.by_distance} />
                <Bars title="Height above the airport when it went quiet" tally={report.by_height} order={ORDER.by_height} />
                <Bars title="Account's receiver during the gap" tally={report.by_receiver} names={cap} />
                <Bars title="Heard by, before the gap" tally={report.by_source_before} names={sourceName} />
                <Bars title="Heard by, after the gap" tally={report.by_source_after} names={sourceName} />
                <Bars title="Aircraft" tally={report.by_tail} limit={10} />
                <Bars title="Account" tally={report.by_account} limit={10} />
              </div>
              </div>
            )}
          </section>

          {report.recent.length > 0 && (
            <section>
              <div style={{ ...label, marginBottom: 10 }}>Latest gaps</div>
              <div style={{ ...card, padding: 0, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 760 }}>
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      {["When", "Aircraft", "Unheard", "Went quiet", "Heard again", "Receiver", "What happened"].map((h) => (
                        <th key={h} style={{ ...label, padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.recent.map((g, i) => (
                      <tr key={i} style={{ borderTop: i ? "1px solid var(--border)" : undefined, color: "var(--text)" }}>
                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap", color: "var(--muted)" }}>{utc(g.started_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ fontWeight: 600 }}>{g.tail ?? g.icao24}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>{g.account}</div>
                        </td>
                        <td style={{ padding: "10px 16px", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{duration(g.seconds)}</td>
                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                          {g.start_nm !== null ? `${g.start_nm.toFixed(1)} nm` : "?"}{g.start_agl !== null ? ` · ${g.start_agl.toLocaleString()} ft` : ""}
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>{sourceName(g.start_source)}</div>
                        </td>
                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                          {g.outcome === "not_seen_again" ? <span style={{ color: "var(--muted)" }}>Not heard again</span> : (
                            <>
                              {g.end_nm !== null ? `${g.end_nm.toFixed(1)} nm` : "?"}
                              {g.end_on_ground ? " · on the ground" : g.end_agl !== null ? ` · ${g.end_agl.toLocaleString()} ft` : ""}
                              <div style={{ fontSize: 11, color: "var(--muted)" }}>{sourceName(g.end_source)}</div>
                            </>
                          )}
                        </td>
                        <td style={{ padding: "10px 16px", color: "var(--muted)" }}>{g.receiver === "up" ? "Online" : g.receiver === "part" ? "Part of it" : "Offline"}</td>
                        <td style={{ padding: "10px 16px" }}>
                          {cap(g.cause)}
                          {g.fetch_failures > 0 && <div style={{ fontSize: 11, color: "var(--muted)" }}>{g.fetch_failures} of {g.missed_cycles} polls failed</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      ) : null}
    </div>
  );
}
