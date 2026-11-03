#!/usr/bin/env python3
"""
FinalPing Ground Station v3.0
─────────────────────────────
Reads live ADS-B data from dump1090 and pushes positions to the FinalPing cloud.
Authenticates with a permanent device key (no email/password required).

Data source priority: HTTP JSON API → filesystem aircraft.json → SBS TCP stream (port 30003)

Setup:
  Token is claimed automatically via the FinalPing_Setup hotspot on first boot.
  Or set manually: echo '{"token": "YOUR_KEY"}' > /home/pi/finalping-ground/config.json
"""

import json
import os
import socket
import sys
import threading
import time
import requests
from datetime import datetime
from math import radians, cos, sin, asin, sqrt, atan2, degrees

VERSION    = "3.6"
API_BASE   = "https://aircraft-tracker-backend-production.up.railway.app"
UPDATE_URL = "https://raw.githubusercontent.com/ShermR6/aircraft-tracker-backend/main"

DUMP1090_URL = os.environ.get("DUMP1090_URL", "http://localhost:8080/data/aircraft.json")
SBS_HOST     = os.environ.get("SBS_HOST", "localhost")
SBS_PORT     = int(os.environ.get("SBS_PORT", "30003"))
CONFIG_FILE  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

POLL_INTERVAL      = 5
HEARTBEAT_INTERVAL = 60
RANGE_PUSH_INTERVAL = 300
# Consecutive heartbeat failures before we stop assuming it is the network
# and go re-check our credentials.
REVALIDATE_AFTER_FAILURES = 5
# A single bad decode can place an aircraft on the far side of the planet and
# stretch one bearing of the outline forever, so ignore implausible hits.
MAX_PLAUSIBLE_RANGE_NM = 300
RANGE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "range_data.json")

DUMP1090_HTTP_URLS = [
    DUMP1090_URL,
    "http://localhost:8080/skyaware/data/aircraft.json",
    "http://localhost/skyaware/data/aircraft.json",
    "http://localhost:8888/data/aircraft.json",
    "http://127.0.0.1:8080/data/aircraft.json",
]

DUMP1090_FILE_PATHS = [
    "/run/dump1090-fa/aircraft.json",
    "/run/readsb/aircraft.json",
    "/run/dump1090/aircraft.json",
    "/var/run/dump1090-fa/aircraft.json",
    "/tmp/dump1090-fa/aircraft.json",
    "/home/pi/dump1090/aircraft.json",
]

# ── SBS stream state ──────────────────────────────────────────────────────────
_sbs_aircraft  = {}
_sbs_lock      = threading.Lock()
_sbs_connected = False


def log(msg):
    print(f"{datetime.now().strftime('%H:%M:%S')} {msg}", flush=True)


def haversine_distance(lat1, lon1, lat2, lon2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 3440.065 * 2 * asin(sqrt(a))


def haversine_bearing(lat1, lon1, lat2, lon2):
    lat1, lat2 = radians(lat1), radians(lat2)
    dlon = radians(lon2 - lon1)
    x = sin(dlon) * cos(lat2)
    y = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dlon)
    return (degrees(atan2(x, y)) + 360) % 360


def load_token():
    token = os.environ.get("FINALPING_TOKEN")
    if token:
        return token
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            return json.load(f).get("token")
    return None


def api_get(endpoint, token):
    r = requests.get(f"{API_BASE}{endpoint}", headers={"Authorization": f"Bearer {token}"}, timeout=10)
    r.raise_for_status()
    return r.json()


def api_post(endpoint, token, body):
    r = requests.post(f"{API_BASE}{endpoint}", json=body, headers={"Authorization": f"Bearer {token}"}, timeout=10)
    r.raise_for_status()
    return r.json()


# ── Auto-updater ──────────────────────────────────────────────────────────────

def _version_tuple(v):
    """(3, 6) from "3.6". None if it is not a version at all."""
    try:
        return tuple(int(x) for x in str(v).strip().split("."))
    except (ValueError, AttributeError):
        return None


def check_for_update():
    """Pull a newer agent, but never replace a working one with rubbish.

    The previous version wrote the download straight to disk and re-executed
    it without ever looking at the HTTP status. On 2026-07-30 one transient
    404 from the CDN was enough: the literal body "404: Not Found" was written
    over this file, os.execv restarted into it, and the station died with a
    SyntaxError on line 1. systemd dutifully restarted it every 10 seconds,
    each attempt failing identically, and because it never got far enough to
    send a heartbeat the backend just showed Offline. It stayed that way for
    three months.

    Three independent guards now. Any one of them would have caught it.
    """
    try:
        r = requests.get(f"{UPDATE_URL}/version.txt", timeout=5)
        if r.status_code != 200:
            return
        latest = r.text.strip()
        # A version is short and dotted. An error page, a captive-portal
        # redirect or a 404 body is not a version, so do not act on one.
        if not latest or len(latest) > 12 or not all(c.isdigit() or c == "." for c in latest):
            log(f"[UPDATE] Ignoring unexpected version payload ({latest[:40]!r})")
            return
        # Only ever move forward. Comparing for inequality meant a stale or
        # rolled-back version.txt downgraded every station that had already
        # updated -- observed live: a 3.6 agent "updated" itself to 3.5
        # because the published version file still said 3.5.
        latest_t, current_t = _version_tuple(latest), _version_tuple(VERSION)
        if latest_t is None or current_t is None or latest_t <= current_t:
            return

        log(f"[UPDATE] v{VERSION} -> v{latest} - downloading...")
        r2 = requests.get(f"{UPDATE_URL}/finalping_ground.py", timeout=30)

        # Guard 1: it must actually have been served.
        if r2.status_code != 200:
            log(f"[UPDATE] Download returned HTTP {r2.status_code} - keeping v{VERSION}")
            return
        body = r2.content.decode("utf-8", "replace")
        # Guard 2: it must look like this program.
        if len(body) < 4000 or "def run(" not in body:
            log(f"[UPDATE] Download is not the agent ({len(body)} bytes) - keeping v{VERSION}")
            return
        # Guard 3: it must parse, so we never exec into a SyntaxError.
        try:
            compile(body, "finalping_ground.py", "exec")
        except SyntaxError as e:
            log(f"[UPDATE] Download will not compile ({e}) - keeping v{VERSION}")
            return

        script_path = os.path.abspath(__file__)
        tmp_path = script_path + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            f.write(body)
        os.replace(tmp_path, script_path)
        log(f"[UPDATE] Updated to v{latest} - restarting...")
        os.execv(sys.executable, [sys.executable, script_path] + sys.argv[1:])
    except Exception as e:
        log(f"[UPDATE] Check failed: {e}")


# ── SBS reader (background thread) ───────────────────────────────────────────

def _parse_sbs_line(line):
    if not line.startswith("MSG"):
        return
    parts = line.split(",")
    if len(parts) < 16:
        return
    msg_type = parts[1].strip()
    hex_id   = parts[4].strip().lower()
    if not hex_id:
        return

    def field(i):
        return parts[i].strip() if i < len(parts) and parts[i].strip() else None

    with _sbs_lock:
        if hex_id not in _sbs_aircraft:
            _sbs_aircraft[hex_id] = {"hex": hex_id}
        ac = _sbs_aircraft[hex_id]
        ac["last_seen"] = time.time()

        try:
            if msg_type == "1":
                cs = field(10)
                if cs: ac["flight"] = cs

            elif msg_type == "2":
                if field(14): ac["lat"] = float(parts[14])
                if field(15): ac["lon"] = float(parts[15])
                if field(12): ac["gs"]  = float(parts[12])
                if field(13): ac["track"] = float(parts[13])
                ac["alt_baro"] = "ground"
                ac["on_ground"] = True

            elif msg_type == "3":
                if field(11): ac["alt_baro"] = int(parts[11])
                if field(14): ac["lat"] = float(parts[14])
                if field(15): ac["lon"] = float(parts[15])
                on_g = field(21) if len(parts) > 21 else None
                ac["on_ground"] = (on_g == "-1")

            elif msg_type == "4":
                if field(12): ac["gs"]    = float(parts[12])
                if field(13): ac["track"] = float(parts[13])
        except (ValueError, IndexError):
            pass


def _sbs_reader_thread():
    global _sbs_connected
    while True:
        try:
            with socket.create_connection((SBS_HOST, SBS_PORT), timeout=10) as sock:
                _sbs_connected = True
                log(f"[OK] SBS stream connected on port {SBS_PORT}")
                sock.settimeout(30)
                buf = ""
                while True:
                    chunk = sock.recv(4096).decode("utf-8", errors="replace")
                    if not chunk:
                        break
                    buf += chunk
                    while "\n" in buf:
                        line, buf = buf.split("\n", 1)
                        _parse_sbs_line(line.strip())
        except Exception:
            pass
        _sbs_connected = False
        time.sleep(5)


def fetch_dump1090():
    for url in DUMP1090_HTTP_URLS:
        try:
            r = requests.get(url, timeout=3)
            r.raise_for_status()
            data = r.json()
            return data.get("aircraft", data.get("ac", []))
        except Exception:
            continue

    for path in DUMP1090_FILE_PATHS:
        if os.path.exists(path):
            with open(path) as f:
                data = json.load(f)
            return data.get("aircraft", data.get("ac", []))

    if _sbs_connected:
        cutoff = time.time() - 30
        with _sbs_lock:
            return [dict(ac) for ac in _sbs_aircraft.values() if ac.get("last_seen", 0) > cutoff]

    raise RuntimeError("dump1090 not reachable via HTTP, filesystem, or SBS stream")


# ── Main ──────────────────────────────────────────────────────────────────────

def load_receiver_location(airport_lat, airport_lon):
    """Where the antenna is, which is not necessarily the airport.

    Range is a property of the receiver, so binning it around the field being
    watched shifts the whole outline by the distance between the two and
    distorts the shape. A station at home watching a field 7 nm away is the
    normal case, not a misconfiguration.

    Falls back to the airport so an unconfigured station still produces
    something, but says so loudly, because the result is subtly wrong.
    """
    try:
        with open(CONFIG_FILE, encoding="utf-8") as f:
            cfg = json.load(f)
        lat, lon = cfg.get("receiver_lat"), cfg.get("receiver_lon")
        if lat is not None and lon is not None:
            lat, lon = float(lat), float(lon)
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                return lat, lon, True
    except Exception:
        pass
    return airport_lat, airport_lon, False


def load_range():
    """Reception range accumulates over days, so it has to outlive a restart.

    Previously range_nm was initialised to zeros on every start, which meant a
    reboot, an update or a crash silently discarded however many weeks of
    coverage had been built up.
    """
    try:
        with open(RANGE_FILE, encoding="utf-8") as f:
            saved = json.load(f).get("range_nm")
        if isinstance(saved, list) and len(saved) == 36:
            return [float(v or 0.0) for v in saved]
    except Exception:
        pass
    return [0.0] * 36


def is_airborne(ac):
    """Treat an aircraft as airborne unless it says otherwise.

    Surface reports and very slow targets are excluded: they sit essentially on
    top of the receiver and say nothing about range.
    """
    gs_kt = ac.get("gs")
    return not (ac.get("on_ground", False)
                or ac.get("alt_baro") == "ground"
                or (gs_kt is not None and gs_kt < 50))


def bin_range(range_nm, aircraft_list, center_lat, center_lon):
    """Record the furthest airborne contact per 10-degree bearing, in place.

    Every aircraft with a position counts. The binning used to live below the
    `tracked` filter inside run(), so the outline only ever recorded where the
    handful of tracked aircraft happened to fly -- which is a map of their
    routes, not of what the antenna can receive.
    """
    for ac in aircraft_list:
        lat, lon = ac.get("lat"), ac.get("lon")
        if lat is None or lon is None or not is_airborne(ac):
            continue
        d = haversine_distance(center_lat, center_lon, lat, lon)
        # A single bad decode can place an aircraft on the far side of the
        # planet and stretch that bearing forever.
        if not (0 < d < MAX_PLAUSIBLE_RANGE_NM):
            continue
        bucket = int(haversine_bearing(center_lat, center_lon, lat, lon) / 10) % 36
        if d > range_nm[bucket]:
            range_nm[bucket] = round(d, 1)
    return range_nm


def save_range(range_nm):
    try:
        tmp = RANGE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump({"range_nm": range_nm,
                       "updated_at": datetime.utcnow().isoformat()}, f)
        os.replace(tmp, RANGE_FILE)
    except Exception as e:
        log(f"[WARN] Could not save range data: {e}")


def _is_auth_error(exc):
    """True when the backend actively rejected our credentials, as opposed to
    the network being down."""
    resp = getattr(exc, "response", None)
    return resp is not None and resp.status_code in (401, 403)


def wait_for_valid_token():
    """Block until the backend accepts our token, returning it.

    Retries with backoff rather than exiting: exiting made the service manager
    restart us every few seconds (a log flood on the backend). The token is
    re-read from disk every attempt, so repairing config.json is enough to
    recover, and check_for_update() runs each cycle so a fixed agent still
    lands while we wait.
    """
    backoff = 30
    while True:
        token = load_token()
        if token:
            try:
                api_post("/api/ground/validate", token, {})
                log("[OK] Ground station access confirmed")
                return token
            except requests.HTTPError as e:
                code = e.response.status_code if e.response is not None else None
                if code == 403:
                    log(f"[ERR] Ground station not enabled for this account. Retrying in {backoff}s...")
                else:
                    log(f"[ERR] Validation failed (HTTP {code}) — check the device token. Retrying in {backoff}s...")
            except Exception as e:
                log(f"[ERR] Could not reach backend: {e}. Retrying in {backoff}s...")
        else:
            log(f"[ERR] No token found. Run setup or set FINALPING_TOKEN. Retrying in {backoff}s...")
        time.sleep(backoff)
        backoff = min(backoff * 2, 300)
        check_for_update()


def run():
    check_for_update()

    log("=" * 56)
    log(f"  FinalPing Ground Station v{VERSION}")
    log("=" * 56)

    log("Validating ground station access...")
    token = wait_for_valid_token()

    log("Fetching config from backend...")
    try:
        config = api_get("/api/ground/config", token)
    except Exception as e:
        log(f"[ERR] Failed to fetch config: {e}")
        sys.exit(1)

    center_lat      = float(config["lat"])
    center_lon      = float(config["lon"])
    field_elevation = float(config.get("elevation_ft", 0))
    tracked = {
        a["icao24"].lower(): a["tail"]
        for a in config.get("aircraft", []) if a.get("icao24")
    }

    recv_lat, recv_lon, recv_configured = load_receiver_location(center_lat, center_lon)

    log(f"[OK] Airport: {center_lat:.4f}, {center_lon:.4f} | Elevation: {field_elevation:.0f}ft MSL")
    if recv_configured:
        gap = haversine_distance(center_lat, center_lon, recv_lat, recv_lon)
        log(f"[OK] Receiver: {recv_lat:.4f}, {recv_lon:.4f} ({gap:.1f} nm from the airport)")
    else:
        log("[WARN] No receiver_lat/receiver_lon in config.json - measuring range "
            "from the airport instead. If the antenna is somewhere else, the "
            "range outline will be offset by that distance.")
    log(f"[OK] Tracking {len(tracked)} aircraft: {', '.join(tracked.values()) or 'none configured'}")

    t = threading.Thread(target=_sbs_reader_thread, daemon=True)
    t.start()

    source_label = None
    for u in DUMP1090_HTTP_URLS:
        try:
            if requests.get(u, timeout=2).status_code == 200:
                source_label = u
                break
        except Exception:
            continue
    if not source_label:
        source_label = next((p for p in DUMP1090_FILE_PATHS if os.path.exists(p)), None)
    if not source_label:
        source_label = f"SBS stream port {SBS_PORT}"
    log(f"[OK] Dump1090 source: {source_label}")
    log("Ground station running...")

    range_nm          = load_range()
    last_heartbeat    = 0.0
    heartbeat_failures = 0
    last_range_push   = 0.0
    last_update_check = time.time()
    last_config_refresh = time.time()

    while True:
        now = time.time()

        if now - last_update_check >= 3600:
            check_for_update()
            last_update_check = now

        if now - last_config_refresh >= 3600:
            try:
                config = api_get("/api/ground/config", token)
                tracked = {
                    a["icao24"].lower(): a["tail"]
                    for a in config.get("aircraft", []) if a.get("icao24")
                }
                log(f"[OK] Config refreshed — tracking {len(tracked)} aircraft")
            except Exception as e:
                log(f"[WARN] Config refresh failed: {e}")
            last_config_refresh = now

        if now - last_heartbeat >= HEARTBEAT_INTERVAL:
            try:
                api_post("/api/ground/heartbeat", token, {})
                last_heartbeat = now
                heartbeat_failures = 0
            except Exception as e:
                heartbeat_failures += 1
                log(f"[WARN] Heartbeat failed ({heartbeat_failures}): {e}")
                # Validation only ever ran at startup, so a token that expired
                # or was rotated while we were running produced this warning
                # once a minute forever: the Pi stayed up, dump1090 kept
                # streaming, and nothing ever reached the backend again. The
                # station just went quiet one day and only a reboot brought it
                # back. A rejected token will go on being rejected, so stop
                # guessing and re-validate — which also re-reads config.json,
                # so a repaired key recovers on its own.
                if _is_auth_error(e) or heartbeat_failures >= REVALIDATE_AFTER_FAILURES:
                    log("[WARN] Re-validating ground station access...")
                    token = wait_for_valid_token()
                    heartbeat_failures = 0
                    last_heartbeat = 0.0

        if now - last_range_push >= RANGE_PUSH_INTERVAL and any(v > 0 for v in range_nm):
            try:
                api_post("/api/ground/range", token, {
                    "range_nm": range_nm,
                    "receiver_lat": recv_lat,
                    "receiver_lon": recv_lon,
                })
                save_range(range_nm)
                last_range_push = now
                log(f"[OK] Range updated (max {max(range_nm):.0f}nm)")
            except Exception as e:
                log(f"[WARN] Range push failed: {e}")

        try:
            aircraft_list = fetch_dump1090()
        except Exception as e:
            log(f"[WARN] dump1090 read failed: {e}")
            time.sleep(POLL_INTERVAL)
            continue

        # Reception range is a property of the antenna, so it is measured from
        # every aircraft we can hear -- not just the tracked ones.
        bin_range(range_nm, aircraft_list, recv_lat, recv_lon)

        positions = {}
        for ac in aircraft_list:
            icao24 = ac.get("hex", "").lower()
            lat = ac.get("lat")
            lon = ac.get("lon")

            if icao24 not in tracked:
                continue
            if lat is None or lon is None:
                continue

            gs       = ac.get("gs")
            alt_baro = ac.get("alt_baro")
            on_ground = ac.get("on_ground", False) or (alt_baro == "ground") or (gs is not None and gs < 50)
            altitude  = field_elevation if on_ground else (float(alt_baro) if alt_baro and alt_baro != "ground" else field_elevation)
            speed_kts = float(gs) if gs is not None else 0.0
            heading   = float(ac.get("track") or 0)

            positions[icao24] = {
                "lat": lat, "lon": lon,
                "altitude": altitude,
                "speed": speed_kts,
                "heading": heading,
                "on_ground": on_ground,
                "updated_at": datetime.utcnow().isoformat(),
            }

        if positions:
            try:
                api_post("/api/ground/positions", token, {"positions": positions})
                parts = []
                for icao, p in positions.items():
                    tail = tracked[icao]
                    loc  = "GND" if p["on_ground"] else f"{p['altitude']:.0f}ft"
                    parts.append(f"{tail} {loc}")
                log(f"[OK] {' | '.join(parts)}")
            except Exception as e:
                log(f"[WARN] Position push failed: {e}")
        else:
            log("No tracked aircraft in dump1090 feed")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        log("Ground station stopped")
