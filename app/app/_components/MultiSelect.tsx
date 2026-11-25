"use client";

// A filter menu where any mix can be picked: everything (nothing ticked), one,
// or several. The button names what is picked; the menu lists each option with
// a tick box. Closes on Done, Escape or a click elsewhere.

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check as CheckGlyph, ChevronDown } from "lucide-react";

export type MultiOption = { value: string; label: string; icon?: ReactNode };

function Tick({ on }: { on: boolean }) {
  return (
    <span className="fa-check fa-ms-tick" aria-hidden="true" data-on={on}>
      <CheckGlyph size={12} strokeWidth={3.2} />
    </span>
  );
}

export default function MultiSelect({
  allLabel, unit, options, selected, onChange,
}: {
  /** "All aircraft": shown when nothing is picked, and the first row of the menu. */
  allLabel: string;
  /** "aircraft": the button reads "3 aircraft" when several are picked. */
  unit: string;
  options: MultiOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  const picked = new Set(selected);
  const one = selected.length === 1 ? options.find((o) => o.value === selected[0])?.label ?? selected[0] : null;
  const label = selected.length === 0 ? allLabel : one ?? `${selected.length} ${unit}`;
  const flip = (v: string) => onChange(picked.has(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  return (
    <div className="fa-ms" ref={box}>
      <button type="button" className="fa-ms-btn" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>{label}</span><ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="fa-ms-pop" role="group" aria-label={allLabel}>
          <button type="button" className="fa-ms-opt" role="menuitemcheckbox" aria-checked={selected.length === 0} onClick={() => onChange([])}>
            <Tick on={selected.length === 0} />{allLabel}
          </button>
          <div className="fa-ms-sep" />
          <div className="fa-ms-list">
            {options.map((o) => (
              <button key={o.value} type="button" className="fa-ms-opt" role="menuitemcheckbox" aria-checked={picked.has(o.value)} onClick={() => flip(o.value)}>
                <Tick on={picked.has(o.value)} />
                {o.icon && <span className="fa-ms-icon">{o.icon}</span>}
                <span className="fa-ms-label">{o.label}</span>
              </button>
            ))}
          </div>
          <div className="fa-ms-foot">
            <span>{selected.length ? `${selected.length} picked` : "Showing all"}</span>
            <button type="button" className="fa-link" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
