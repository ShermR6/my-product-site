"use client";

// Each tracked aircraft has a paint colour and a 3D shape. The shape comes
// from its type; the colour is the user's pick, with a default per tail
// number. This file has no 3D code in it, so any screen can import it cheaply.

import { useSyncExternalStore } from "react";
import { MODEL_LIST } from "./modelList";

export type Family = "highwing" | "lowwing" | "twin" | "tprop" | "tprop2" | "jet" | "airliner" | "heli";

export const FAMILY_LABEL: Record<Family, string> = {
  highwing: "High-wing single",
  lowwing: "Low-wing single",
  twin: "Piston twin",
  tprop: "Single turboprop",
  tprop2: "Twin turboprop",
  jet: "Jet",
  airliner: "Airliner",
  heli: "Helicopter",
};

export const PAINTS = [
  { name: "Sky", hex: "#38BDF8" },
  { name: "Cobalt", hex: "#5B7CFA" },
  { name: "Violet", hex: "#A78BFA" },
  { name: "Magenta", hex: "#F472B6" },
  { name: "Red", hex: "#F87171" },
  { name: "Gold", hex: "#FBBF24" },
  { name: "Graphite", hex: "#8A8A8A" },
] as const;

// Checked in order; the first match wins. Works on registry names
// ("CESSNA 172S", "PIPER PA-28-181", "BEECH 58") and on ICAO type codes ("C172").
const RULES: [Family, RegExp][] = [
  ["heli", /\b(R22|R44|R66|ROBINSON|BELL|HELI\w*|EUROCOPTER|HUGHES|EC ?\d{3}|H1[2-7]5|AS ?3[35]\d|MD ?[569]\d\d|S-?76|S-?92|UH-?\d+|SIKORSKY|AW1\d\d|BK ?117|SCHWEIZER|ENSTROM|GUIMBAL|B06|B407|B429|B505)\b/],
  ["airliner", /\b(BOEING 7\w*|B7[0-8]\w|7[0-8]7|B38M|B39M|AIRBUS|A22\d|A3[0-8]\d|A19N|A20N|A21N|E1[79]\d|E75[LS]|E29\d|ERJ\w*|CRJ\w*|MD-?[89]\d|DC-?\d+)\b/],
  ["jet", /\b(CITATION\w*|C5\d\d|C25[ABCM]?|C56X|C68A|C700|C750|CESSNA (5\d\d|6[58]0|7[05]0)\w*|LEARJET|LJ\d+|GULFSTREAM|G[1-7]\d0|GLF\d|PHENOM|E50P|E55P|EMB-?5\d\d|HONDAJET|HDJT|HA-?420|FALCON|F[29]00|FA\d\w|CHALLENGER|CL-?\d\d\d?|BD-?[17]00\w*|GLOBAL|GLEX|HAWKER|H25\w|PREMIER|PRM1|ECLIPSE|EA50\d?|SF50|PC-?24|LEGACY|PRAETOR|BEECHJET|BE40|JET)\b/],
  ["tprop2", /\b(KING AIR|BE9L|BE20|B200\w*|B300\w*|B350\w*|BE30|BE99|[A-F]-?90\w?|BEECH(CRAFT)? [A-Z]?(90|99|100|200|300|350|1900)\w*|CHEYENNE|PA[- ]?31T\w*|PA[- ]?42\w*|CONQUEST|C425|C441|CESSNA (425|441)\w*|TWIN OTTER|DHC-?6|MU-?2\w*|MERLIN|METRO|SW[34]|PIAGGIO|P180|AVANTI|TURBO COMMANDER|ATR\w*|DASH ?8|DH8\w|SF34|B190|1900\w?)\b/],
  ["tprop", /\b(PC-?12\w*|TBM ?\w*|CARAVAN|C208|208B?|KODIAK|KODI|MERIDIAN|M[567]00|P46T|PA[- ]?46-?[56]00TP|JETPROP|PC-?6|PILATUS|EPIC|E1000|DENALI|TURBINE)\b/],
  ["twin", /\b(BARON|BE5[58]|BE95|G58|BEECH(CRAFT)? [A-Z]?(5[58]|60|76|95)\w*|TRAVEL AIR|SENECA|PA[- ]?34\w*|SEMINOLE|PA[- ]?44\w*|AZTEC|PA[- ]?23\w*|APACHE|NAVAJO|PA[- ]?31\w*|CHIEFTAIN|TWIN COMANCHE|PA[- ]?30|PA[- ]?39|DUCHESS|BE76|DA[- ]?42\w*|DA[- ]?62\w*|TWIN ?STAR|C3[0-4]\d|C40[1-9]|C4[12]\d|CESSNA (T?3[0-4]\d|40[1-9]|4[12]\d)\w?|SKYMASTER|P06T|P2006\w*|AEROSTAR|PA[- ]?60\w*|DUKE|BE60|QUEEN AIR|TWIN BONANZA|COUGAR|GA-?7|TWIN)\b/],
  ["lowwing", /\b(CORVALIS|COLUMBIA|TTX|C350|C400|CESSNA (350|400)|LC4\d|BONANZA|[A-HJ-Z]3[3-6]\w?|DEBONAIR|MUSKETEER|SUNDOWNER|SIERRA|BEECH(CRAFT)? [A-Z]?(19|23|24|3[3-6])\w*)\b/],
  ["highwing", /\b(CESSNA|C1\d\d|C2[01]\d|SKYHAWK|SKYLANE|SKYCATCHER|STATIONAIR|CENTURION|CARDINAL|CUB|PA[- ]?18\w*|PA[- ]?12|J-?3\w*|CHAMP|CITABRIA|DECATHLON|SCOUT|HUSKY|MAULE|KITFOX|CARBON ?CUB|TAYLORCRAFT|LUSCOMBE|AERONCA|STINSON|HIGHLANDER|P92\w*|P2008\w*|BEAVER|DHC-?2|OTTER|DHC-?3|TRI-?PACER|PA[- ]?22\w*|PACER|PA[- ]?20|GA8|AIRVAN)\b/],
  // A bare Cessna model number on its own, like "172S" or "T206H".
  ["highwing", /^T?(1[5-9]\d|20[5-7]|210)[A-Z]{0,2}$/],
];

/** Which of the eight shapes to draw for this type. Unknown types get the low-wing single. */
export function familyOf(type?: string | null): Family {
  // The registry lists newer Cessnas under Textron Aviation.
  const t = (type ?? "").toUpperCase().replace(/TEXTRON AVIATION( INC)?/g, "CESSNA").replace(/\s+/g, " ").trim();
  if (!t) return "lowwing";
  for (const [fam, re] of RULES) if (re.test(t)) return fam;
  return "lowwing";
}

// ----- real models -----

export type ModelRef = {
  id: string;
  /** What the model is, e.g. "Cessna 172 Skyhawk". */
  label: string;
  /** Changes when the file does, so browsers can keep it for good. */
  v: string;
  /** False when this type only borrows a close relative's model. */
  exact: boolean;
};

let MODELS: { ref: ModelRef; exact: RegExp; alias: RegExp | null }[] | null = null;
const word = (p: string) => new RegExp(`\\b(?:${p})\\b`);

/** The real 3D model for this type, if there is one. Others use the eight built-in shapes. */
export function modelOf(type?: string | null): ModelRef | null {
  const t = (type ?? "").toUpperCase().replace(/TEXTRON AVIATION( INC)?/g, "CESSNA").replace(/\s+/g, " ").trim();
  if (!t) return null;
  MODELS ??= MODEL_LIST.map(([id, label, v, exact, alias]) => ({
    ref: { id, label, v, exact: true }, exact: word(exact), alias: alias ? word(alias) : null,
  }));
  for (const m of MODELS) if (m.exact.test(t)) return m.ref;
  for (const m of MODELS) if (m.alias?.test(t)) return { ...m.ref, exact: false };
  return null;
}

// ----- the user's colour picks (kept in this browser) -----

const KEY = "fp_paint_v1";
const EMPTY: Record<string, string> = {};
let cache: Record<string, string> | null = null;
const listeners = new Set<() => void>();

function load(): Record<string, string> {
  if (cache) return cache;
  cache = EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object") {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v)) out[k] = v;
      }
      cache = out;
    }
  } catch {
    // Private windows and blocked storage: fall back to the defaults.
  }
  return cache;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; fn(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
}

/** The saved picks, by tail number. Re-renders when one changes. */
export function usePaints(): Record<string, string> {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

export function setPaint(tail: string, hex: string) {
  cache = { ...load(), [tail]: hex };
  try { window.localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* still applies for this visit */ }
  listeners.forEach((fn) => fn());
}

/** Colour for a tail number: the saved pick, or a steady default so a fleet isn't all one colour. */
export function paintOf(tail: string, saved: Record<string, string>): string {
  if (saved[tail]) return saved[tail];
  let h = 0;
  for (let i = 0; i < tail.length; i++) h = (h * 31 + tail.charCodeAt(i)) >>> 0;
  return PAINTS[h % (PAINTS.length - 1)].hex; // Graphite is never a default
}
