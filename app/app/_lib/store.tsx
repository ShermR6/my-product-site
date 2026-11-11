"use client";

// One shared copy of the data every screen needs, kept fresh by polling.
// Screens read it with useTracker() and call reload() after they change
// something.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "./tracker";
import type { Aircraft, AirportConfig, GroundStatus, Integration, LiveAircraft, Me, NotificationLog } from "./types";

const LIVE_MS = 10_000;   // positions and ground station status
const SLOW_MS = 60_000;   // everything else

type TrackerState = {
  me: Me | null;
  aircraft: Aircraft[];
  live: LiveAircraft[];
  /** null while loading; the object once loaded. `hasAirport` false means none is set up yet. */
  airport: AirportConfig | null;
  hasAirport: boolean | null;
  ground: GroundStatus | null;
  /** false when the account doesn't have the Ground Station add-on. */
  groundEnabled: boolean | null;
  integrations: Integration[];
  /** The latest 200 notifications, newest first. */
  recent: NotificationLog[];
  loaded: boolean;
  /** Set when the last refresh could not reach the tracker. Old data stays on screen. */
  offline: boolean;
  /** "expired" = the plan has lapsed; "signedout" = the website session ended. */
  blocked: null | "expired" | "signedout";
  updatedAt: Date | null;
  /** Clock reading (ms) at the last refresh. Use this instead of Date.now() while rendering. */
  now: number;
  reload: () => Promise<void>;
};

const Ctx = createContext<TrackerState | null>(null);

export function useTracker(): TrackerState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTracker must be used inside <TrackerProvider>");
  return v;
}

type Loaded<T> = { ok: true; value: T } | { ok: false; status: number };

async function get<T>(path: string): Promise<Loaded<T>> {
  try {
    return { ok: true, value: await api<T>(path) };
  } catch (e) {
    return { ok: false, status: e instanceof ApiError ? e.status : 0 };
  }
}

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [live, setLive] = useState<LiveAircraft[]>([]);
  const [airport, setAirport] = useState<AirportConfig | null>(null);
  const [hasAirport, setHasAirport] = useState<boolean | null>(null);
  const [ground, setGround] = useState<GroundStatus | null>(null);
  const [groundEnabled, setGroundEnabled] = useState<boolean | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [recent, setRecent] = useState<NotificationLog[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [blocked, setBlocked] = useState<TrackerState["blocked"]>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(0);
  const busy = useRef(false);

  /** Returns true when the call tells us to stop (plan expired or signed out). */
  const gate = useCallback((status: number) => {
    if (status === 402) { setBlocked("expired"); return true; }
    if (status === 401) { setBlocked("signedout"); return true; }
    return false;
  }, []);

  const loadLive = useCallback(async () => {
    const [lv, gs] = await Promise.all([get<LiveAircraft[]>("aircraft/live"), get<GroundStatus>("ground/status")]);
    setNow(Date.now());
    if (lv.ok) { setLive(lv.value); setOffline(false); setUpdatedAt(new Date()); }
    else if (!gate(lv.status)) setOffline(lv.status === 0 || lv.status >= 500);
    if (gs.ok) { setGround(gs.value); setGroundEnabled(true); }
    else if (gs.status === 403) { setGround(null); setGroundEnabled(false); }
  }, [gate]);

  const reload = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const [u, ac, ap, ints, rec] = await Promise.all([
        get<Me>("user/me"),
        get<Aircraft[]>("aircraft"),
        get<AirportConfig>("airport/config"),
        get<Integration[]>("integrations"),
        get<NotificationLog[]>("notifications/recent?limit=200"),
      ]);
      if (!u.ok && gate(u.status)) return;
      if (u.ok) setMe(u.value);
      if (ac.ok) setAircraft(ac.value);
      if (ap.ok) { setAirport(ap.value); setHasAirport(true); }
      else if (ap.status === 404) { setAirport(null); setHasAirport(false); }
      if (ints.ok) setIntegrations(ints.value);
      if (rec.ok) setRecent(rec.value);
      await loadLive();
      if (u.ok) setLoaded(true);
      else setOffline(true);
    } finally {
      busy.current = false;
    }
  }, [gate, loadLive]);

  useEffect(() => {
    reload();
    const fast = setInterval(() => { if (!document.hidden) loadLive(); }, LIVE_MS);
    const slow = setInterval(() => { if (!document.hidden) reload(); }, SLOW_MS);
    const onShow = () => { if (!document.hidden) reload(); };
    document.addEventListener("visibilitychange", onShow);
    return () => {
      clearInterval(fast);
      clearInterval(slow);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [reload, loadLive]);

  const value = useMemo<TrackerState>(
    () => ({ me, aircraft, live, airport, hasAirport, ground, groundEnabled, integrations, recent, loaded, offline, blocked, updatedAt, now, reload }),
    [me, aircraft, live, airport, hasAirport, ground, groundEnabled, integrations, recent, loaded, offline, blocked, updatedAt, now, reload]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
