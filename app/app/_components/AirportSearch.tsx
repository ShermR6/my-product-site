"use client";

// Type an airport code, name or city; pick one from the list.

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { AirportMatch } from "../_lib/types";

export async function findAirports(q: string): Promise<AirportMatch[]> {
  try {
    const res = await fetch(`/api/airports?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    if (!res.ok) return [];
    const body = await res.json();
    return Array.isArray(body) ? (body as AirportMatch[]) : [];
  } catch {
    return [];
  }
}

export default function AirportSearch({ onPick, autoFocus }: { onPick: (a: AirportMatch) => void; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AirportMatch[] | null>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    let live = true;
    const id = setTimeout(async () => {
      const r = await findAirports(term);
      if (live) setResults(r);
    }, 220);
    return () => { live = false; clearTimeout(id); };
  }, [q]);

  const term = q.trim();
  const list = term.length < 2 ? null : results;

  return (
    <div>
      <div style={{ position: "relative" }}>
        <Search size={15} aria-hidden="true" style={{ position: "absolute", left: 13, top: 13, color: "var(--faint)" }} />
        <input className="fa-input" style={{ paddingLeft: 36 }} placeholder="Code, name or city, e.g. KDTO or Denton" aria-label="Search airports"
          autoFocus={autoFocus} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list && list.length === 0 && <div className="fa-note" style={{ marginTop: 10 }}>No airport matches “{term}”.</div>}
      {list && list.length > 0 && (
        <div role="listbox" aria-label="Matching airports" style={{ marginTop: 8, maxHeight: 290, overflowY: "auto" }}>
          {list.map((a) => (
            <button key={a.icao} type="button" role="option" aria-selected="false" className="fa-result" onClick={() => onPick(a)}>
              <span className="mono" style={{ width: 54, fontWeight: 600 }}>{a.icao}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                <span className="fa-note">{[a.city, a.region].filter(Boolean).join(", ")}</span>
              </span>
              <span className="fa-note mono">{a.runways.length} rwy</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
