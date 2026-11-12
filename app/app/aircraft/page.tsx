"use client";

// Aircraft: the tail numbers being watched. Add (with a registry lookup),
// edit, give one its own alert rings, remove.

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTracker } from "../_lib/store";
import { api, errorText } from "../_lib/tracker";
import {
  airportRings, channelLabel, clock, dayLabel, eventLabel, groupEvents, nm, parseUtc, planOf, ringsFor, stageOf, STAGE_LABEL, whole,
} from "../_lib/format";
import type { Aircraft } from "../_lib/types";
import { Btn, Card, Empty, Field, Modal, PageHead, Tail, Toggle } from "../_components/kit";
import RingEditor from "../_components/RingEditor";
import Plane3D from "../_components/Plane3D";
import PaintSwatches from "../_components/PaintSwatches";
import { paintOf, setPaint, usePaints } from "../_lib/paint";

type Draft = {
  id: string | null;
  tail: string;
  icao24: string;
  type: string;
  name: string;
  ownRings: boolean;
  rings: number[];
  /** Empty until the user picks one; the default for the tail number applies. */
  paint: string;
};

type Lookup = { found: boolean; tail_number?: string; icao24?: string; aircraft_type?: string };

const cleanTail = (s: string) => s.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 10);
const cleanHex = (s: string) => s.toLowerCase().replace(/[^0-9a-f]/g, "").slice(0, 6);

function blank(tail = ""): Draft {
  return { id: null, tail, icao24: "", type: "", name: "", ownRings: false, rings: [], paint: "" };
}

async function lookup(q: string): Promise<Lookup> {
  try {
    const res = await fetch(`/api/aircraft-lookup?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as Lookup) : { found: false };
  } catch {
    return { found: false };
  }
}

export default function AircraftPage() {
  const t = useTracker();
  const plan = planOf(t.me?.license_tier);
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState("");
  const [looking, setLooking] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("add") ? blank() : null
  );
  const [lookupNote, setLookupNote] = useState("");
  const paints = usePaints();

  const slotsLeft = plan.aircraft == null ? null : Math.max(0, plan.aircraft - t.aircraft.length);
  const atLimit = slotsLeft === 0;
  const defaultRings = airportRings(t.airport);
  const sendsTo = t.integrations.filter((i) => i.enabled).map((i) => channelLabel(i.type));

  const q = query.trim().toLowerCase();
  const shown = t.aircraft.filter((a) =>
    !q || [a.tail_number, a.aircraft_type, a.friendly_name, a.icao24].some((v) => (v ?? "").toLowerCase().includes(q))
  );

  function edit(a: Aircraft) {
    const own = (a.alert_distances ?? []).map(Number).filter((n) => n > 0);
    setLookupNote("");
    setDraft({
      id: a.id, tail: a.tail_number, icao24: a.icao24 ?? "", type: a.aircraft_type ?? "", name: a.friendly_name ?? "",
      ownRings: own.length > 0, rings: own.length ? own : defaultRings, paint: paints[a.tail_number] ?? "",
    });
  }

  async function quickAdd() {
    const tail = cleanTail(quick);
    if (tail.length < 3) return;
    setLooking(true);
    const r = await lookup(tail);
    setLooking(false);
    setLookupNote(r.found ? "Found in the registry. Check the details and save." : "Not found in the registry. Enter the transponder code by hand.");
    setDraft({ ...blank(r.tail_number ?? tail), icao24: r.icao24 ?? "", type: r.aircraft_type ?? "" });
    setQuick("");
  }

  const movements = groupEvents(t.recent.filter((n) => n.alert_type === "landing" || n.alert_type === "takeoff")).slice(0, 6);

  return (
    <div className="fa-page">
      <PageHead
        title="Aircraft"
        sub={<>The tail numbers FinalPing watches for you. {plan.aircraft != null ? `${t.aircraft.length} of ${plan.aircraft} slots used on ${plan.name}.` : `${t.aircraft.length} tracked.`}</>}
      >
        {t.aircraft.length > 3 && (
          <div style={{ position: "relative" }}>
            <Search size={15} aria-hidden="true" style={{ position: "absolute", left: 13, top: 12, color: "var(--faint)" }} />
            <input className="fa-input" style={{ width: 230, paddingLeft: 36, borderRadius: 999, height: 38 }} placeholder="Search tail or type"
              aria-label="Search aircraft" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        )}
        <Btn variant="primary" disabled={atLimit} onClick={() => { setLookupNote(""); setDraft(blank()); }}>
          <Plus size={16} aria-hidden="true" />Add aircraft
        </Btn>
      </PageHead>

      {atLimit && (
        <div className="fa-banner"><span>All {plan.aircraft} aircraft slots on {plan.name} are in use. <a href="/pricing" style={{ fontWeight: 600, textDecoration: "underline" }}>See plans</a></span></div>
      )}

      {t.aircraft.length === 0 ? (
        <Card><Empty title="No aircraft yet">Add a tail number below and FinalPing starts watching for it.</Empty></Card>
      ) : shown.length === 0 ? (
        <Card><Empty title="No match">Nothing tracked matches “{query}”.</Empty></Card>
      ) : (
        <div className="fa-grid fa-cols-3">
          {shown.map((a, i) => {
            const paint = paintOf(a.tail_number, paints);
            const lv = t.live.find((x) => x.tail_number === a.tail_number);
            const rings = ringsFor(a.tail_number, t.aircraft, t.airport);
            const stage = lv ? stageOf(lv, rings) : null;
            const hot = stage === "final" || stage === "inbound";
            const custom = (a.alert_distances ?? []).length > 0;
            const last = t.recent.find((n) => n.aircraft_tail === a.tail_number);
            const lastAt = parseUtc(last?.sent_at);
            return (
              <section key={a.id} className="fa-card" style={hot ? { borderColor: "rgba(56,189,248,0.45)" } : undefined}>
                <Plane3D className="bleed" tail={a.tail_number} type={a.aircraft_type} color={paint} start={-0.6 - i * 0.45} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <Tail size={22}>{a.tail_number}</Tail>
                    <div className="fa-note" style={{ marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {[a.friendly_name, a.aircraft_type].filter(Boolean).join(" · ") || "Type not set"}
                    </div>
                  </div>
                  <span className={`fa-pilltag ${hot ? "live" : stage === "airborne" ? "" : "dim"}`}>
                    <span className={`fa-dot ${hot ? "live" : stage === "airborne" ? "" : "hollow"}`} />
                    {stage ? STAGE_LABEL[stage] : "Not in view"}
                  </span>
                </div>

                <div className="fa-grid fa-cols-3 fa-keep-cols" style={{ gap: 10, margin: "16px 0 14px" }}>
                  {lv && !lv.on_ground ? (
                    <>
                      <Stat label="Distance" value={nm(lv.distance_nm)} />
                      <Stat label="Altitude" value={whole(lv.altitude_ft_msl, "ft")} />
                      <Stat label="Speed" value={whole(lv.velocity_kts, "kt")} />
                    </>
                  ) : (
                    <>
                      <Stat label="Last alert" value={last ? eventLabel(last.alert_type) : "None yet"} />
                      <Stat label="When" value={lastAt ? (dayLabel(lastAt) === "Today" ? clock(lastAt) : dayLabel(lastAt)) : "—"} />
                      <Stat label="Transponder" value={a.icao24 ? a.icao24.toUpperCase() : "Missing"} warn={!a.icao24} />
                    </>
                  )}
                </div>

                <div className="fa-kv" style={{ alignItems: "center" }}>
                  <span>Alert rings{custom ? " · custom" : ""}</span>
                  <span style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {rings.length ? rings.map((r) => <span key={r} className="fa-chip" style={{ height: 26 }}>{r} nm</span>) : <span className="fa-note">None set</span>}
                  </span>
                </div>
                <div className="fa-kv">
                  <span>Sends to</span>
                  <span style={{ textAlign: "right" }}>{sendsTo.length ? sendsTo.join(" · ") : <a className="fa-link" href="/app/integrations">Connect a channel</a>}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, paddingTop: 12, borderTop: "1px solid #1E1E1E" }}>
                  <PaintSwatches small tail={a.tail_number} value={paint} onPick={(hex) => setPaint(a.tail_number, hex)} />
                  <Btn small onClick={() => edit(a)}>Edit</Btn>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="fa-grid fa-cols-2" style={{ marginTop: 16 }}>
        <Card title="Add an aircraft">
          <p className="fa-note" style={{ marginBottom: 14 }}>Enter a tail number and FinalPing fills in the type and transponder code from the registry.</p>
          <form style={{ display: "flex", gap: 10 }} onSubmit={(e) => { e.preventDefault(); quickAdd(); }}>
            <input className="fa-input mono" placeholder="N12345" aria-label="Tail number" value={quick} disabled={atLimit}
              onChange={(e) => setQuick(cleanTail(e.target.value))} />
            <Btn type="submit" variant="primary" square disabled={atLimit || looking || quick.length < 3}>{looking ? "Looking up…" : "Look up"}</Btn>
          </form>
          {slotsLeft != null && <div className="fa-note" style={{ marginTop: 10 }}>{slotsLeft} {slotsLeft === 1 ? "slot" : "slots"} left</div>}
        </Card>

        <Card title="Recent movements" note="Takeoffs and landings">
          {movements.length === 0 && <div className="fa-row fa-note">Nothing yet.</div>}
          {movements.map((m) => (
            <div key={m.key} className="fa-row">
              <span className="mono" style={{ width: 76, fontWeight: 600 }}>{m.tail}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13.5 }}>{eventLabel(m.alertType)}</span>
                <span className="fa-note" style={{ marginLeft: 8 }}>
                  {m.channels.length ? `alerted ${m.channels.join(", ")}` : ""}
                  {m.failed.length ? <span style={{ color: "var(--warn)" }}> {m.failed.join(", ")} failed</span> : null}
                </span>
              </span>
              <span className="mono fa-note">{dayLabel(m.time)} {clock(m.time)}</span>
            </div>
          ))}
        </Card>
      </div>

      {draft && (
        <AircraftModal
          draft={draft} note={lookupNote} defaultRings={defaultRings} maxRings={plan.rings}
          onClose={() => setDraft(null)}
          onSaved={async () => { setDraft(null); await t.reload(); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="fa-note" style={{ fontSize: 11.5 }}>{label}</div>
      <div className="mono" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2, color: warn ? "var(--warn)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
}

function AircraftModal({
  draft, note, defaultRings, maxRings, onClose, onSaved,
}: {
  draft: Draft; note: string; defaultRings: number[]; maxRings: number | null; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const [d, setD] = useState<Draft>(draft);
  const [msg, setMsg] = useState(note);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isNew = d.id === null;
  const paints = usePaints();
  const paint = d.paint || paintOf(d.tail || "N", paints);

  async function fill() {
    const q = d.tail.length >= 3 ? d.tail : d.icao24;
    if (q.length < 3) return;
    setBusy(true); setErr("");
    const r = await lookup(q);
    setBusy(false);
    if (!r.found) { setMsg("Not found in the registry. Enter the transponder code by hand."); return; }
    setMsg("Found in the registry.");
    setD((x) => ({ ...x, tail: r.tail_number ?? x.tail, icao24: r.icao24 ?? x.icao24, type: x.type || r.aircraft_type || "" }));
  }

  async function save() {
    setErr("");
    if (d.tail.length < 3) { setErr("Enter the tail number (at least 3 characters)."); return; }
    if (d.icao24.length !== 6) { setErr("The transponder code is 6 characters, digits and the letters A to F. Use Look up to fill it in."); return; }
    if (d.ownRings && d.rings.length === 0) { setErr("Add at least one ring, or switch back to the airport's rings."); return; }
    const body = {
      tail_number: d.tail,
      icao24: d.icao24,
      friendly_name: d.name.trim(),
      aircraft_type: d.type.trim(),
      alert_distances: d.ownRings ? [...d.rings].sort((a, b) => b - a) : [],
    };
    setBusy(true);
    try {
      if (isNew) await api("aircraft", { method: "POST", body });
      else await api(`aircraft/${d.id}`, { method: "PUT", body });
      if (d.paint) setPaint(d.tail, d.paint);
      await onSaved();
    } catch (e) {
      setErr(errorText(e));
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true); setErr("");
    try {
      await api(`aircraft/${d.id}`, { method: "DELETE" });
      await onSaved();
    } catch (e) {
      setErr(errorText(e));
      setBusy(false);
    }
  }

  if (confirmDelete) {
    return (
      <Modal title={`Stop tracking ${d.tail}?`} sub="Its alerts stop right away. Past alerts stay in Logs." onClose={onClose}>
        {err && <div className="fa-error" role="alert">{err}</div>}
        <div className="fa-modal-actions">
          <Btn onClick={() => setConfirmDelete(false)} disabled={busy}>Keep it</Btn>
          <Btn variant="danger" onClick={remove} disabled={busy}>{busy ? "Removing…" : "Stop tracking"}</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={isNew ? "Add aircraft" : `Edit ${draft.tail}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); save(); }} style={{ marginTop: 14 }}>
        <Plane3D className="inset" tail={d.tail || "the new aircraft"} type={d.type} color={paint} height={150} />
        <Field label="Tail number">
          <div style={{ display: "flex", gap: 8 }}>
            <input className="fa-input mono" value={d.tail} placeholder="N12345" autoFocus={isNew && !d.tail}
              onChange={(e) => setD({ ...d, tail: cleanTail(e.target.value) })} />
            <Btn square onClick={fill} disabled={busy || (d.tail.length < 3 && d.icao24.length < 6)}>Look up</Btn>
          </div>
        </Field>
        {msg && <div className="fa-note" style={{ margin: "-6px 0 14px" }} role="status">{msg}</div>}
        <Field label="Transponder code (ICAO hex)" hint="Six characters, like A1B2C3. This is how the aircraft is recognized in the air.">
          <input className="fa-input mono" value={d.icao24.toUpperCase()} placeholder="A1B2C3" onChange={(e) => setD({ ...d, icao24: cleanHex(e.target.value) })} />
        </Field>
        <Field label="Type">
          <input className="fa-input" value={d.type} placeholder="Cessna 172S" maxLength={60} onChange={(e) => setD({ ...d, type: e.target.value })} />
        </Field>
        <Field label="Nickname (optional)">
          <input className="fa-input" value={d.name} placeholder="Club Skyhawk" maxLength={60} onChange={(e) => setD({ ...d, name: e.target.value })} />
        </Field>
        <Field label="Paint colour" hint="Shown on its model and its map marker. Saved in this browser.">
          <PaintSwatches tail={d.tail} value={paint} onPick={(hex) => setD({ ...d, paint: hex })} />
        </Field>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0 10px", borderTop: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Its own alert rings</div>
            <div className="fa-note">Off = use the airport&apos;s rings{defaultRings.length ? ` (${defaultRings.join(", ")} nm)` : ""}.</div>
          </div>
          <Toggle on={d.ownRings} label="Give this aircraft its own alert rings"
            onChange={(on) => setD({ ...d, ownRings: on, rings: d.rings.length ? d.rings : defaultRings })} />
        </div>
        {d.ownRings && <RingEditor rings={d.rings} max={maxRings} onChange={(rings) => setD({ ...d, rings })} />}

        {err && <div className="fa-error" role="alert">{err}</div>}
        <div className="fa-modal-actions" style={{ justifyContent: "space-between" }}>
          <span>{!isNew && <Btn variant="danger" onClick={() => setConfirmDelete(true)} disabled={busy}>Remove</Btn>}</span>
          <span style={{ display: "flex", gap: 10 }}>
            <Btn onClick={onClose} disabled={busy}>Cancel</Btn>
            <Btn type="submit" variant="primary" disabled={busy}>{busy ? "Saving…" : isNew ? "Add aircraft" : "Save"}</Btn>
          </span>
        </div>
      </form>
    </Modal>
  );
}
