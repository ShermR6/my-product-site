"use client";

// Alert rings as removable chips, with a small box to add another.

import { useState } from "react";
import { Plus, X } from "lucide-react";

export const RING_MIN = 1;
export const RING_MAX = 100;

export default function RingEditor({
  rings, onChange, max, disabled,
}: {
  rings: number[];
  onChange: (next: number[]) => void;
  /** Most rings the plan allows; null = no limit. */
  max: number | null;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");
  const sorted = [...rings].sort((a, b) => b - a);
  const full = max != null && rings.length >= max;

  function add() {
    const n = Number(draft);
    if (!draft.trim() || !Number.isInteger(n) || n < RING_MIN || n > RING_MAX) {
      setErr(`Enter a whole number from ${RING_MIN} to ${RING_MAX}.`);
      return;
    }
    if (rings.includes(n)) { setErr(`There is already a ${n} nm ring.`); return; }
    onChange([...rings, n]);
    setDraft(""); setErr(""); setAdding(false);
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {sorted.map((r) => (
          <span key={r} className="fa-chip">
            {r} nm
            {!disabled && (
              <button type="button" aria-label={`Remove the ${r} nm ring`} onClick={() => onChange(rings.filter((x) => x !== r))}>
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </span>
        ))}
        {!disabled && !adding && !full && (
          <button type="button" className="fa-chip selectable" onClick={() => setAdding(true)}>
            <Plus size={13} aria-hidden="true" />Add ring
          </button>
        )}
        {adding && (
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input
              className="fa-input mono" style={{ width: 84, height: 32 }} inputMode="numeric" autoFocus
              placeholder="nm" aria-label="Ring distance in nautical miles" value={draft}
              onChange={(e) => { setDraft(e.target.value); setErr(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } if (e.key === "Escape") { e.stopPropagation(); setAdding(false); setErr(""); } }}
            />
            <button type="button" className="fa-btn small" onClick={add}>Add</button>
            <button type="button" className="fa-link fa-note" onClick={() => { setAdding(false); setErr(""); setDraft(""); }}>Cancel</button>
          </span>
        )}
      </div>
      {err && <div className="fa-error" role="alert">{err}</div>}
      {full && !disabled && <div className="fa-note" style={{ marginTop: 8 }}>Your plan includes up to {max} rings.</div>}
    </div>
  );
}
