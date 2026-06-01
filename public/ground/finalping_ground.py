#!/usr/bin/env python3
"""
FinalPing Ground Station v2.8
─────────────────────────────
Reads live ADS-B data from dump1090's SBS TCP stream (port 30003).
No HTTP server required — works with any dump1090 build.

Requirements:
  pip install requests

Usage:
  python3 finalping_ground.py
"""

import requests
import socket
import threading
import time
import math
import logging
import json
import os
import sys
from datetime import datetime, timedelta

VERSION = "2.8"
PRODUCT_SITE_URL = "https://finalpingapp.com"

# ══════════════════════════════════════════════════════════════════════════════
#  USER CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════

FINALPING_EMAIL    = "your@email.com"
FINALPING_PASSWORD = "yourpassword"

# Override with credentials from persistent file if present (survives script updates)
_creds_file = "/etc/finalping/credentials"
if os.path.exists(_creds_file):
    try:
        _lines = open(_creds_file).read().splitlines()
        if len(_lines) >= 2:
            FINALPING_EMAIL    = _lines[0].strip()
            FINALPING_PASSWORD = _lines[1].strip()
    except Exception:
        pass

# dump1090 SBS TCP stream (port 30003 is always available with --net)
DUMP1090_HOST = "localhost"
DUMP1090_PORT = 30003

POLL_INTERVAL_SECONDS = 5

# ══════════════════════════════════════════════════════════════════════════════
BACKEND_URL = "https://aircraft-tracker-backend-production.up.railway.app"
# ══════════════════════════════════════════════════════════════════════════════

RANGE_FILE    = "/home/pi/finalping-ground/range_data.json"
RANGE_BUCKETS = 36  # one bucket per 10 degrees of compass bearing

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("FinalPing Ground")


def haversine_nm(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 3440.065 * 2 * math.asin(math.sqrt(a))


def bearing_deg(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    x = math.sin(dlon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


class SBSReader(threading.Thread):
    """Background thread that keeps a live aircraft dict from dump1090 port 30003."""

    def __init__(self):
        super().__init__(daemon=True)
        self.aircraft = {}   # icao24 -> state dict
        self._lock = threading.Lock()
        self.connected = False

    def get_snapshot(self):
        with self._lock:
            now = time.time()
            # Drop aircraft not seen in 60 seconds
            return {k: v.copy() for k, v in self.aircraft.items() if now - v["seen"] < 60}

    def _parse(self, line):
        parts = line.split(",")
        if len(parts) < 10 or parts[0] != "MSG":
            return
        try:
            t = int(parts[1])
            icao = parts[4].lower().strip()
            if not icao:
                return
        except (ValueError, IndexError):
            return

        with self._lock:
            s = self.aircraft.setdefault(icao, {
                "hex": icao, "lat": None, "lon": None,
                "altitude": None, "speed": 0, "on_ground": False, "seen": time.time(),
            })
            s["seen"] = time.time()

            try:
                if t == 3 and len(parts) >= 16:   # airborne position
                    if parts[11]: s["altitude"] = int(parts[11])
                    if parts[14] and parts[15]:
                        s["lat"] = float(parts[14])
                        s["lon"] = float(parts[15])
                    if len(parts) > 21:
                        s["on_ground"] = parts[21].strip() == "-1"
                elif t == 4 and len(parts) >= 14:  # velocity — speed + track/heading
                    if parts[12]: s["speed"] = float(parts[12])
                    if parts[13]: s["heading"] = float(parts[13])
                elif t == 2:                       # surface position = on ground
                    s["on_ground"] = True
            except (ValueError, IndexError):
                pass

    def run(self):
        buf = ""
        while True:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(15)
                sock.connect((DUMP1090_HOST, DUMP1090_PORT))
                self.connected = True
                log.info(f"✅ Connected to dump1090 SBS stream on port {DUMP1090_PORT}")
                while True:
                    chunk = sock.recv(4096).decode("utf-8", errors="ignore")
                    if not chunk:
                        break
                    buf += chunk
                    *lines, buf = buf.split("\n")
                    for line in lines:
                        self._parse(line.strip())
            except Exception as e:
                self.connected = False
                log.warning(f"dump1090 connection lost: {e} — retrying in 5s")
            finally:
                try: sock.close()
                except: pass
            time.sleep(5)


def check_for_update():
    """Fetch version.txt from the product site. If newer, download and restart."""
    try:
        r = requests.get(f"{PRODUCT_SITE_URL}/ground/version.txt", timeout=5)
        latest = r.text.strip()
        if latest == VERSION:
            return
        log.info(f"🔄 Update available: v{VERSION} → v{latest}. Downloading...")
        r2 = requests.get(f"{PRODUCT_SITE_URL}/ground/finalping_ground.py", timeout=30)
        script_path = os.path.abspath(__file__)
        tmp_path = script_path + ".tmp"
        with open(tmp_path, "w") as f:
            f.write(r2.text)
        os.replace(tmp_path, script_path)
        log.info(f"✅ Updated to v{latest}. Restarting...")
        os.execv(sys.executable, [sys.executable, script_path] + sys.argv[1:])
    except Exception as e:
        log.warning(f"Update check failed: {e}")


class GroundStation:
    def __init__(self):
        self.token = None
        self.lat = None
        self.lon = None
        self.elevation_ft = None
        self.icao_map = {}
        self.tracked_aircraft = []
        self.alert_distances_nm = [10.0, 5.0, 2.0]

        self.state = {}
        self.alerts_sent = {}
        self.last_notify = {}

        # SDR reception range: max distance seen per 10-degree compass bearing
        self.range_nm = [0.0] * RANGE_BUCKETS
        self._load_range()

        self.sbs = SBSReader()

    # ── Range tracking ────────────────────────────────────────────────────────

    def _load_range(self):
        try:
            if os.path.exists(RANGE_FILE):
                with open(RANGE_FILE) as f:
                    data = json.load(f)
                if isinstance(data, list) and len(data) == RANGE_BUCKETS:
                    self.range_nm = data
        except Exception:
            pass

    def _save_range(self):
        try:
            os.makedirs(os.path.dirname(RANGE_FILE), exist_ok=True)
            with open(RANGE_FILE, "w") as f:
                json.dump(self.range_nm, f)
        except Exception:
            pass

    def _update_range_from_snapshot(self, snapshot):
        if self.lat is None or self.lon is None:
            return
        updated = False
        for raw in snapshot.values():
            lat = raw.get("lat")
            lon = raw.get("lon")
            if lat is None or lon is None:
                continue
            dist = haversine_nm(self.lat, self.lon, lat, lon)
            brng = bearing_deg(self.lat, self.lon, lat, lon)
            bucket = int(brng / 10) % RANGE_BUCKETS
            if dist > self.range_nm[bucket]:
                self.range_nm[bucket] = round(dist, 1)
                updated = True
        return updated

    def sync_range(self):
        if all(v == 0 for v in self.range_nm):
            return
        try:
            resp = requests.post(
                f"{BACKEND_URL}/api/ground/range",
                json={"range_nm": self.range_nm},
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10,
            )
            if resp.status_code == 200:
                self._save_range()
                log.info("📡 Range data synced")
        except Exception as e:
            log.warning(f"Range sync error: {e}")

    # ── Auth ──────────────────────────────────────────────────────────────────

    def login(self):
        log.info(f"Logging in as {FINALPING_EMAIL}...")
        try:
            resp = requests.post(
                f"{BACKEND_URL}/api/auth/login",
                json={"email": FINALPING_EMAIL, "password": FINALPING_PASSWORD},
                timeout=15,
            )
            if resp.status_code == 200:
                data = resp.json()
                self.token = data["access_token"]
                log.info(f"✅ Logged in — {data.get('license_tier', 'unknown')} license")
                return True
            log.error(f"Login failed: {resp.status_code} {resp.text}")
            return False
        except Exception as e:
            log.error(f"Login error: {e}")
            return False

    def validate_ground_station(self):
        try:
            resp = requests.post(
                f"{BACKEND_URL}/api/ground/validate",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10,
            )
            if resp.status_code == 200:
                log.info("✅ Ground station access confirmed")
                return True
            elif resp.status_code == 403:
                log.error("❌ Ground Station not enabled — purchase at finalpingapp.com/pricing")
                return False
            log.error(f"Validation failed: {resp.status_code}")
            return False
        except Exception as e:
            log.error(f"Validation error: {e}")
            return False

    def _heartbeat(self):
        try:
            requests.post(
                f"{BACKEND_URL}/api/ground/heartbeat",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=5,
            )
        except Exception:
            pass

    def fetch_config(self):
        try:
            resp = requests.get(
                f"{BACKEND_URL}/api/ground/config",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=15,
            )
            if resp.status_code == 200:
                data = resp.json()
                self.lat = data["lat"]
                self.lon = data["lon"]
                self.elevation_ft = data["elevation_ft"]
                self.tracked_aircraft = data["aircraft"]
                self.icao_map = {
                    a["icao24"].lower(): a["tail"]
                    for a in self.tracked_aircraft if a.get("icao24")
                }
                tails = ", ".join(a["tail"] for a in self.tracked_aircraft) or "none"
                log.info(f"✅ Config loaded — tracking: {tails}")
                log.info(f"   Location: {self.lat}, {self.lon} @ {self.elevation_ft}ft MSL")
                return True
            elif resp.status_code == 404:
                log.error("No location configured in FinalPing app — set up your airport location first.")
                return False
            log.error(f"Config fetch failed: {resp.status_code}")
            return False
        except Exception as e:
            log.error(f"Config fetch error: {e}")
            return False

    # ── Alert logic ───────────────────────────────────────────────────────────

    def should_notify(self, icao24, alert_type, cooldown_minutes=2):
        key = f"{icao24}_{alert_type}"
        if key in self.last_notify:
            if datetime.now() - self.last_notify[key] < timedelta(minutes=cooldown_minutes):
                return False
        self.last_notify[key] = datetime.now()
        return True

    def check_disappeared(self, snapshot):
        """Fire landing alerts for tracked aircraft that vanished while close to the airport."""
        current = set(snapshot.keys())
        to_remove = []
        for icao24, prev in self.state.items():
            if icao24 in current or icao24 not in self.icao_map:
                continue
            tail = self.icao_map[icao24]
            dist = prev.get("distance")
            prev_on_ground = prev.get("on_ground", True)
            sent = self.alerts_sent.get(icao24, set())
            was_inbound = any(k in sent for k in ["2nm", "5nm", "10nm"])
            # Aircraft disappeared within 5nm while inbound and not yet marked on ground
            if dist is not None and dist < 5.0 and not prev_on_ground and was_inbound:
                if self.should_notify(icao24, "landing", cooldown_minutes=10):
                    log.info(f"🛬 LANDING: {tail} — signal lost at {dist:.1f}nm (landed)")
                    self.push_alerts([{
                        "type": "landing", "tail": tail,
                        "distance": dist,
                        "altitude": prev.get("alt_ft", self.elevation_ft),
                        "speed": 0,
                    }])
                    self.alerts_sent[icao24] = set()
            to_remove.append(icao24)
        for icao24 in to_remove:
            self.state.pop(icao24, None)

    def process_aircraft(self, icao24, raw):
        if icao24 not in self.icao_map:
            return []

        tail = self.icao_map[icao24]
        lat = raw.get("lat")
        lon = raw.get("lon")
        alt = raw.get("altitude")
        speed = raw.get("speed", 0) or 0

        if lat is None or lon is None:
            return []

        # On-ground detection: SBS surface flag OR altitude within 150ft of field elevation.
        # Deliberately tight — a slow final approach at 400ft should NOT be treated as on_ground
        # or the False→True landing transition will never fire.
        on_ground = (
            raw.get("on_ground", False)
            or (isinstance(alt, (int, float)) and alt <= self.elevation_ft + 150)
        )
        alt_ft = self.elevation_ft if on_ground else (float(alt) if alt else self.elevation_ft)
        distance_nm = haversine_nm(self.lat, self.lon, lat, lon)

        prev = self.state.get(icao24, {})
        prev_ground = prev.get("on_ground", None)
        prev_distance = prev.get("distance", None)
        max_distance = max(prev.get("max_distance", distance_nm), distance_nm)

        alerts = []
        sent = self.alerts_sent.setdefault(icao24, set())

        # Takeoff: was on ground last poll and now airborne with speed
        if prev_ground is True and not on_ground and speed > 30:
            if self.should_notify(icao24, "takeoff"):
                log.info(f"🛫 TAKEOFF: {tail} — {speed}kts")
                alerts.append({"type": "takeoff", "tail": tail, "distance": distance_nm, "altitude": alt_ft, "speed": speed})

        # Takeoff: first contact — aircraft already airborne (Pi likely not at airport, hears it
        # once it climbs high enough). Wide window: 20nm, 40kts+, under 8000ft AGL.
        if prev_ground is None and not on_ground and speed > 40 and distance_nm < 20.0 and alt_ft < self.elevation_ft + 8000:
            if self.should_notify(icao24, "takeoff"):
                log.info(f"🛫 TAKEOFF: {tail} — first contact airborne, {speed}kts at {distance_nm:.1f}nm")
                alerts.append({"type": "takeoff", "tail": tail, "distance": distance_nm, "altitude": alt_ft, "speed": speed})

        # Normal landing detection (altitude/flag based)
        if prev_ground is False and on_ground:
            if self.should_notify(icao24, "landing"):
                log.info(f"🛬 LANDING: {tail}")
                alerts.append({"type": "landing", "tail": tail, "distance": distance_nm, "altitude": alt_ft, "speed": speed})
                sent.clear()

        # Stale-signal landing: dump1090 keeps aircraft in memory ~60s after last message.
        # If signal hasn't updated in >20s and the aircraft is within 3nm, fire landing now
        # rather than waiting for dump1090 to purge the entry (~60s later).
        if not on_ground and not alerts:
            seen_time = raw.get("seen")
            stale_secs = (time.time() - seen_time) if seen_time else 0
            if prev_ground is False and stale_secs > 20 and distance_nm < 3.0:
                if self.should_notify(icao24, "landing"):
                    log.info(f"🛬 LANDING: {tail} — stale signal ({stale_secs:.0f}s) at {distance_nm:.1f}nm")
                    alerts.append({"type": "landing", "tail": tail, "distance": distance_nm, "altitude": alt_ft, "speed": speed})
                    sent.clear()
                on_ground = True  # reflect landed state going forward

        if not on_ground and prev_distance is not None:
            for alert_dist in sorted(self.alert_distances_nm, reverse=True):
                key = f"{int(alert_dist) if alert_dist == int(alert_dist) else alert_dist}nm"
                if prev_distance > alert_dist >= distance_nm and max_distance > alert_dist and key not in sent:
                    eta = int(distance_nm / max(speed / 60, 0.5)) if speed > 10 else int(distance_nm / 1.5)
                    if self.should_notify(icao24, key):
                        log.info(f"📍 {key}: {tail} — {distance_nm:.1f}nm, ETA ~{eta}min")
                        alerts.append({"type": key, "tail": tail, "distance": distance_nm, "altitude": alt_ft, "eta": eta, "speed": speed})
                        sent.add(key)

        if distance_nm > 12.0:
            self.alerts_sent[icao24] = set()

        self.state[icao24] = {
            "on_ground": on_ground, "distance": distance_nm, "max_distance": max_distance,
            "lat": lat, "lon": lon, "alt_ft": alt_ft, "speed": speed,
        }
        return alerts

    def push_positions(self, snapshot):
        """Push tracked aircraft positions to backend for the live map."""
        positions = {}
        for icao24, raw in snapshot.items():
            if icao24 not in self.icao_map:
                continue
            lat = raw.get("lat")
            lon = raw.get("lon")
            if lat is None or lon is None:
                continue
            positions[icao24] = {
                "lat": lat,
                "lon": lon,
                "altitude": raw.get("altitude"),
                "speed": raw.get("speed", 0),
                "heading": raw.get("heading"),
                "on_ground": raw.get("on_ground", False),
            }
        if not positions:
            return
        try:
            requests.post(
                f"{BACKEND_URL}/api/ground/positions",
                json={"positions": positions},
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=5,
            )
        except Exception:
            pass

    def push_alerts(self, alerts):
        for alert in alerts:
            try:
                resp = requests.post(
                    f"{BACKEND_URL}/api/ground/ingest",
                    json=alert,
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10,
                )
                if resp.status_code == 200:
                    log.info(f"✅ Alert pushed: {alert['type']} / {alert['tail']}")
                elif resp.status_code == 401:
                    log.warning("Token expired — re-logging in...")
                    self.login()
                else:
                    log.warning(f"Push failed: {resp.status_code}")
            except Exception as e:
                log.error(f"Push error: {e}")

    # ── Main loop ─────────────────────────────────────────────────────────────

    def run(self):
        check_for_update()
        log.info("=" * 60)
        log.info(f"  FinalPing Ground Station v{VERSION}")
        log.info("=" * 60)

        if not self.login():
            log.error("Login failed — check credentials.")
            return
        if not self.validate_ground_station():
            return
        if not self.fetch_config():
            return

        self.sbs.start()
        log.info(f"  Polling every {POLL_INTERVAL_SECONDS}s")
        log.info("=" * 60)

        last_login          = datetime.now()
        last_config_refresh = datetime.now()
        last_heartbeat      = datetime.now() - timedelta(minutes=2)
        last_range_sync     = datetime.now() - timedelta(minutes=6)
        last_update_check   = datetime.now()
        receiver_warned     = False

        while True:
            try:
                if datetime.now() - last_update_check > timedelta(hours=1):
                    check_for_update()
                    last_update_check = datetime.now()

                if datetime.now() - last_login > timedelta(hours=23):
                    self.login()
                    last_login = datetime.now()

                if datetime.now() - last_config_refresh > timedelta(hours=1):
                    self.fetch_config()
                    last_config_refresh = datetime.now()

                if datetime.now() - last_heartbeat > timedelta(minutes=1):
                    self._heartbeat()
                    last_heartbeat = datetime.now()

                if not self.sbs.connected:
                    if not receiver_warned:
                        log.warning("Cannot reach dump1090 — is your receiver running?")
                        receiver_warned = True
                else:
                    receiver_warned = False
                    snapshot = self.sbs.get_snapshot()

                    # Update SDR range from ALL aircraft with positions
                    self._update_range_from_snapshot(snapshot)

                    # Sync range to backend every 5 minutes
                    if datetime.now() - last_range_sync > timedelta(minutes=5):
                        self.sync_range()
                        last_range_sync = datetime.now()

                    # Check for tracked aircraft that disappeared (likely landed)
                    self.check_disappeared(snapshot)

                    self.push_positions(snapshot)

                    all_alerts = []
                    for icao24, raw in snapshot.items():
                        all_alerts.extend(self.process_aircraft(icao24, raw))
                    if all_alerts:
                        self.push_alerts(all_alerts)

            except KeyboardInterrupt:
                log.info("Stopped.")
                break
            except Exception as e:
                log.error(f"Loop error: {e}")

            time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    station = GroundStation()
    station.run()
