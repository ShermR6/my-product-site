"use client";

// Live Map: the whole screen is the map. A dock lists the tracked aircraft;
// picking one opens its sheet with the approach so far.

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Crosshair, X } from "lucide-react";
import { useTracker } from "../_lib/store";
import { api } from "../_lib/tracker";
import {
  ago, airportRings, channelLabel, etaText, inboundOf, nm, parseUtc, recentAlertsFor, ringsFor, stageOf, STAGE_LABEL, whole,
} from "../_lib/format";
import type { GroundRange } from "../_lib/types";
import { Tail } from "../_components/kit";
import ApproachLadder, { ladderSteps } from "../_components/ApproachLadder";
import type { MapCoverage, MapPlane } from "../_components/LeafletMap";

const LeafletMap = dynamic(() => import("../_components/LeafletMap"), {
  ssr: false,
  loading: () => <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Loading map…</div>,
});

export default function LiveMapPage() {
  const t = useTracker();
  const [selected, setSelected] = useState<string | null>(null);
  const [showRings, setShowRings] = useState(true);
  const [showRange, setShowRange] = useState(false);
  const [range, setRange] = useState<GroundRange | null>(null);
  const [fitSeq, setFitSeq] = useState(0);

  const inbound = inboundOf(t.live, t.aircraft, t.airport);

  useEffect(() => {
    if (!showRange || range || t.groundEnabled !== true) return;
    let live = true;
    api<GroundRange>("ground/range").then((r) => { if (live) setRange(r); }).catch(() => {});
    return () => { live = false; };
  }, [showRange, range, t.groundEnabled]);

  const lat = Number(t.airport?.latitude);
  const lon = Number(t.airport?.longitude);
  const center = useMemo(() => (t.airport && isFinite(lat) && isFinite(lon) ? { lat, lon } : null), [t.airport, lat, lon]);

  const rings = airportRings(t.airport);
  const inboundTails = new Set(inbound.map((a) => a.tail_number));
  const planes: MapPlane[] = t.live
    .filter((a) => a.latitude != null && a.longitude != null)
    .map((a) => ({
      tail: a.tail_number, lat: a.latitude as number, lon: a.longitude as number, heading: a.heading,
      live: inboundTails.has(a.tail_number), dim: !!a.on_ground,
    }));

  const coverage: MapCoverage | null =
    showRange && range?.range_nm && range.receiver_lat != null && range.receiver_lon != null
      ? { lat: range.receiver_lat, lon: range.receiver_lon, rangeNm: range.range_nm }
      : null;

  const sel = t.live.find((a) => a.tail_number === selected) ?? null;
  const selInfo = t.aircraft.find((a) => a.tail_number === selected);
  const selRings = selected ? ringsFor(selected, t.aircraft, t.airport) : [];
  const selStage = sel ? stageOf(sel, selRings) : null;
  const selHot = selStage === "final" || selStage === "inbound";
  const sendsTo = t.integrations.filter((i) => i.enabled).map((i) => channelLabel(i.type));
  const selAge = sel ? Math.max(0, (t.now - (parseUtc(sel.last_seen)?.getTime() ?? t.now)) / 1000) : null;

  if (t.hasAirport === false) {
    return (
      <div className="fa-page">
        <div className="fa-card fa-empty">
          <strong>Pick your airport first</strong>
          The map centers on your airport and its alert rings.
          <div style={{ marginTop: 16 }}><Link className="fa-btn primary" href="/app/airport">Set up airport</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fa-map-full">
      <LeafletMap
        center={center} code={t.airport?.airport_code} rings={rings} planes={planes}
        selected={selected} onSelect={setSelected} showRings={showRings} coverage={coverage} fitSeq={fitSeq}
      />

      {/* layer chips */}
      <div className="fa-map-layers">
        <button className="fa-map-chip" aria-pressed={showRings} onClick={() => setShowRings((v) => !v)}>
          <span className={`fa-dot ${showRings ? "" : "hollow"}`} style={{ width: 6, height: 6 }} />Rings
        </button>
        {t.groundEnabled === true && (
          <button className="fa-map-chip" aria-pressed={showRange} onClick={() => setShowRange((v) => !v)}>
            <span className={`fa-dot ${showRange ? "" : "hollow"}`} style={{ width: 6, height: 6 }} />Receiver range
          </button>
        )}
        <button className="fa-map-chip" onClick={() => setFitSeq((n) => n + 1)} aria-label="Center on the airport">
          <Crosshair size={13} aria-hidden="true" />{t.airport?.airport_code ?? "Center"}
        </button>
      </div>
      {showRange && range && !range.range_nm && (
        <div className="fa-map-chip fa-map-toast" role="status">Your receiver hasn&apos;t reported its range yet.</div>
      )}

      {/* selected aircraft */}
      {selected && (
        <aside className="fa-float fa-map-sheet" aria-label={`${selected} details`}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Tail size={20}>{selected}</Tail>
                <span className={`fa-pilltag ${selHot ? "live" : "dim"}`}>{selStage ? STAGE_LABEL[selStage] : "Not in view"}</span>
              </div>
              <div className="fa-note" style={{ marginTop: 4 }}>{[selInfo?.friendly_name, selInfo?.aircraft_type].filter(Boolean).join(" · ") || "Tracked aircraft"}</div>
            </div>
            <button className="fa-icon-btn" aria-label="Close" onClick={() => setSelected(null)}><X size={16} aria-hidden="true" /></button>
          </div>

          {sel ? (
            <>
              {!sel.on_ground && (
                <div style={{ margin: "14px 0 4px" }}>
                  <span className="fa-stat" style={{ fontSize: 40 }}>{sel.distance_nm.toFixed(1)}<small>nm out</small></span>
                </div>
              )}
              <div className="fa-grid fa-cols-3 fa-keep-cols" style={{ gap: 8, margin: "12px 0 6px" }}>
                <Mini label="ETA" value={selHot ? etaText(sel.distance_nm, sel.velocity_kts) : "—"} />
                <Mini label="Speed" value={whole(sel.velocity_kts, "kt")} />
                <Mini label="Altitude" value={whole(sel.altitude_ft_msl, "ft")} />
              </div>
              {selRings.length > 0 && (
                <div style={{ borderTop: "1px solid #232323", marginTop: 10, paddingTop: 10 }}>
                  <div className="fa-eyebrow" style={{ marginBottom: 6 }}>Alerts this approach</div>
                  <ApproachLadder vertical steps={ladderSteps(selRings, recentAlertsFor(selected, t.recent), sel)} />
                </div>
              )}
              <div className="fa-note" style={{ marginTop: 10 }}>
                {sendsTo.length ? `Sending to ${sendsTo.join(", ")}` : "No channel connected, so no alerts are going out."}
                {" · "}{sel.source === "ground_station" ? "Ground Station" : "Network"}, position {ago(selAge).replace(" ago", "")} old
              </div>
            </>
          ) : (
            <p className="fa-note" style={{ marginTop: 14 }}>No position right now. It shows up here as soon as its transponder is heard.</p>
          )}
        </aside>
      )}

      {/* dock */}
      <div className="fa-float fa-map-dock" role="group" aria-label="Tracked aircraft">
        {t.aircraft.length === 0 && (
          <Link href="/app/aircraft?add=1" className="fa-dock-item"><span style={{ fontWeight: 600 }}>Add an aircraft</span><span className="fa-note">Nothing tracked yet</span></Link>
        )}
        {[...t.aircraft]
          .map((a) => ({ a, lv: t.live.find((x) => x.tail_number === a.tail_number) }))
          .sort((x, y) => rank(x.lv) - rank(y.lv) || (x.lv?.distance_nm ?? 1e9) - (y.lv?.distance_nm ?? 1e9))
          .map(({ a, lv }) => {
            const stage = lv ? stageOf(lv, ringsFor(a.tail_number, t.aircraft, t.airport)) : null;
            const hot = stage === "final" || stage === "inbound";
            return (
              <button key={a.id} className="fa-dock-item" aria-pressed={selected === a.tail_number}
                onClick={() => setSelected(selected === a.tail_number ? null : a.tail_number)}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`fa-dot ${hot ? "live" : stage === "airborne" ? "" : "hollow"}`} />
                  <Tail>{a.tail_number}</Tail>
                </span>
                <span className="fa-note" style={{ color: hot ? "var(--accent)" : undefined }}>
                  {lv && !lv.on_ground ? `${nm(lv.distance_nm)} · ${STAGE_LABEL[stage!].toLowerCase()}` : stage ? STAGE_LABEL[stage] : "Not in view"}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}

function rank(lv: { on_ground: boolean | null; is_approaching: boolean } | undefined) {
  if (!lv) return 3;
  if (lv.on_ground) return 2;
  return lv.is_approaching ? 0 : 1;
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--panel-2)", borderRadius: 10, padding: "8px 10px", minWidth: 0 }}>
      <div className="fa-note" style={{ fontSize: 11 }}>{label}</div>
      <div className="mono" style={{ fontSize: 13.5, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
