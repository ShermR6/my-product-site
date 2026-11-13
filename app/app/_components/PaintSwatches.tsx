"use client";

// Paint colour for one aircraft: a row of ready-made colours, plus "any
// colour" — a full spectrum to drag around in and a box for a hex code.

import { useRef, useState } from "react";
import { PAINTS } from "../_lib/paint";

type Hsv = { h: number; s: number; v: number };

function toHsv(hex: string): Hsv {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function toHex({ h, s, v }: Hsv): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255).toString(16).padStart(2, "0");
  };
  return `#${f(5)}${f(3)}${f(1)}`.toUpperCase();
}

/** "#abc", "abc", "#AABBCC" or "aabbcc" -> "#AABBCC"; anything else -> null. */
function readHex(text: string): string | null {
  const t = text.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(t)) return `#${t.split("").map((c) => c + c).join("")}`.toUpperCase();
  return /^[0-9a-fA-F]{6}$/.test(t) ? `#${t}`.toUpperCase() : null;
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));

export default function PaintSwatches({
  tail, value, onPick, small,
}: {
  tail: string; value: string; onPick: (hex: string) => void; small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const custom = !PAINTS.some((p) => p.hex.toLowerCase() === value.toLowerCase());
  const name = tail || "this aircraft";

  return (
    <div className="fa-paint">
      <div className={`fa-swatches ${small ? "small" : ""}`} role="group" aria-label={`Paint colour for ${name}`}>
        {PAINTS.map((p) => (
          <button key={p.hex} type="button" title={p.name} aria-label={p.name} aria-pressed={p.hex.toLowerCase() === value.toLowerCase()}
            style={{ background: p.hex }} onClick={() => onPick(p.hex)} />
        ))}
        <button type="button" className="any" title="Any colour" aria-label={`Pick any colour for ${name}`} aria-expanded={open} aria-pressed={custom}
          style={custom ? { background: value } : undefined} onClick={() => setOpen((v) => !v)} />
      </div>
      {open && <Spectrum value={value} onPick={onPick} onDone={() => setOpen(false)} />}
    </div>
  );
}

function Spectrum({ value, onPick, onDone }: { value: string; onPick: (hex: string) => void; onDone: () => void }) {
  // Hue and saturation are kept here too: black and grey have neither, and the handles shouldn't jump when the colour passes through them.
  const [hsv, setHsv] = useState<Hsv>(() => toHsv(readHex(value) ?? "#38BDF8"));
  const [text, setText] = useState(value.toUpperCase());
  const [seen, setSeen] = useState(value);
  const square = useRef<HTMLDivElement>(null);

  // A colour picked elsewhere (a ready-made swatch) moves the handles here. Our own picks come
  // back as the same colour the handles already show, so they are left alone.
  if (value !== seen) {
    setSeen(value);
    const hex = readHex(value);
    if (hex && hex !== toHex(hsv)) { setHsv(toHsv(hex)); setText(hex); }
  }

  function set(next: Hsv) {
    const hex = toHex(next);
    setHsv(next);
    setText(hex);
    onPick(hex);
  }

  function drag(e: React.PointerEvent) {
    const box = square.current?.getBoundingClientRect();
    if (!box) return;
    set({ h: hsv.h, s: clamp((e.clientX - box.left) / box.width), v: clamp(1 - (e.clientY - box.top) / box.height) });
  }

  /** A full six-character code applies as it is typed; the short #ABC form waits until the box is left. */
  function typed(t: string, done = false) {
    const hex = readHex(t);
    const full = !!hex && (done || t.trim().replace(/^#/, "").length === 6);
    setText(done ? (hex ?? toHex(hsv)) : t);
    if (!hex || !full) return;
    setHsv(toHsv(hex));
    onPick(hex);
  }

  const hex = toHex(hsv);
  const bad = text.trim() !== "" && !readHex(text);

  return (
    <div className="fa-spectrum">
      <div
        ref={square} className="fa-spectrum-sv" role="slider" tabIndex={0}
        aria-label="Shade: left and right for strength, up and down for brightness"
        aria-valuetext={`${Math.round(hsv.s * 100)}% strong, ${Math.round(hsv.v * 100)}% bright`} aria-valuenow={Math.round(hsv.s * 100)}
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag(e); }}
        onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) drag(e); }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.1 : 0.02;
          const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
          if (!d) return;
          e.preventDefault();
          set({ h: hsv.h, s: clamp(hsv.s + d[0]), v: clamp(hsv.v + d[1]) });
        }}
      >
        <span style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }} />
      </div>
      <input type="range" className="fa-spectrum-hue" min={0} max={359} step={1} value={Math.round(hsv.h)} aria-label="Colour"
        onChange={(e) => set({ ...hsv, h: Number(e.target.value), s: hsv.s || 1, v: hsv.v || 1 })} />
      <div className="fa-spectrum-row">
        <span className="fa-spectrum-chip" style={{ background: hex }} aria-hidden="true" />
        <input className="fa-input mono" value={text} maxLength={7} spellCheck={false} autoCapitalize="characters" aria-label="Hex colour code" aria-invalid={bad}
          placeholder="#38BDF8" onChange={(e) => typed(e.target.value)} onBlur={(e) => typed(e.target.value, true)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); typed(e.currentTarget.value, true); } }} />
        <button type="button" className="fa-btn small" onClick={onDone}>Done</button>
      </div>
      {bad && <div className="fa-note" role="alert" style={{ marginTop: 6 }}>A hex code is # and six characters, 0–9 and A–F.</div>}
    </div>
  );
}
