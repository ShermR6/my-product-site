"use client";

// Live Map: the whole screen is the map. A dock lists the tracked aircraft;
// picking one opens its sheet with the approach so far, and draws the whole
// flight it is on. Follow keeps the map on it. The sheet also lists the
// aircraft's flights of the last 48 hours; picking one replays it on the map,
// with a control bar in place of the dock.

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Crosshair, LocateFixed, Pause, Play, X } from "lucide-react";
import { useTracker } from "../_lib/store";
import { api } from "../_lib/tracker";
import {
  ago, airportRings, channelLabel, clock, clockSeconds, dayLabel, etaText, eventLabel, nm, offsetNm, parseUtc, recentAlertsFor, ringsFor, runwayFor, stageOf, STAGE_LABEL, whole,
} from "../_lib/format";
import type { FlightTrail, GroundRange, RecordedFlight, RecordedFlightDetail } from "../_lib/types";
import { fixAt, gapsOf, REPLAY_GAP_S, REPLAY_SPEEDS, useReplayClock } from "../_lib/replay";
import { Tail } from "../_components/kit";
import ApproachLadder, { ladderSteps } from "../_components/ApproachLadder";
import type { MapCoverage, MapFlight, MapPlane } from "../_components/MapGL";
import Plane3D from "../_components/Plane3D";
import { paintOf, usePaints } from "../_lib/paint";
import { mapPlanes } from "../_lib/mapPlanes";

/** How often the picked aircraft's flight is loaded again. In between, the
 *  positions the page gets anyway are added to the end of it. */
const FLIGHT_RELOAD_MS = 30_000;
/** How often the picked aircraft's list of recorded flights is loaded again. */
const FLIGHTS_RELOAD_MS = 60_000;
const SOURCE_NAME: Record<string, string> = {
  a: "adsb.lol", f: "FlyItalyADSB", h: "FlyItalyADSB's track", r: "your receiver",
};

const MapGL = dynamic(() => import("../_components/MapGL"), {
  ssr: false,
  loading: () => <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Loading map…</div>,
});

export default function LiveMapPage() {
  const t = useTracker();
  const [selected, setSelectedTail] = useState<string | null>(null);
  // Follow: the map stays on the picked aircraft. Picking another aircraft,
  // closing the sheet or dragging the map lets go.
  const [follow, setFollow] = useState(false);
  const [insetBottom, setInsetBottom] = useState(0);
  const sheet = useRef<HTMLElement | null>(null);
  const setSelected = (tail: string | null) => { setSelectedTail(tail); setFollow(false); setReplay(null); };
  // On a phone the sheet lies over the lower part of the map.
  const measureInset = () => {
    const box = sheet.current;
    const frame = box?.parentElement;
    if (box && frame && window.matchMedia("(max-width: 860px)").matches) {
      setInsetBottom(Math.max(0, Math.round(frame.getBoundingClientRect().bottom - box.getBoundingClientRect().top)));
    } else setInsetBottom(0);
  };
  const toggleFollow = () => { measureInset(); setFollow((v) => !v); };
  const [showRings, setShowRings] = useState(true);
  const [showRange, setShowRange] = useState(false);
  const [range, setRange] = useState<GroundRange | null>(null);
  const [fitSeq, setFitSeq] = useState(0);
  const [tilt, setTilt] = useState(false);
  const paints = usePaints();
  // The picked aircraft's whole flight, as the backend recorded it.
  const [loaded, setLoaded] = useState<(FlightTrail & { at: number }) | null>(null);
  // Replay: the picked aircraft's recorded flights, and the one being replayed.
  const [flights, setFlights] = useState<{ tail: string; list: RecordedFlight[] } | null>(null);
  const [replay, setReplay] = useState<RecordedFlightDetail | null>(null);
  const [opening, setOpening] = useState<number | null>(null);
  const [replayErr, setReplayErr] = useState("");
  const rStart = replay?.points[0]?.[0] ?? 0;
  const rEnd = replay?.points[replay.points.length - 1]?.[0] ?? 0;
  const player = useReplayClock(rStart, rEnd);

  // /app/map?tail=N123 opens with that aircraft picked (the Aircraft page links here).
  useEffect(() => {
    const tail = new URLSearchParams(window.location.search).get("tail");
    // The address is only known in the browser, after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tail) setSelectedTail(tail.trim().toUpperCase());
  }, []);

  useEffect(() => {
    if (!selected) return;          // the list shows only when it is the picked aircraft's
    let live = true;
    const load = () => api<{ tail: string; flights: RecordedFlight[] }>(`aircraft/flights?tail=${encodeURIComponent(selected)}`)
      .then((r) => { if (live) setFlights({ tail: r.tail, list: r.flights }); })
      .catch(() => { /* keep the list already shown */ });
    load();
    const id = window.setInterval(load, FLIGHTS_RELOAD_MS);
    return () => { live = false; window.clearInterval(id); };
  }, [selected]);



  const openReplay = (id: number) => {
    setOpening(id);
    setReplayErr("");
    api<RecordedFlightDetail>(`aircraft/flights/${id}`)
      .then((d) => {
        if (d.points.length < 2) { setReplayErr("That flight has too few positions to replay."); return; }
        setReplay(d);
        // Start at the top of the sheet, with the map on the aircraft wherever the flight began.
        requestAnimationFrame(() => {
          sheet.current?.scrollTo({ top: 0 });
          measureInset();
          setFollow(true);
        });
      })
      .catch(() => setReplayErr("Could not load that flight. Try again."))
      .finally(() => setOpening(null));
  };

  useEffect(() => {
    if (!selected) return;
    let live = true;
    const load = () => api<FlightTrail>(`aircraft/trail?tail=${encodeURIComponent(selected)}`)
      .then((r) => { if (live) setLoaded({ ...r, at: Date.now() }); })
      .catch(() => { /* keep the flight already loaded; the next try is in half a minute */ });
    load();
    const id = window.setInterval(load, FLIGHT_RELOAD_MS);
    return () => { live = false; window.clearInterval(id); };
  }, [selected]);

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
  const planes = mapPlanes(t.live, t.aircraft, t.airport, paints);
  const landing = t.airport?.approach_corridor_enabled
    ? (t.airport.approach_runway_headings?.length ? t.airport.approach_runway_headings : t.airport.approach_runway_heading != null ? [t.airport.approach_runway_heading] : []).map(Number)
    : [];

  const coverage: MapCoverage | null =
    showRange && range?.range_nm && range.receiver_lat != null && range.receiver_lon != null
      ? { lat: range.receiver_lat, lon: range.receiver_lon, rangeNm: range.range_nm }
      : null;

  const sel = t.live.find((a) => a.tail_number === selected) ?? null;
  const selInfo = t.aircraft.find((a) => a.tail_number === selected);
  const selRings = selected ? ringsFor(selected, t.aircraft, t.airport) : [];
  const selStage = sel ? stageOf(sel, selRings) : null;
  const selHot = selStage === "final" || selStage === "inbound";
  const selRunway = sel && selHot ? runwayFor(sel, t.airport?.runway_info) : null;
  const sendsTo = t.integrations.filter((i) => i.enabled).map((i) => channelLabel(i.type));
  const selAge = sel ? Math.max(0, (t.now - (parseUtc(sel.last_seen)?.getTime() ?? t.now)) / 1000) : null;
  const trail = loaded && loaded.tail === selected && loaded.points.length > 1 ? loaded : null;
  const flight: MapFlight | null = useMemo(
    () => (trail ? { tail: trail.tail, color: paintOf(trail.tail, paints), at: trail.at, points: trail.points } : null),
    [trail, paints],
  );
  const flightSince = trail ? parseUtc(trail.started_at) : null;

  // Replay: the aircraft where it was at the playhead, and its path up to there.
  const rFix = replay ? fixAt(replay.points, player.at) : null;
  const rIndex = rFix?.index ?? 0;
  const rColor = replay ? paintOf(replay.tail, paints) : undefined;
  const replayPlanes: MapPlane[] = replay && rFix ? [{
    tail: replay.tail, lat: rFix.lat, lon: rFix.lon, heading: rFix.heading, live: false, dim: rFix.ground,
    type: t.aircraft.find((a) => a.tail_number === replay.tail)?.aircraft_type, color: rColor,
    speedKt: rFix.speed, seenAt: null,
    altFt: rFix.alt != null ? rFix.alt - (t.airport?.elevation_ft_msl ?? 0) : null,
  }] : [];
  const replayFlight: MapFlight | null = useMemo(
    () => (replay ? {
      tail: replay.tail, color: rColor,
      // Loaded "in the future": nothing the page sees live is added to a replay's line.
      at: Number.MAX_SAFE_INTEGER,
      points: replay.points.slice(0, rIndex + 1).map((p): [number, number, number] => [p[1], p[2], p[0]]),
    } : null),
    [replay, rIndex, rColor],
  );
  const replayGaps = useMemo(() => (replay ? gapsOf(replay.points) : []), [replay]);
  const rOut = rFix && center ? Math.hypot(offsetNm(center.lat, center.lon, rFix.lat, rFix.lon).x, offsetNm(center.lat, center.lon, rFix.lat, rFix.lon).y) : null;
  const rDate = replay ? new Date(player.at * 1000) : null;
  const rSource = replay && rFix ? SOURCE_NAME[replay.points[rIndex]?.[7]] : undefined;

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
      <MapGL
        center={center} code={t.airport?.airport_code} rings={rings} planes={replay ? replayPlanes : planes}
        selected={replay ? replay.tail : selected} onSelect={replay ? () => {} : setSelected}
        flight={replay ? replayFlight : flight} snappy={!!replay}
        showRings={showRings} coverage={coverage} fitSeq={fitSeq} tilt={tilt}
        follow={follow} onFollowEnd={() => setFollow(false)} followInsetBottom={insetBottom}
        runways={t.airport?.runway_info} approach={landing}
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
        <button className="fa-map-chip" aria-pressed={tilt} onClick={() => setTilt((v) => !v)} aria-label="Tilt the map for a 3D view">
          <Box size={13} aria-hidden="true" />3D
        </button>
        <button className="fa-map-chip" onClick={() => setFitSeq((n) => n + 1)} aria-label="Center on the airport">
          <Crosshair size={13} aria-hidden="true" />{t.airport?.airport_code ?? "Center"}
        </button>
      </div>
      {showRange && range && !range.range_nm && (
        <div className="fa-map-chip fa-map-toast" role="status">Your receiver hasn&apos;t reported its range yet.</div>
      )}

      {/* selected aircraft */}
      {selected && (
        <aside ref={sheet} className={`fa-float fa-map-sheet${replay ? " replaying" : ""}`} aria-label={`${selected} details`}>
          <Plane3D key={selected} className="bleed" tail={selected} type={selInfo?.aircraft_type} color={paintOf(selected, paints)} height={150} />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Tail size={20}>{selected}</Tail>
                {replay
                  ? <span className="fa-pilltag">Replay</span>
                  : <span className={`fa-pilltag ${selHot ? "live" : "dim"}`}>{selStage ? STAGE_LABEL[selStage] : "Not in view"}</span>}
              </div>
              <div className="fa-note" style={{ marginTop: 4 }}>{[selInfo?.friendly_name, selInfo?.aircraft_type].filter(Boolean).join(" · ") || "Tracked aircraft"}</div>
            </div>
            <button className="fa-icon-btn" aria-label="Close" onClick={() => setSelected(null)}><X size={16} aria-hidden="true" /></button>
          </div>

          {(replay || (sel && sel.latitude != null && sel.longitude != null)) && (
            <button className="fa-map-chip fa-follow" aria-pressed={follow} onClick={toggleFollow}
              title={follow ? "Stop following" : "Keep the map on this aircraft"}>
              <LocateFixed size={13} aria-hidden="true" />{follow ? "Following" : "Follow"}
            </button>
          )}

          {replay && rFix && rDate ? (
            <>
              <div style={{ margin: "14px 0 4px" }}>
                <span className="fa-stat" style={{ fontSize: 34 }}>{clockSeconds(rDate)}<small>{dayLabel(rDate).toLowerCase()}</small></span>
              </div>
              <div className="fa-grid fa-cols-3 fa-keep-cols" style={{ gap: 8, margin: "12px 0 6px" }}>
                <Mini label="From field" value={rOut != null ? `${rOut.toFixed(1)} nm` : "—"} />
                <Mini label="Speed" value={whole(rFix.speed, "kt")} />
                <Mini label="Altitude" value={rFix.ground ? "Ground" : whole(rFix.alt, "ft")} />
              </div>
              {rFix.gap >= REPLAY_GAP_S && (
                <p className="fa-note" style={{ marginTop: 8 }}>
                  No position for {Math.round(rFix.gap / 60)} min here: a gap in coverage. The line is drawn straight across it.
                </p>
              )}
              {replay.alerts.length > 0 && (
                <div style={{ borderTop: "1px solid #232323", marginTop: 10, paddingTop: 10 }}>
                  <div className="fa-eyebrow" style={{ marginBottom: 6 }}>Alerts on this flight</div>
                  {replay.alerts.map((a, i) => {
                    const when = parseUtc(a.at);
                    const sec = when ? when.getTime() / 1000 : 0;
                    const past = player.at >= sec;
                    return (
                      <button key={i} className="fa-replay-alert" aria-pressed={past} onClick={() => player.seek(sec - 10)}
                        title="Jump to 10 seconds before this alert">
                        <span className={`fa-dot ${past ? "" : "hollow"}`} />
                        <span style={{ flex: 1 }}>{eventLabel(a.type)}</span>
                        <span className="mono fa-note">{clock(when)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="fa-note" style={{ marginTop: 10 }}>
                {rSource ? `Position from ${rSource}. ` : ""}
                {replay.filled_from_history ? "Filled in with FlyItalyADSB's track between polls." : ""}
              </div>
              <button className="fa-btn" style={{ marginTop: 12, width: "100%" }} onClick={() => setReplay(null)}>Back to live</button>
            </>
          ) : sel ? (
            <>
              {!sel.on_ground && (
                <div style={{ margin: "14px 0 4px" }}>
                  <span className="fa-stat" style={{ fontSize: 40 }}>{sel.distance_nm.toFixed(1)}<small>nm out</small></span>
                </div>
              )}
              {selRunway && <div style={{ fontSize: 13.5, fontWeight: 600, margin: "2px 0 0" }}>Lined up for runway {selRunway}</div>}
              <div className="fa-grid fa-cols-3 fa-keep-cols" style={{ gap: 8, margin: "12px 0 6px" }}>
                <Mini label="ETA" value={selHot ? etaText(sel.distance_nm, sel.velocity_kts) : "—"} />
                <Mini label="Speed" value={whole(sel.velocity_kts, "kt")} />
                <Mini label="Altitude" value={whole(sel.altitude_ft_msl, "ft")} />
              </div>
              {selRings.length > 0 && (
                <div style={{ borderTop: "1px solid #232323", marginTop: 10, paddingTop: 10 }}>
                  <div className="fa-eyebrow" style={{ marginBottom: 6 }}>Alerts this approach</div>
                  <ApproachLadder vertical steps={ladderSteps(selRings, recentAlertsFor(selected, t.recent, sel), sel)} />
                </div>
              )}
              {flightSince && <div className="fa-note" style={{ marginTop: 10 }}>Flight path on the map since {clock(flightSince)}</div>}
              <div className="fa-note" style={{ marginTop: flightSince ? 4 : 10 }}>
                {sendsTo.length ? `Sending to ${sendsTo.join(", ")}` : "No channel connected, so no alerts are going out."}
                {" · "}
                {sel.on_ground && sel.latitude == null
                  ? `Last heard ${ago(selAge)} close to the airport and low, so it is shown as landed`
                  : `${sel.source === "ground_station" ? "Ground Station" : "Network"}, position ${ago(selAge).replace(" ago", "")} old`}
              </div>
            </>
          ) : (
            <p className="fa-note" style={{ marginTop: 14 }}>
              No position right now. It shows up here as soon as its transponder is heard.
              {flightSince ? ` The line on the map is its last flight, from ${clock(flightSince)}.` : ""}
            </p>
          )}

          {!replay && flights && flights.tail === selected && (
            <div style={{ borderTop: "1px solid #232323", marginTop: 12, paddingTop: 10 }}>
              <div className="fa-eyebrow" style={{ marginBottom: 6 }}>Recent flights · last 48 hours</div>
              {flights.list.length === 0 ? (
                <p className="fa-note">No flights recorded yet. Each flight is kept for 48 hours to replay.</p>
              ) : flights.list.map((f) => {
                const from = parseUtc(f.started_at);
                const to = parseUtc(f.last_at);
                return (
                  <button key={f.id} className="fa-replay-flight" onClick={() => openReplay(f.id)} disabled={opening != null}>
                    <Play size={13} aria-hidden="true" />
                    <span style={{ flex: 1, textAlign: "left" }}>
                      {dayLabel(from)} {clock(from)} – {f.in_progress ? "now" : clock(to)}
                      <span className="fa-note" style={{ display: "block" }}>
                        {f.minutes < 60 ? `${f.minutes} min` : `${Math.floor(f.minutes / 60)} h ${f.minutes % 60} min`}
                        {f.max_alt_ft != null ? ` · up to ${f.max_alt_ft.toLocaleString()} ft` : ""}
                      </span>
                    </span>
                    {opening === f.id && <span className="fa-note">Loading…</span>}
                  </button>
                );
              })}
              {replayErr && <div className="fa-error" role="alert" style={{ marginTop: 8 }}>{replayErr}</div>}
            </div>
          )}
        </aside>
      )}

      {/* replay controls, in place of the dock */}
      {replay && (
        <div className="fa-float fa-replay-bar" role="group" aria-label={`Replay of ${replay.tail}`}>
          <button className="fa-icon-btn fa-replay-play" onClick={player.toggle} aria-label={player.playing ? "Pause" : "Play"}>
            {player.playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          </button>
          <span className="mono fa-replay-time">{clockSeconds(rDate)}</span>
          <div className="fa-replay-track">
            <div className="fa-replay-rail" />
            {replayGaps.map(([a, b], i) => (
              <div key={i} className="fa-replay-gap" title="No position: a gap in coverage"
                style={{ left: `${((a - rStart) / (rEnd - rStart)) * 100}%`, width: `${((b - a) / (rEnd - rStart)) * 100}%` }} />
            ))}
            <div className="fa-replay-fill" style={{ width: `${((player.at - rStart) / Math.max(1, rEnd - rStart)) * 100}%` }} />
            {replay.alerts.map((a, i) => {
              const sec = (parseUtc(a.at)?.getTime() ?? 0) / 1000;
              if (sec < rStart || sec > rEnd) return null;
              return <div key={i} className="fa-replay-tick" title={eventLabel(a.type)} style={{ left: `${((sec - rStart) / (rEnd - rStart)) * 100}%` }} />;
            })}
            <input type="range" min={rStart} max={rEnd} step={1} value={player.at}
              onChange={(e) => player.seek(Number(e.target.value))} aria-label="Replay position"
              aria-valuetext={clockSeconds(rDate)} />
          </div>
          <span className="mono fa-note fa-replay-end">{clockSeconds(new Date(rEnd * 1000))}</span>
          <div className="fa-seg" role="group" aria-label="Replay speed">
            {REPLAY_SPEEDS.map((s) => (
              <button key={s} aria-pressed={player.speed === s} onClick={() => player.setSpeed(s)}>{s}×</button>
            ))}
          </div>
          <button className="fa-icon-btn" onClick={() => setReplay(null)} aria-label="Close replay"><X size={16} aria-hidden="true" /></button>
        </div>
      )}

      {/* dock */}
      {!replay && (
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
                  <span className="fa-paint-dot" style={{ background: paintOf(a.tail_number, paints) }} />
                  <Tail>{a.tail_number}</Tail>
                </span>
                <span className="fa-note" style={{ color: hot ? "var(--accent)" : undefined }}>
                  {lv && !lv.on_ground ? `${nm(lv.distance_nm)} · ${STAGE_LABEL[stage!].toLowerCase()}` : stage ? STAGE_LABEL[stage] : "Not in view"}
                </span>
              </button>
            );
          })}
      </div>
      )}
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
