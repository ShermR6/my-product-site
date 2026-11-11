"use client";

// Integrations: where alerts get delivered. Connect, test, edit, pause, remove.

import { useState } from "react";
import { useTracker } from "../_lib/store";
import { api, ApiError, errorText } from "../_lib/tracker";
import { CHANNELS, channelLabel, clock, dayLabel, parseUtc, planOf } from "../_lib/format";
import type { Integration } from "../_lib/types";
import { Btn, Field, Modal, PageHead, Toggle } from "../_components/kit";

type FieldSpec = { key: string; label: string; placeholder: string; hint?: string; secret?: boolean; optional?: boolean; check?: (v: string) => string | null };

const isUrl = (v: string) => (/^https:\/\/\S+$/i.test(v) ? null : "Enter the full address, starting with https://");

const SPECS: Record<string, { blurb: string; fields: FieldSpec[] }> = {
  discord: {
    blurb: "Post into any channel on your server.",
    fields: [{ key: "webhook_url", label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/…", secret: true, check: isUrl,
      hint: "In Discord: channel settings, Integrations, Webhooks, New Webhook, Copy Webhook URL." }],
  },
  email: {
    blurb: "An email for every alert.",
    fields: [{ key: "to_email", label: "Send to", placeholder: "you@example.com",
      check: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Enter one email address.") }],
  },
  sms: {
    blurb: "A text message to your phone.",
    fields: [{ key: "to_phone", label: "Mobile number", placeholder: "+19405551234", hint: "Include the country code, like +1 for the US.",
      check: (v) => (/^\+[1-9]\d{7,14}$/.test(v.replace(/[\s().-]/g, "")) ? null : "Enter the number with its country code, like +19405551234.") }],
  },
  slack: {
    blurb: "Post into any channel in your workspace.",
    fields: [{ key: "webhook_url", label: "Incoming webhook URL", placeholder: "https://hooks.slack.com/services/…", secret: true, check: isUrl }],
  },
  teams: {
    blurb: "Post into a Teams channel.",
    fields: [{ key: "webhook_url", label: "Webhook URL", placeholder: "https://…webhook.office.com/…", secret: true, check: isUrl }],
  },
  google_chat: {
    blurb: "Post into a Google Chat space.",
    fields: [{ key: "webhook_url", label: "Webhook URL", placeholder: "https://chat.googleapis.com/v1/spaces/…", secret: true, check: isUrl }],
  },
  telegram: {
    blurb: "A chat or group through your own Telegram bot.",
    fields: [
      { key: "bot_token", label: "Bot token", placeholder: "123456789:AA…", secret: true, hint: "From @BotFather when you create the bot.",
        check: (v) => (/^\d+:[\w-]{20,}$/.test(v) ? null : "That doesn't look like a bot token.") },
      { key: "chat_id", label: "Chat ID", placeholder: "-1001234567890", check: (v) => (/^-?\d+$|^@\w+$/.test(v) ? null : "A chat ID is a number, or @channelname.") },
    ],
  },
  webhook: {
    blurb: "Send each alert as JSON to any URL.",
    fields: [
      { key: "webhook_url", label: "URL", placeholder: "https://example.com/hooks/finalping", check: isUrl },
      { key: "secret", label: "Signing secret (optional)", placeholder: "Leave empty for none", secret: true, optional: true },
    ],
  },
};

const ORDER = ["discord", "email", "sms", "telegram", "slack", "teams", "google_chat", "webhook"];

function summary(i: Integration): string {
  const c = i.config ?? {};
  if (i.type === "email") return String(c.to_email ?? "");
  if (i.type === "sms") return String(c.to_phone ?? "").replace(/.(?=.{4})/g, "•");
  if (i.type === "telegram") return c.chat_id ? `Chat ${c.chat_id}` : "";
  const url = String(c.webhook_url ?? c.url ?? "");
  try { return new URL(url).hostname; } catch { return ""; }
}

export default function IntegrationsPage() {
  const t = useTracker();
  const plan = planOf(t.me?.license_tier);
  const [edit, setEdit] = useState<{ type: string; existing: Integration | null } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [pageErr, setPageErr] = useState("");

  const connected = [...t.integrations].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
  const have = new Set(connected.map((i) => i.type));
  const available = ORDER.filter((k) => !have.has(k));
  const atLimit = plan.integrations != null && connected.length >= plan.integrations;

  const weekAgo = t.now - 7 * 86400000;
  function stats(type: string) {
    let ok = 0, total = 0;
    let last: Date | null = null;
    for (const n of t.recent) {
      if (n.integration_type !== type) continue;
      const at = parseUtc(n.sent_at);
      if (!at) continue;
      if (!last || at > last) last = at;
      if (at.getTime() < weekAgo) continue;
      total += 1;
      if (["sent", "success"].includes(String(n.status).toLowerCase())) ok += 1;
    }
    return { ok, total, last };
  }

  async function test(i: Integration) {
    setTesting(i.id);
    setNotes((n) => ({ ...n, [i.id]: { ok: true, text: "Sending…" } }));
    try {
      await api(`integrations/${i.id}/test`, { method: "POST" });
      setNotes((n) => ({ ...n, [i.id]: { ok: true, text: `Test sent to ${channelLabel(i.type)}. Check that it arrived.` } }));
    } catch (e) {
      const text = e instanceof ApiError && e.status === 429 ? "Too many tests in a row. Wait a minute and try again."
        : `The test didn't go through. ${i.type === "email" || i.type === "sms" ? "Check the address or number." : "Check the details under Manage."}`;
      setNotes((n) => ({ ...n, [i.id]: { ok: false, text } }));
    } finally {
      setTesting(null);
    }
  }

  async function setEnabled(i: Integration, enabled: boolean) {
    setPageErr("");
    try {
      await api(`integrations/${i.id}`, { method: "PUT", body: { enabled } });
      await t.reload();
    } catch (e) {
      setPageErr(errorText(e));
    }
  }

  return (
    <div className="fa-page">
      <PageHead title="Integrations"
        sub={<>Where your alerts get delivered. {plan.integrations != null ? `${connected.length} of ${plan.integrations} connected on ${plan.name}.` : "Connect as many as you like."}</>} />

      {pageErr && <div className="fa-banner bad" role="alert">{pageErr}</div>}

      <div className="fa-eyebrow" style={{ marginBottom: 10 }}>Connected · {connected.length}</div>
      {connected.length === 0 ? (
        <div className="fa-card fa-empty" style={{ marginBottom: 24 }}><strong>Nothing connected yet</strong>Pick a channel below. Until you do, alerts have nowhere to go.</div>
      ) : (
        <div className="fa-grid fa-cols-3" style={{ marginBottom: 28 }}>
          {connected.map((i) => {
            const s = stats(i.type);
            const failed = s.total - s.ok;
            const note = notes[i.id];
            return (
              <section key={i.id} className="fa-card">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="fa-mark">{CHANNELS[i.type]?.mark ?? "··"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{channelLabel(i.type)}</div>
                    <div className="fa-note" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.enabled ? summary(i) || "Connected" : "Paused"}</div>
                  </div>
                  <Toggle on={i.enabled} label={`${channelLabel(i.type)} alerts`} onChange={(on) => setEnabled(i, on)} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <div className="fa-kv">
                    <span>Delivered this week</span>
                    <span className="mono" style={failed ? { color: "var(--warn)" } : undefined}>{s.total ? `${s.ok} / ${s.total}${failed ? ` · ${failed} failed` : ""}` : "—"}</span>
                  </div>
                  <div className="fa-kv"><span>Last alert</span><span className="mono">{s.last ? `${clock(s.last)} ${dayLabel(s.last).toLowerCase()}` : "None yet"}</span></div>
                </div>
                {note && <div className={note.ok ? "fa-ok" : "fa-error"} role="status" style={{ marginTop: 10 }}>{note.text}</div>}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
                  <Btn small disabled={testing !== null || !i.enabled} onClick={() => test(i)}>{testing === i.id ? "Sending…" : "Send test"}</Btn>
                  <Btn small onClick={() => setEdit({ type: i.type, existing: i })}>Manage</Btn>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {available.length > 0 && (
        <>
          <div className="fa-eyebrow" style={{ marginBottom: 10 }}>Available · {available.length}</div>
          {atLimit && <div className="fa-banner"><span>{plan.name} includes {plan.integrations} {plan.integrations === 1 ? "channel" : "channels"}. Remove one to connect another, or <a href="/pricing" style={{ fontWeight: 600, textDecoration: "underline" }}>see plans</a>.</span></div>}
          <div className="fa-grid fa-cols-4">
            {available.map((type) => {
              const inPlan = plan.channels.includes(type);
              return (
                <section key={type} className="fa-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="fa-mark dim">{CHANNELS[type].mark}</span>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{CHANNELS[type].name}</span>
                  </div>
                  <p className="fa-note" style={{ flex: 1 }}>{SPECS[type].blurb}</p>
                  {inPlan ? (
                    <Btn small disabled={atLimit} onClick={() => setEdit({ type, existing: null })} style={{ alignSelf: "flex-start" }}>Connect</Btn>
                  ) : (
                    <a className="fa-note fa-link" href="/pricing" style={{ alignSelf: "flex-start" }}>Not in {plan.name}. See plans</a>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}

      {edit && (
        <IntegrationModal
          type={edit.type} existing={edit.existing}
          onClose={() => setEdit(null)}
          onDone={async () => { setEdit(null); await t.reload(); }}
        />
      )}
    </div>
  );
}

function IntegrationModal({ type, existing, onClose, onDone }: { type: string; existing: Integration | null; onClose: () => void; onDone: () => Promise<void> }) {
  const spec = SPECS[type] ?? { blurb: "", fields: [] };
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const f of spec.fields) v[f.key] = String(existing?.config?.[f.key] ?? (f.key === "webhook_url" ? existing?.config?.url ?? "" : ""));
    return v;
  });
  const [reveal, setReveal] = useState(!existing);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(false);

  async function save() {
    setErr("");
    const config: Record<string, string> = {};
    for (const f of spec.fields) {
      const raw = (values[f.key] ?? "").trim();
      const v = f.key === "to_phone" ? raw.replace(/[\s().-]/g, "") : raw;
      if (!v) {
        if (f.optional) continue;
        setErr(`${f.label} is needed.`); return;
      }
      const problem = f.check?.(v);
      if (problem) { setErr(problem); return; }
      config[f.key] = v;
    }
    setBusy(true);
    try {
      if (existing) await api(`integrations/${existing.id}`, { method: "PUT", body: { config, enabled: existing.enabled } });
      else await api("integrations", { method: "POST", body: { type, config, enabled: true } });
      await onDone();
    } catch (e) {
      setErr(errorText(e));
      setBusy(false);
    }
  }

  async function remove() {
    if (!existing) return;
    setBusy(true); setErr("");
    try {
      await api(`integrations/${existing.id}`, { method: "DELETE" });
      await onDone();
    } catch (e) {
      setErr(errorText(e));
      setBusy(false);
    }
  }

  if (confirm) {
    return (
      <Modal title={`Disconnect ${channelLabel(type)}?`} sub="Alerts stop going there right away. You can connect it again later." onClose={onClose}>
        {err && <div className="fa-error" role="alert">{err}</div>}
        <div className="fa-modal-actions">
          <Btn onClick={() => setConfirm(false)} disabled={busy}>Keep it</Btn>
          <Btn variant="danger" onClick={remove} disabled={busy}>{busy ? "Removing…" : "Disconnect"}</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={existing ? `Manage ${channelLabel(type)}` : `Connect ${channelLabel(type)}`} sub={spec.blurb} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); save(); }}>
        {spec.fields.map((f, idx) => (
          <Field key={f.key} label={f.label} hint={f.hint}>
            <input
              className="fa-input" type={f.secret && !reveal ? "password" : "text"} autoComplete="off" spellCheck={false}
              autoFocus={idx === 0 && !existing} placeholder={f.placeholder} value={values[f.key] ?? ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
            />
          </Field>
        ))}
        {existing && spec.fields.some((f) => f.secret) && (
          <button type="button" className="fa-link fa-note" onClick={() => setReveal((v) => !v)}>{reveal ? "Hide" : "Show"} the saved value</button>
        )}
        {err && <div className="fa-error" role="alert">{err}</div>}
        <div className="fa-modal-actions" style={{ justifyContent: "space-between" }}>
          <span>{existing && <Btn variant="danger" onClick={() => setConfirm(true)} disabled={busy}>Disconnect</Btn>}</span>
          <span style={{ display: "flex", gap: 10 }}>
            <Btn onClick={onClose} disabled={busy}>Cancel</Btn>
            <Btn type="submit" variant="primary" disabled={busy}>{busy ? "Saving…" : existing ? "Save" : "Connect"}</Btn>
          </span>
        </div>
      </form>
    </Modal>
  );
}
