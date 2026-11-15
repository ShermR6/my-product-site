"use client";

// The Ground Station device key, shown like an API key: hidden until asked
// for, copyable, and replaceable when it may have been seen. Works for every
// account, with or without a plan, so a receiver can be set up to feed first.

import { useEffect, useState, type CSSProperties } from "react";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { api, errorText } from "../_lib/tracker";
import { Btn, Card } from "./kit";

type KeyInfo = { hint: string | null; key: string | null; ground_station_enabled: boolean };

const MASK = "•".repeat(20);
/** The one-line installer (public/install.sh). The device key goes on the end. */
const INSTALL = "curl -fsSL https://finalpingapp.com/install.sh | sudo bash -s --";
const PRE: CSSProperties = {
  margin: 0, padding: "10px 12px", borderRadius: 10, background: "rgba(0,0,0,0.35)", border: "1px solid #1E1E1E",
  whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: 12, lineHeight: 1.6, color: "var(--text-2)",
};

export default function DeviceKey() {
  const [hint, setHint] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);   // only once revealed
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [replaced, setReplaced] = useState(false);
  const [cmdNote, setCmdNote] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    api<KeyInfo>("ground/key").then((r) => { if (live) setHint(r.hint); }).catch((e) => { if (live) setErr(errorText(e)); });
    return () => { live = false; };
  }, []);

  /** The key itself, fetched only when someone asks to see or copy it. */
  async function fetchKey(): Promise<string | null> {
    if (key) return key;
    try {
      const r = await api<KeyInfo>("ground/key?reveal=true");
      setKey(r.key);
      setHint(r.hint);
      return r.key;
    } catch (e) {
      setErr(errorText(e));
      return null;
    }
  }

  async function toggle() {
    if (shown) { setShown(false); return; }
    if (await fetchKey()) setShown(true);
  }

  async function copy() {
    const k = await fetchKey();
    if (!k) return;
    try {
      await navigator.clipboard.writeText(k);
      setNote("Copied.");
      setTimeout(() => setNote(null), 1800);
    } catch {
      setShown(true);   // clipboard blocked: show it to copy by hand
    }
  }

  async function replace() {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<KeyInfo>("ground/key/rotate", { method: "POST" });
      setKey(r.key);
      setHint(r.hint);
      setShown(true);
      setReplaced(true);
      setConfirming(false);
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  /** The whole install line, with the key in it, ready to paste into the Pi. */
  async function copyCommand() {
    const k = await fetchKey();
    if (!k) return;
    try {
      await navigator.clipboard.writeText(`${INSTALL} ${k}`);
      setCmdNote("Copied. Paste it into the Pi.");
      setTimeout(() => setCmdNote(null), 2600);
    } catch {
      setShown(true);   // clipboard blocked: show it to copy by hand
    }
  }

  const value = shown && key ? key : hint ? `${MASK}${hint}` : "Loading…";
  const command = `${INSTALL} ${shown && key ? key : hint ? `${"•".repeat(8)}${hint}` : "YOUR_DEVICE_KEY"}`;

  return (
    // Usable in preview too: someone without a plan sets up a receiver first.
    <div data-preview-ok>
      <Card title="Device key" note={hint ? `Ends in ${hint}` : undefined}>
        <p className="fa-note" style={{ lineHeight: 1.6, marginBottom: 12 }}>
          Your ground station signs in to your account with this key. Treat it like a password: anyone who has it can send data into your account.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="fa-input mono fa-key" readOnly aria-label="Device key" value={value}
            onFocus={(e) => { if (shown) e.currentTarget.select(); }} />
          <Btn square aria-label={shown ? "Hide device key" : "Show device key"} onClick={toggle} disabled={!hint} style={{ padding: "0 12px" }}>
            {shown ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          </Btn>
          <Btn square aria-label="Copy device key" onClick={copy} disabled={!hint} style={{ padding: "0 12px" }}>
            <Copy size={15} aria-hidden="true" />
          </Btn>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
          <span className="fa-note" role="status">{note ?? ""}</span>
          <button className="fa-link" onClick={() => setConfirming(true)} disabled={!hint}>
            <RefreshCw size={12} aria-hidden="true" style={{ marginRight: 6, verticalAlign: -1 }} />Replace key
          </button>
        </div>
        {err && <p className="fa-error" role="alert">{err}</p>}

        {replaced && (
          <div className="fa-banner warn" role="status" style={{ marginTop: 14, marginBottom: 0, display: "block", lineHeight: 1.6 }}>
            <strong>Your old key no longer works.</strong> Your ground station stops sending data until you give it this new key. Connect to the Pi over SSH and run the install command below again: it only swaps the key and restarts the receiver.
          </div>
        )}
      </Card>

      <div style={{ marginTop: 16 }}>
        <Card title="Install on a Raspberry Pi" note="One command">
          <p className="fa-note" style={{ lineHeight: 1.6, marginBottom: 12 }}>
            Connect to the Pi over SSH and paste this. It installs the ADS-B decoder, the adsb.lol feed and the FinalPing receiver, and starts them on every boot. Running it again is safe: it only does what is missing.
          </p>
          <pre className="mono" style={PRE} aria-label="Install command">{command}</pre>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
            <span className="fa-note" role="status">{cmdNote ?? "Your device key is part of the command. Copy puts the whole line on your clipboard."}</span>
            <Btn small onClick={copyCommand} disabled={!hint}>
              <Copy size={13} aria-hidden="true" style={{ marginRight: 7, verticalAlign: -2 }} />Copy command
            </Btn>
          </div>
        </Card>
      </div>

      {confirming && (
        <div className="fa-overlay" onClick={() => !busy && setConfirming(false)}>
          <div className="fa-modal" role="dialog" aria-modal="true" aria-labelledby="fa-rotate-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="fa-rotate-title">Replace your device key?</h2>
            <p className="fa-sub" style={{ marginTop: 0, lineHeight: 1.6 }}>
              Do this if you think someone else has seen your key. The current key stops working immediately.
            </p>
            <div className="fa-banner warn" style={{ marginTop: 14, marginBottom: 0 }}>
              Your ground station will stop sending data until you update it with the new key.
            </div>
            {err && <p className="fa-error" role="alert">{err}</p>}
            <div className="fa-modal-actions">
              <Btn onClick={() => setConfirming(false)} disabled={busy}>Cancel</Btn>
              <Btn variant="danger" onClick={replace} disabled={busy}>{busy ? "Replacing…" : "Replace key"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
