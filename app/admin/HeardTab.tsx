"use client";

import React from "react";

// Every aircraft each receiver heard, and what it broadcasts on: 1090 MHz
// ADS-B, 978 MHz UAT, or no ADS-B out. Plus the tracked aircraft, from the
// label adsb.lol gives them. Data from the backend's /api/internal/heard
// (see heard.py there).

type Link = "1090" | "978" | "none" | "unknown";
type Heard = {
  icao24: string; registration: string | null; callsign: string | null; tracked_as: string | null;
  link: Link; kinds: Record<string, number>; first_seen: string; last_seen: string;
  reports: number; min_alt: number | null; min_nm: number | null; ground: boolean;
};
type Group = { owner: "network" | "receiver"; name: string; counts: Record<Link, number>; aircraft: Heard[] };
type Report = { days: number; link_names: Record<Link, string>; groups: Group[] };

const LINKS: Link[] = ["1090", "978", "none", "unknown"];
const SHADE: Record<Link, string> = {
  "1090": "var(--text)", "978": "var(--text-2)", none: "var(--muted)", unknown: "var(--border)",
};
const KIND_NAMES: Record<string, string> = {
  adsb_icao: "ADS-B", adsb_icao_nt: "ADS-B (non-transponder)", adsb_other: "ADS-B (other address)",
  adsr_icao: "UAT rebroadcast", adsr_other: "UAT rebroadcast", tisb_icao: "TIS-B", tisb_other: "TIS-B",
  tisb_trackfile: "TIS-B", mlat: "MLAT", mode_s: "Mode S", mode_ac: "Mode A/C", unknown: "unlabelled",
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

function when(iso: string) {
  return utc(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function kindsText(kinds: Record<string, number>) {
  const total = Object.values(kinds).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(kinds)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${KIND_NAMES[k] ?? k} ${Math.round((v / total) * 100)}%`)
    .join(" · ");
}

function GroupCard({ g, names }: { g: Group; names: Record<Link, string> }) {
  const [filter, setFilter] = React.useState<Link | "all">("all");
  const [q, setQ] = React.useState("");
  const total = LINKS.reduce((a, k) => a + (g.counts[k] ?? 0), 0);
  const query = q.trim().toLowerCase();
  const rows = g.aircraft.filter((a) =>
    (filter === "all" || a.link === filter) &&
    (!query || [a.registration, a.callsign, a.icao24, a.tracked_as].some((v) => v?.toLowerCase().includes(query))));

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{g.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {g.owner === "network"
                ? "Every tracked aircraft, labelled by how adsb.lol heard it."
                : "Every aircraft this account's receiver heard."}
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{total} aircraft</div>
        </div>
        <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "var(--panel-2)", gap: 2 }}>
          {LINKS.filter((k) => g.counts[k]).map((k) => (
            <div key={k} title={`${names[k]}: ${g.counts[k]}`} style={{ width: `${(g.counts[k] / Math.max(1, total)) * 100}%`, background: SHADE[k] }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginTop: 14 }}>
          {LINKS.map((k) => (
            <div key={k} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: SHADE[k], marginTop: 4, flex: "none", border: "1px solid var(--border)" }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                  {g.counts[k] ?? 0}
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginLeft: 6 }}>
                    {total ? `${Math.round(((g.counts[k] ?? 0) / total) * 100)}%` : ""}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{names[k]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {(["all", ...LINKS] as const).map((k) => (
          <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k}
            style={{
              padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${filter === k ? "var(--text-2)" : "var(--border)"}`,
              background: filter === k ? "var(--panel-2)" : "transparent", color: filter === k ? "var(--text)" : "var(--muted)",
            }}>
            {k === "all" ? `All ${total}` : `${names[k]} ${g.counts[k] ?? 0}`}
          </button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tail, callsign or address"
          aria-label="Search aircraft"
          style={{ marginLeft: "auto", minWidth: 220, flex: "0 1 280px", padding: "8px 12px", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, color: "var(--input-color)", fontSize: 13, outline: "none" }} />
      </div>

      <div style={{ ...card, padding: 0, overflowX: "auto", maxHeight: 560, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 820 }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--panel)", zIndex: 1 }}>
            <tr style={{ textAlign: "left" }}>
              {["Aircraft", "Broadcasts", "Heard as", g.owner === "network" ? "Lowest" : "Closest · lowest", "First heard", "Last heard"].map((h) => (
                <th key={h} style={{ ...label, padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "28px 16px", textAlign: "center", color: "var(--muted)" }}>No aircraft match.</td></tr>
            ) : rows.map((a) => (
              <tr key={a.icao24} style={{ borderTop: "1px solid var(--border)", color: "var(--text)" }}>
                <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                  <div style={{ fontWeight: 600 }}>
                    {a.registration ?? a.callsign ?? a.icao24.toUpperCase()}
                    {a.tracked_as && (
                      <span style={{ marginLeft: 8, padding: "1px 7px", borderRadius: 999, fontSize: 10, fontWeight: 700, border: "1px solid var(--border)", color: "var(--text-2)" }}>TRACKED</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
                    {a.icao24.toUpperCase()}{a.callsign && a.callsign !== a.registration ? ` · ${a.callsign}` : ""}
                  </div>
                </td>
                <td style={{ padding: "10px 16px", whiteSpace: "nowrap", fontWeight: 600 }}>{names[a.link] ?? a.link}</td>
                <td style={{ padding: "10px 16px", color: "var(--muted)", fontSize: 12 }}>{kindsText(a.kinds)}</td>
                <td style={{ padding: "10px 16px", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {g.owner !== "network" && (a.min_nm !== null ? `${a.min_nm} nm` : "no position")}
                  {g.owner !== "network" && " · "}
                  {a.ground ? "on the ground" : a.min_alt !== null ? `${a.min_alt.toLocaleString()} ft` : "?"}
                </td>
                <td style={{ padding: "10px 16px", whiteSpace: "nowrap", color: "var(--muted)" }}>{when(a.first_seen)}</td>
                <td style={{ padding: "10px 16px", whiteSpace: "nowrap", color: "var(--muted)" }}>{when(a.last_seen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function HeardTab() {
  const [days, setDays] = React.useState(30);
  const [report, setReport] = React.useState<Report | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let live = true;
    setLoading(true);
    setFailed(false);
    fetch(`/api/admin/heard?days=${days}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Report) => { if (live) setReport(d); })
      .catch(() => { if (live) setFailed(true); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [days]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "var(--text)" }}>Heard aircraft</h2>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: 0, maxWidth: 680 }}>
            What each aircraft broadcasts on. Receivers listen on 1090 MHz only, so a 978 MHz aircraft shows up only when an
            FAA ground station rebroadcast it on 1090. 978 aircraft are undercounted here.
          </p>
        </div>
        <div role="group" aria-label="Period" style={{ display: "flex", gap: 4, background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
          {[7, 30, 90, 365].map((d) => (
            <button key={d} onClick={() => setDays(d)} aria-pressed={days === d}
              style={{
                padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: days === d ? "var(--panel)" : "transparent", color: days === d ? "var(--text)" : "var(--muted)",
              }}>
              {d === 365 ? "1 year" : `${d} days`}
            </button>
          ))}
        </div>
      </div>

      {loading && !report ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading aircraft...</div>
      ) : failed && !report ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Could not load heard aircraft.</div>
      ) : report && report.groups.length === 0 ? (
        <div style={{ ...card, fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "36px 24px" }}>
          Nothing heard in this period yet. Receivers on version 4.2 or later report every 5 minutes.
        </div>
      ) : report ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 32, opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
          {report.groups.map((g) => <GroupCard key={g.owner + g.name} g={g} names={report.link_names} />)}
        </div>
      ) : null}
    </div>
  );
}
