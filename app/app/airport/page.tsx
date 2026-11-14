"use client";

// Airport: where FinalPing watches and how far out it starts telling you.

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import { useTracker } from "../_lib/store";
import { api, errorText } from "../_lib/tracker";
import { airportRings, endHeading, headingGap, planOf } from "../_lib/format";
import type { AirportMatch, Runway, SavedLocation } from "../_lib/types";
import { Btn, Card, Modal, PageHead, Tail, Toggle } from "../_components/kit";
import RingEditor from "../_components/RingEditor";
import AirportSearch, { findAirports } from "../_components/AirportSearch";

const MapGL = dynamic(() => import("../_components/MapGL"), { ssr: false });

type Draft = {
  code: string;
  name: string;
  lat: number;
  lon: number;
  elev: number;
  rings: number[];
  runways: Runway[];
  approachOnly: boolean;
  headings: number[];
};

type RunwayEnd = { ident: string; heading: number };

function runwayEnds(runways: Runway[]): RunwayEnd[] {
  const out: RunwayEnd[] = [];
  for (const r of runways) {
    for (const [ident, hdg] of [[r.leIdent, r.leHdg], [r.heIdent, r.heHdg]] as const) {
      const h = endHeading(ident, hdg);
      if (!ident || h == null) continue;
      const heading = Math.round(h) % 360;
      // Parallel runways share a heading, and the tracker filters by heading, so they are one choice.
      const twin = out.find((e) => headingGap(e.heading, heading) <= 3 && parseInt(e.ident, 10) === parseInt(ident, 10));
      if (twin) { if (!twin.ident.split(" / ").includes(ident)) twin.ident += ` / ${ident}`; }
      else out.push({ ident, heading });
    }
  }
  return out;
}

const same = (a: number, b: number) => headingGap(a, b) < 1;

/** Runways with their two ends surveyed, so they can be drawn where they really are. */
const placed = (runways: Runway[]) => runways.length > 0 && runways.every((r) => r.leLat != null && r.heLat != null);

export default function AirportPage() {
  const t = useTracker();
  const plan = planOf(t.me?.license_tier);

  const saved = useMemo<Draft | null>(() => {
    const a = t.airport;
    if (!a) return null;
    const list = (a.approach_runway_headings ?? []).map(Number).filter((n) => isFinite(n));
    return {
      code: a.airport_code ?? "", name: a.airport_name ?? "", lat: Number(a.latitude), lon: Number(a.longitude),
      elev: a.elevation_ft_msl ?? 0, rings: airportRings(a), runways: a.runway_info ?? [],
      approachOnly: !!a.approach_corridor_enabled,
      headings: list.length ? list : a.approach_runway_heading != null ? [Number(a.approach_runway_heading)] : [],
    };
  }, [t.airport]);

  const [draft, setDraft] = useState<Draft | null>(saved);
  const [dirty, setDirty] = useState(false);
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [locations, setLocations] = useState<SavedLocation[] | null>(null);
  const [locErr, setLocErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [fitSeq, setFitSeq] = useState(0);

  // Follow the saved settings until the person starts editing.
  useEffect(() => { if (!dirty) setDraft(saved); }, [saved, dirty]);

  // Runway detection: an airport set up before the web app (or in the desktop app) may have no
  // runways saved, or runways without their positions. Look them up once and keep them.
  const [found, setFound] = useState("");
  const looked = useRef("");
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const reload = t.reload;
  useEffect(() => {
    if (!saved?.code || placed(saved.runways) || looked.current === saved.code) return;
    looked.current = saved.code;
    const code = saved.code;
    const have = saved.runways.length;
    (async () => {
      const match = (await findAirports(code)).find((m) => m.icao === code);
      if (!mounted.current || !match?.runways.length) return;
      if (!placed(match.runways) && have >= match.runways.length) return;
      try {
        await api("airport/config", { method: "POST", body: { runway_info: match.runways } });
        if (!mounted.current) return;
        setDraft((d) => (d && d.code === code ? { ...d, runways: match.runways } : d));
        setFound(`Found ${match.runways.length === 1 ? "the runway" : `${match.runways.length} runways`} at ${code}.`);
        await reload();
      } catch { /* still shown from the saved copy */ }
    })();
  }, [saved, reload]);

  async function loadLocations() {
    try { setLocations(await api<SavedLocation[]>("locations")); } catch { setLocations([]); }
  }
  useEffect(() => { loadLocations(); }, []);

  function change(patch: Partial<Draft>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setDirty(true); setOk(""); setErr("");
  }

  function pick(a: AirportMatch) {
    setDraft((d) => ({
      code: a.icao, name: a.name, lat: a.lat, lon: a.lon, elev: a.elev, runways: a.runways,
      rings: d?.rings.length ? d.rings : [10, 5, 2].slice(0, plan.rings ?? 3),
      approachOnly: d?.approachOnly ?? false, headings: [],
    }));
    setDirty(true); setChanging(false); setOk(""); setErr("");
  }

  async function save() {
    if (!draft) return;
    if (draft.rings.length === 0) { setErr("Add at least one alert ring."); return; }
    setBusy(true); setErr(""); setOk("");
    const headings = draft.approachOnly ? draft.headings : [];
    try {
      await api("airport/config", {
        method: "POST",
        body: {
          airport_code: draft.code, airport_name: draft.name,
          latitude: String(draft.lat), longitude: String(draft.lon), elevation_ft_msl: draft.elev,
          alert_distances_nm: [...draft.rings].sort((a, b) => b - a),
          runway_info: draft.runways,
          approach_corridor_enabled: draft.approachOnly,
          approach_runway_headings: headings,
          approach_runway_heading: headings.length ? headings[0] : null,
        },
      });
      setDirty(false);
      await t.reload();
      setOk("Saved. The tracker is using the new settings now.");
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function addLocation(a: AirportMatch) {
    setLocErr("");
    try {
      await api("locations", { method: "POST", body: { name: a.name, airport_code: a.icao, latitude: String(a.lat), longitude: String(a.lon), elevation_ft_msl: a.elev } });
      setAdding(false);
      await loadLocations();
    } catch (e) {
      setAdding(false);
      setLocErr(errorText(e));
    }
  }

  async function switchTo(loc: SavedLocation) {
    setBusy(true); setLocErr("");
    try {
      await api(`locations/${loc.id}/activate`, { method: "POST" });
      // Activating moves the airport's position; fill in its name and runways too.
      const match = loc.airport_code ? (await findAirports(loc.airport_code)).find((m) => m.icao === loc.airport_code) : undefined;
      await api("airport/config", {
        method: "POST",
        body: {
          airport_code: loc.airport_code ?? "", airport_name: match?.name ?? loc.name,
          latitude: loc.latitude, longitude: loc.longitude, elevation_ft_msl: loc.elevation_ft_msl ?? 0,
          runway_info: match?.runways ?? [], approach_runway_headings: [], approach_runway_heading: null,
        },
      });
      setDirty(false);
      await Promise.all([t.reload(), loadLocations()]);
    } catch (e) {
      setLocErr(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function removeLocation(loc: SavedLocation) {
    setLocErr("");
    try { await api(`locations/${loc.id}`, { method: "DELETE" }); await loadLocations(); } catch (e) { setLocErr(errorText(e)); }
  }

  const ends = draft ? runwayEnds(draft.runways) : [];
  const center = useMemo(() => (draft && isFinite(draft.lat) && isFinite(draft.lon) ? { lat: draft.lat, lon: draft.lon } : null), [draft]);
  const sortedRings = draft ? [...draft.rings].sort((a, b) => b - a) : [];

  return (
    <div className="fa-page">
      <PageHead title="Airport" sub="Where FinalPing watches, and how far out it starts telling you.">
        {draft && (
          <>
            <Btn disabled={!dirty || busy} onClick={() => { setDraft(saved); setDirty(false); setErr(""); }}>Discard</Btn>
            <Btn variant="primary" disabled={!dirty || busy} onClick={save}>{busy ? "Saving…" : "Save changes"}</Btn>
          </>
        )}
      </PageHead>

      {err && <div className="fa-banner bad" role="alert">{err}</div>}
      {(ok || found) && <div className="fa-banner" role="status">{ok || found}</div>}

      {!draft ? (
        <Card title="Pick your home airport">
          <p className="fa-note" style={{ marginBottom: 14 }}>FinalPing alerts you when your aircraft approach this airport.</p>
          <AirportSearch onPick={pick} autoFocus />
        </Card>
      ) : (
        <div className="fa-split-form">
          <div className="fa-stack">
            <Card title="Home airport">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Tail size={26}>{draft.code || "—"}</Tail>
                <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{draft.name || "Custom location"}</div>
                <Btn small onClick={() => setChanging(true)}>Change</Btn>
              </div>
              <div className="fa-note mono" style={{ marginTop: 10 }}>
                {draft.lat.toFixed(4)}, {draft.lon.toFixed(4)} · elevation {Math.round(draft.elev).toLocaleString()} ft
              </div>
            </Card>

            <Card title="Alert rings" note={plan.rings != null ? `${draft.rings.length} of ${plan.rings}` : undefined}>
              <RingEditor rings={draft.rings} max={plan.rings} onChange={(rings) => change({ rings })} />
              <p className="fa-note" style={{ marginTop: 12 }}>One alert each time a tracked aircraft crosses a ring inbound. Any aircraft can override these with its own.</p>
            </Card>

            <Card title="Runways" note={draft.runways.length ? `${draft.runways.length} found` : undefined}>
              {draft.runways.length === 0 ? (
                <p className="fa-note">No runway data for this airport. Alerts still work; FinalPing just can&apos;t tell which runway an aircraft is lined up for.</p>
              ) : (
                draft.runways.map((r, i) => (
                  <div key={i} className="fa-row">
                    <span className="mono" style={{ width: 92, fontWeight: 600 }}>{[r.leIdent, r.heIdent].filter(Boolean).join(" / ") || "—"}</span>
                    <span className="fa-note" style={{ flex: 1 }}>
                      {[r.leIdent, r.heIdent].map((id, k) => {
                        const h = endHeading(id, k === 0 ? r.leHdg : r.heHdg);
                        return h == null ? null : `${String(Math.round(h) % 360 || 360).padStart(3, "0")}°`;
                      }).filter(Boolean).join(" and ")}
                    </span>
                    <span className="mono fa-note">{r.lengthFt ? `${Math.round(r.lengthFt).toLocaleString()} ft` : ""}</span>
                  </div>
                ))
              )}
              {draft.runways.length > 0 && (
                <p className="fa-note" style={{ marginTop: 10 }}>
                  Drawn on the map. When an aircraft is inbound, FinalPing shows which of these it is lined up for.
                </p>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: 14, paddingTop: 14, borderTop: "1px solid #1E1E1E" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>Only alert on approach</div>
                  <p className="fa-note" style={{ marginTop: 4 }}>Skip flyovers and departures. Alert only when the aircraft is heading for the field.</p>
                </div>
                <Toggle on={draft.approachOnly} label="Only alert on approach" onChange={(on) => change({ approachOnly: on })} />
              </div>
              {draft.approachOnly && ends.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="fa-label">Landing runways</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {ends.map((e) => {
                      const on = draft.headings.some((h) => same(h, e.heading));
                      return (
                        <button key={e.ident} type="button" className="fa-chip selectable" aria-pressed={on}
                          onClick={() => change({ headings: on ? draft.headings.filter((h) => !same(h, e.heading)) : [...draft.headings, e.heading] })}>
                          {e.ident}
                        </button>
                      );
                    })}
                  </div>
                  <p className="fa-note" style={{ marginTop: 10 }}>
                    {draft.headings.length === 0
                      ? "None picked: any direction toward the field counts."
                      : "Alerts go out only for aircraft lined up with a picked runway (within 35°). Its approach path is dashed on the map."}
                  </p>
                </div>
              )}
            </Card>

            <Card title="Saved locations" note={<button className="fa-link" onClick={() => { setLocErr(""); setAdding(true); }}>+ Add location</button>}>
              {locErr && <div className="fa-error" role="alert" style={{ marginBottom: 8 }}>{locErr}</div>}
              {locations === null && <div className="fa-row fa-note">Loading…</div>}
              {locations?.length === 0 && <div className="fa-row fa-note">Save a second airport here to switch between them in one click.</div>}
              {locations?.map((loc) => (
                <div key={loc.id} className="fa-row">
                  <span className="mono" style={{ width: 58, fontWeight: 600 }}>{loc.airport_code || "—"}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.name}</span>
                  {loc.is_active ? (
                    <span className="fa-pilltag">Active</span>
                  ) : (
                    <>
                      <Btn small disabled={busy} onClick={() => switchTo(loc)}>Switch</Btn>
                      <button className="fa-link fa-note" onClick={() => removeLocation(loc)} aria-label={`Remove ${loc.name}`}>Remove</button>
                    </>
                  )}
                </div>
              ))}
            </Card>
          </div>

          <div className="fa-mapcard fa-preview">
            <MapGL center={center} code={draft.code} rings={sortedRings} runways={draft.runways} approach={draft.approachOnly ? draft.headings : []} fitSeq={fitSeq} embedded />
            <div className="fa-map-layers">
              <span className="fa-map-chip">Updates as you edit</span>
              <button className="fa-map-chip" onClick={() => setFitSeq((n) => n + 1)} aria-label="Center on the airport">
                <Crosshair size={13} aria-hidden="true" />{draft.code || "Center"}
              </button>
            </div>
          </div>
        </div>
      )}

      {changing && (
        <Modal title="Change airport" sub="Your rings stay as they are. Runway choices reset." onClose={() => setChanging(false)}>
          <AirportSearch onPick={pick} autoFocus />
          <div className="fa-modal-actions"><Btn onClick={() => setChanging(false)}>Cancel</Btn></div>
        </Modal>
      )}
      {adding && (
        <Modal title="Add a saved location" onClose={() => setAdding(false)}>
          <AirportSearch onPick={addLocation} autoFocus />
          <div className="fa-modal-actions"><Btn onClick={() => setAdding(false)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}
