// Small pure helpers shared by the web app's screens.

import type { Aircraft, AirportConfig, LiveAircraft, NotificationLog } from "./types";

/** The backend sends UTC times without a zone suffix. */
export function parseUtc(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const hasZone = /[zZ]$|[+-]\d\d:?\d\d$/.test(iso);
  const d = new Date(hasZone ? iso : iso + "Z");
  return isNaN(d.getTime()) ? null : d;
}

export function clock(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function clockSeconds(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function dayLabel(d: Date | null): string {
  if (!d) return "—";
  const today = new Date();
  const yest = new Date(today.getTime() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ago(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "—";
  if (seconds < 60) return `${Math.floor(seconds)} s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}

export function duration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d} d ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

export function nm(distance: number | null | undefined): string {
  if (distance == null || !isFinite(distance)) return "—";
  return `${distance.toFixed(1)} nm`;
}

export function whole(n: number | null | undefined, unit: string): string {
  if (n == null || !isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString()} ${unit}`;
}

export function etaMinutes(distanceNm: number, kts: number | null): number | null {
  if (!kts || kts < 30 || !distanceNm) return null;
  return Math.max(1, Math.round((distanceNm / kts) * 60));
}

export function etaText(distanceNm: number, kts: number | null): string {
  const m = etaMinutes(distanceNm, kts);
  if (m == null) return "—";
  return m < 60 ? `${m} min` : `${(m / 60).toFixed(1)} h`;
}

/** The backend's key for a ring: 10 -> "10nm", 2.5 -> "2.5nm". */
export function ringKey(d: number): string {
  return `${Number.isInteger(d) ? d : d}nm`;
}

export function eventLabel(alertType: string): string {
  if (alertType === "landing") return "Landed";
  if (alertType === "takeoff") return "Took off";
  const m = /^(\d+(?:\.\d+)?)nm$/.exec(alertType);
  return m ? `Crossed ${m[1]} nm` : alertType;
}

/** Rings for one aircraft, widest first: its own if set, else the airport's. */
export function ringsFor(tail: string, fleet: Aircraft[], airport: AirportConfig | null): number[] {
  const own = fleet.find((a) => a.tail_number === tail)?.alert_distances;
  const src = own?.length ? own : airport?.alert_distances_nm ?? [];
  return src.map(Number).filter((n) => isFinite(n) && n > 0).sort((a, b) => b - a);
}

export function airportRings(airport: AirportConfig | null): number[] {
  return (airport?.alert_distances_nm ?? []).map(Number).filter((n) => isFinite(n) && n > 0).sort((a, b) => b - a);
}

export type Stage = "ground" | "airborne" | "inbound" | "final";

export function stageOf(a: LiveAircraft, rings: number[]): Stage {
  if (a.on_ground) return "ground";
  if (!a.is_approaching || !rings.length) return "airborne";
  if (a.distance_nm > rings[0] + 0.9) return "airborne";
  return a.distance_nm <= rings[rings.length - 1] + 0.9 || rings.length === 1 ? "final" : "inbound";
}

export const STAGE_LABEL: Record<Stage, string> = {
  ground: "On the ground",
  airborne: "Airborne",
  inbound: "Inbound",
  final: "On final",
};

/** Tracked aircraft that are airborne and closing, nearest first. */
export function inboundOf(live: LiveAircraft[], fleet: Aircraft[], airport: AirportConfig | null): LiveAircraft[] {
  return live
    .filter((a) => {
      const s = stageOf(a, ringsFor(a.tail_number, fleet, airport));
      return s === "inbound" || s === "final";
    })
    .sort((a, b) => a.distance_nm - b.distance_nm);
}

/** Alerts sent for this aircraft in the last two hours, newest per alert type. */
export function recentAlertsFor(tail: string, recent: NotificationLog[]): Map<string, Date> {
  const cutoff = Date.now() - 2 * 3600 * 1000;
  const out = new Map<string, Date>();
  for (const n of recent) {
    if (n.aircraft_tail !== tail) continue;
    const t = parseUtc(n.sent_at);
    if (!t || t.getTime() < cutoff) continue;
    const prev = out.get(n.alert_type);
    if (!prev || t > prev) out.set(n.alert_type, t);
  }
  return out;
}

export type AlertEvent = {
  key: string;
  time: Date;
  tail: string;
  alertType: string;
  channels: string[];
  failed: string[];
};

/** Notification rows grouped into one line per alert (one alert fans out to several channels). */
export function groupEvents(logs: NotificationLog[]): AlertEvent[] {
  const map = new Map<string, AlertEvent>();
  for (const n of logs) {
    const t = parseUtc(n.sent_at);
    if (!t) continue;
    const key = `${n.aircraft_tail}|${n.alert_type}|${Math.floor(t.getTime() / 120000)}`;
    let e = map.get(key);
    if (!e) {
      e = { key, time: t, tail: n.aircraft_tail, alertType: n.alert_type, channels: [], failed: [] };
      map.set(key, e);
    }
    const ok = ["sent", "success"].includes(String(n.status).toLowerCase());
    const label = channelLabel(n.integration_type);
    if (ok) { if (!e.channels.includes(label)) e.channels.push(label); }
    else if (!e.failed.includes(label)) e.failed.push(label);
  }
  return [...map.values()].sort((a, b) => b.time.getTime() - a.time.getTime());
}

export const CHANNELS: Record<string, { name: string; mark: string }> = {
  discord: { name: "Discord", mark: "DC" },
  email: { name: "Email", mark: "EM" },
  sms: { name: "SMS", mark: "SM" },
  slack: { name: "Slack", mark: "SL" },
  teams: { name: "Microsoft Teams", mark: "MT" },
  google_chat: { name: "Google Chat", mark: "GC" },
  telegram: { name: "Telegram", mark: "TG" },
  webhook: { name: "Webhook", mark: "WH" },
  whatsapp: { name: "WhatsApp", mark: "WA" },
};

export function channelLabel(type: string): string {
  return CHANNELS[type]?.name ?? type;
}

/** What each plan includes. Display only: the backend enforces the real limits. */
export const PLAN: Record<string, { name: string; aircraft: number | null; rings: number | null; integrations: number | null; channels: string[] }> = {
  starter: { name: "Starter", aircraft: 3, rings: 2, integrations: 1, channels: ["discord", "email"] },
  premium: { name: "Premium", aircraft: 7, rings: 5, integrations: 3, channels: ["discord", "email", "slack", "teams", "google_chat"] },
  pro: { name: "Pro", aircraft: 15, rings: 7, integrations: 5, channels: ["discord", "email", "slack", "teams", "google_chat", "sms", "telegram", "webhook"] },
  owner: { name: "Owner", aircraft: null, rings: null, integrations: null, channels: ["discord", "email", "slack", "teams", "google_chat", "sms", "telegram", "webhook"] },
};

export function planOf(tier: string | undefined | null) {
  return PLAN[tier ?? ""] ?? { ...PLAN.starter, name: tier && tier !== "free" ? tier : "Free" };
}

/** Position of a point relative to a center, in nautical miles east (x) and north (y). */
export function offsetNm(lat0: number, lon0: number, lat: number, lon: number): { x: number; y: number } {
  const y = (lat - lat0) * 60;
  const x = (lon - lon0) * 60 * Math.cos((lat0 * Math.PI) / 180);
  return { x, y };
}

/** Heading of a runway end: surveyed if known, else from its number. */
export function endHeading(ident: string | null, surveyed: number | null): number | null {
  if (typeof surveyed === "number") return surveyed % 360;
  const n = parseInt(ident ?? "", 10);
  return n >= 1 && n <= 36 ? (n * 10) % 360 : null;
}
