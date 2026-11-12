"use client";

// The row of paint colours for one aircraft.

import { PAINTS } from "../_lib/paint";

export default function PaintSwatches({
  tail, value, onPick, small,
}: {
  tail: string; value: string; onPick: (hex: string) => void; small?: boolean;
}) {
  return (
    <div className={`fa-swatches ${small ? "small" : ""}`} role="group" aria-label={`Paint colour for ${tail || "this aircraft"}`}>
      {PAINTS.map((p) => (
        <button key={p.hex} type="button" title={p.name} aria-label={p.name} aria-pressed={p.hex.toLowerCase() === value.toLowerCase()}
          style={{ background: p.hex }} onClick={() => onPick(p.hex)} />
      ))}
    </div>
  );
}
