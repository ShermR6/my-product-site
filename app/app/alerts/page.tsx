"use client";

// Alerts: which event goes to which channel, quiet hours, and the wording.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTracker } from "../_lib/store";
import { api, errorText } from "../_lib/tracker";
import { airportRings, channelLabel, ringKey } from "../_lib/format";
import type { AlertSetting, Routing } from "../_lib/types";
import { Btn, Card, Check, PageHead, Toggle } from "../_components/kit";

type EventRow = { type: string; label: string; hint: string };

const VARIABLES: { key: string; label: string }[] = [
  { key: "tail", label: "tail" },
  { key: "distance", label: "distance" },
  { key: "eta", label: "eta" },
  { key: "runway", label: "runway" },
  { key: "airport", label: "airport" },
  { key: "speed", label: "speed" },
  { key: "altitude", label: "altitude" },
  { key: "time", label: "time" },
];
const KNOWN = new Set([...VARIABLES.map((v) => v.key), "tail_number"]);

/** The wording the tracker uses when no custom message is saved. Keep in step with tracker.get_default_template. */
function defaultTemplate(type: string): string {
  if (type === "landing") return "✅ **{tail_number}** has landed at **{airport}** – {runway}";
  if (type === "takeoff") return "🛫 **{tail_number}** – takeoff from **{airport}**\nAlt {altitude}ft MSL, {speed}kts";
  return `**{tail_number}** – **${type}** from **{airport}**\nETA ~{eta}min, Alt {altitude}ft MSL, {speed}kts`;
}

function unknownVariables(template: string): string[] {
  const bad: string[] = [];
  for (const m of template.matchAll(/\{([^{}]*)\}/g)) if (!KNOWN.has(m[1])) bad.push(`{${m[1]}}`);
  const stripped = template.replace(/\{[^{}]*\}/g, "");
  if (/[{}]/.test(stripped)) bad.push("a stray { or }");
  return [...new Set(bad)];
}

function fill(template: string, sample: Record<string, string>): string {
  return template.replace(/\{([^{}]*)\}/g, (whole, k: string) => sample[k] ?? whole);
}

/** Discord-style **bold** as real bold, for the preview only. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

export default function AlertsPage() {
  const t = useTracker();
  const rings = useMemo(() => airportRings(t.airport), [t.airport]);

  const events = useMemo<EventRow[]>(() => {
    const hints = ["The first heads-up", "Getting close", "On short final"];
    const rows: EventRow[] = rings.map((r, i) => ({
      type: ringKey(r),
      label: `Crosses ${r} nm`,
      hint: i === 0 ? hints[0] : i === rings.length - 1 ? hints[2] : hints[1],
    }));
    rows.push({ type: "landing", label: "Landed", hint: "Wheels down at your airport" });
    rows.push({ type: "takeoff", label: "Took off", hint: "Departed your airport" });
    return rows;
  }, [rings]);

  // ── routing ──
  const [routing, setRouting] = useState<Routing | null>(null);
  const [routingDirty, setRoutingDirty] = useState(false);
  // ── quiet hours ──
  const [quiet, setQuiet] = useState<{ on: boolean; start: string; end: string } | null>(null);
  const [quietDirty, setQuietDirty] = useState(false);
  // ── messages ──
  const [settings, setSettings] = useState<AlertSetting[] | null>(null);
  const [editing, setEditing] = useState<string>("");
  const [text, setText] = useState("");
  const [textDirty, setTextDirty] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [msgNote, setMsgNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let live = true;
    api<{ routing: Routing }>("settings/routing").then((r) => { if (live) setRouting(r.routing ?? {}); }).catch(() => { if (live) setRouting({}); });
    api<AlertSetting[]>("settings/alerts").then((s) => { if (live) setSettings(s); }).catch(() => { if (live) setSettings([]); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (quietDirty || !t.airport) return;
    setQuiet({ on: !!t.airport.quiet_hours_enabled, start: t.airport.quiet_hours_start || "23:00", end: t.airport.quiet_hours_end || "06:00" });
  }, [t.airport, quietDirty]);

  const editType = editing || events[0]?.type || "landing";
  const savedTemplate = settings?.find((s) => s.alert_type === editType)?.message_template;
  useEffect(() => {
    if (textDirty || settings === null) return;
    setText(savedTemplate ?? defaultTemplate(editType));
  }, [editType, savedTemplate, settings, textDirty]);

  const isOn = (type: string, id: string) => !(routing?.[type] ?? []).includes(id);

  function toggle(type: string, id: string, on: boolean) {
    setRouting((r) => {
      const next: Routing = { ...(r ?? {}) };
      const off = new Set(next[type] ?? []);
      if (on) off.delete(id); else off.add(id);
      if (off.size) next[type] = [...off]; else delete next[type];
      return next;
    });
    setRoutingDirty(true); setOk(""); setErr("");
  }

  async function save() {
    setBusy(true); setErr(""); setOk("");
    try {
      if (routingDirty && routing) {
        const r = await api<{ routing: Routing }>("settings/routing", { method: "PUT", body: { routing } });
        setRouting(r.routing ?? {});
        setRoutingDirty(false);
      }
      if (quietDirty && quiet) {
        await api("airport/config", { method: "POST", body: { quiet_hours_enabled: quiet.on, quiet_hours_start: quiet.start, quiet_hours_end: quiet.end } });
        setQuietDirty(false);
        await t.reload();
      }
      setOk("Saved.");
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const problems = unknownVariables(text);
  const editable = /^(\d+nm|landing|takeoff)$/.test(editType);

  async function saveMessage(template: string) {
    setMsgNote(null);
    if (!template.trim()) { setMsgNote({ ok: false, text: "The message can't be empty." }); return; }
    setBusy(true);
    try {
      const s = await api<AlertSetting>("settings/alerts", { method: "POST", body: { alert_type: editType, enabled: true, message_template: template } });
      setSettings((list) => [...(list ?? []).filter((x) => x.alert_type !== editType), s]);
      setText(template); setTextDirty(false);
      setMsgNote({ ok: true, text: "Message saved." });
    } catch (e) {
      setMsgNote({ ok: false, text: errorText(e) });
    } finally {
      setBusy(false);
    }
  }

  function insert(key: string) {
    setText((s) => `${s}${s && !/\s$/.test(s) ? " " : ""}{${key}}`);
    setTextDirty(true); setMsgNote(null);
  }

  const sampleTail = t.aircraft[0]?.tail_number ?? "N172AK";
  const sample: Record<string, string> = {
    tail: sampleTail, tail_number: sampleTail,
    distance: editType.endsWith("nm") ? editType.replace("nm", "") : "0.4",
    altitude: "1400", eta: "3", speed: "92",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
    airport: t.airport?.airport_code ?? "KDTO", runway: "Runway 18",
  };

  const dirty = routingDirty || quietDirty;
  const cols = t.integrations;

  return (
    <div className="fa-page">
      <PageHead title="Alerts" sub="What triggers an alert, where it goes and what it says.">
        <Btn variant="primary" disabled={!dirty || busy} onClick={save}>{busy && dirty ? "Saving…" : "Save changes"}</Btn>
      </PageHead>

      {err && <div className="fa-banner bad" role="alert">{err}</div>}
      {ok && <div className="fa-banner" role="status">{ok}</div>}

      <div className="fa-table-wrap" style={{ marginBottom: 16 }}>
        <div style={{ padding: "16px 22px 12px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span className="fa-card-title">Events and routing</span>
          <span className="fa-card-note">Untick a box to keep that event out of that channel.</span>
        </div>
        {t.hasAirport === false ? (
          <div className="fa-empty"><strong>No airport yet</strong>Events appear once you <Link className="fa-link" href="/app/airport">pick your airport</Link>.</div>
        ) : cols.length === 0 ? (
          <div className="fa-empty"><strong>No channels connected</strong>Alerts have nowhere to go yet. <Link className="fa-link" href="/app/integrations">Connect a channel</Link></div>
        ) : (
          <div className="fa-table-scroll">
            <table className="fa-table fa-routing" style={{ "--cols": cols.length } as React.CSSProperties}>
              <thead>
                <tr>
                  <th>Event</th>
                  {cols.map((c) => (
                    <th key={c.id} className="ch">{channelLabel(c.type)}{!c.enabled && " (off)"}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const silent = routing !== null && cols.filter((c) => c.enabled).every((c) => !isOn(ev.type, c.id));
                  return (
                    <tr key={ev.type}>
                      <td style={{ height: 58 }}>
                        <div style={{ fontWeight: 600 }}>{ev.label}</div>
                        <div className="fa-note" style={silent ? { color: "var(--warn)" } : undefined}>{silent ? "Not sent anywhere" : ev.hint}</div>
                      </td>
                      {cols.map((c) => (
                        <td key={c.id} style={{ textAlign: "center" }}>
                          <Check on={c.enabled && isOn(ev.type, c.id)} disabled={!c.enabled || routing === null}
                            label={`Send “${ev.label}” to ${channelLabel(c.type)}`} onChange={(on) => toggle(ev.type, c.id, on)} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="fa-grid fa-cols-2" style={{ alignItems: "start" }}>
        <Card title="Quiet hours" note="In the airport's local time">
          {!quiet ? (
            <p className="fa-note">{t.hasAirport === false ? "Pick your airport first." : "Loading…"}</p>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 13.5 }}>Hold all alerts overnight</span>
                <Toggle on={quiet.on} label="Quiet hours" onChange={(on) => { setQuiet({ ...quiet, on }); setQuietDirty(true); setOk(""); }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", opacity: quiet.on ? 1 : 0.5 }}>
                <span className="fa-note">No alerts between</span>
                <input type="time" className="fa-input mono" style={{ width: 150 }} aria-label="Quiet hours start" value={quiet.start} disabled={!quiet.on}
                  onChange={(e) => { setQuiet({ ...quiet, start: e.target.value || quiet.start }); setQuietDirty(true); setOk(""); }} />
                <span className="fa-note">and</span>
                <input type="time" className="fa-input mono" style={{ width: 150 }} aria-label="Quiet hours end" value={quiet.end} disabled={!quiet.on}
                  onChange={(e) => { setQuiet({ ...quiet, end: e.target.value || quiet.end }); setQuietDirty(true); setOk(""); }} />
              </div>
              <QuietBar on={quiet.on} start={quiet.start} end={quiet.end} />
            </>
          )}
        </Card>

        <Card title="Message">
          <div className="fa-label">When this happens</div>
          <select className="fa-input" value={editType} aria-label="Event to edit"
            onChange={(e) => { setEditing(e.target.value); setTextDirty(false); setMsgNote(null); }}>
            {events.map((ev) => <option key={ev.type} value={ev.type}>{ev.label}</option>)}
          </select>

          {!editable ? (
            <p className="fa-note" style={{ marginTop: 12 }}>Custom wording is available for whole-number rings. This ring uses the standard message.</p>
          ) : (
            <>
              <textarea className="fa-input mono" style={{ marginTop: 12, fontSize: 13 }} rows={4} maxLength={500} aria-label="Message wording"
                value={text} onChange={(e) => { setText(e.target.value); setTextDirty(true); setMsgNote(null); }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {VARIABLES.map((v) => (
                  <button key={v.key} type="button" className="fa-chip selectable" style={{ height: 26, fontSize: 11.5 }} onClick={() => insert(v.key)}>+ {v.label}</button>
                ))}
              </div>
              {problems.length > 0 && (
                <div className="fa-error" role="alert" style={{ color: "var(--warn)" }}>
                  {problems.join(", ")} isn&apos;t something FinalPing can fill in. The standard message would be sent instead.
                </div>
              )}

              <div className="fa-label" style={{ marginTop: 16 }}>Preview</div>
              <div className="fa-preview-msg">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <strong style={{ fontSize: 12.5 }}>FinalPing</strong><span className="fa-note" style={{ fontSize: 11.5 }}>now</span>
                </div>
                <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.5 }}><Rich text={fill(problems.length ? defaultTemplate(editType) : text, sample)} /></div>
              </div>

              {msgNote && <div className={msgNote.ok ? "fa-ok" : "fa-error"} role="status">{msgNote.text}</div>}
              <div className="fa-modal-actions" style={{ marginTop: 14 }}>
                <Btn disabled={busy || (savedTemplate ?? defaultTemplate(editType)) === defaultTemplate(editType) && !textDirty}
                  onClick={() => saveMessage(defaultTemplate(editType))}>Reset to standard</Btn>
                <Btn variant="primary" disabled={busy || !textDirty || problems.length > 0} onClick={() => saveMessage(text)}>Save message</Btn>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

/** A 24-hour bar with the quiet stretch filled in. */
function QuietBar({ on, start, end }: { on: boolean; start: string; end: string }) {
  const frac = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return ((h || 0) * 60 + (m || 0)) / 1440;
  };
  const s = frac(start);
  const e = frac(end);
  const spans = s <= e ? [[s, e]] : [[0, e], [s, 1]];
  return (
    <div style={{ marginTop: 18 }} aria-hidden="true">
      <div style={{ position: "relative", height: 8, borderRadius: 4, background: "var(--panel-3)", overflow: "hidden" }}>
        {on && spans.map(([a, b], i) => (
          <span key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${a * 100}%`, width: `${(b - a) * 100}%`, background: "var(--text)" }} />
        ))}
      </div>
      <div className="mono" style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10.5, color: "var(--faint)" }}>
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
      </div>
    </div>
  );
}
