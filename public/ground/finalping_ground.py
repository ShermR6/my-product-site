#!/usr/bin/env python3
"""
FinalPing Ground Station v1.0
─────────────────────────────
Runs on your Raspberry Pi or local computer alongside your ADS-B receiver.
Reads live aircraft data from dump1090 and sends alerts to your FinalPing account.

Requirements:
  pip install requests

Usage:
  python3 finalping_ground.py

Setup:
  1. Fill in the config section below with your FinalPing credentials
  2. Make sure dump1090 or PiAware is running on this device
  3. Run this script — it will start monitoring immediately
  4. To run on boot: sudo systemctl enable finalping-ground (see README)
"""

import requests
import time
import json
import math
import logging
from datetime import datetime, timedelta

# ══════════════════════════════════════════════════════════════════════════════
#  USER CONFIGURATION — edit these values
# ══════════════════════════════════════════════════════════════════════════════

FINALPING_EMAIL    = "your@email.com"       # Your FinalPing account email
FINALPING_PASSWORD = "yourpassword"          # Your FinalPing password

# Your ADS-B receiver's dump1090 address
# Default is localhost if running on the same device
# Change to e.g. "http://192.168.1.50:8080" if receiver is on another device
DUMP1090_URL = "http://localhost:8080/data/aircraft.json"

# Your location (where your receiver is)
MY_LAT = 33.2001       # Latitude
MY_LON = -97.1998      # Longitude
MY_ELEVATION_FT = 641  # Elevation in feet MSL

# Aircraft to track — add as many as you want
# Find ICAO24 hex codes at https://globe.adsbexchange.com
TRACKED_AIRCRAFT = [
    {"tail": "N12345", "icao24": "a1b2c3"},
    {"tail": "N80896", "icao24": "a4d2f1"},
]

# Alert distances in nautical miles
ALERT_DISTANCES_NM = [10.0, 5.0, 2.0]

# How often to poll your receiver (seconds)
POLL_INTERVAL_SECONDS = 5

# ══════════════════════════════════════════════════════════════════════════════
#  FINALPING BACKEND — do not change
# ══════════════════════════════════════════════════════════════════════════════

BACKEND_URL = "https://aircraft-tracker-backend-production.up.railway.app"

# ══════════════════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("FinalPing Ground")


def haversine_nm(lat1, lon1, lat2, lon2):
    """Distance between two lat/lon points in nautical miles"""
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 3440.065 * 2 * math.asin(math.sqrt(a))


class GroundStation:
    def __init__(self):
        self.token = None
        self.icao_map = {a["icao24"].lower(): a["tail"] for a in TRACKED_AIRCRAFT}

        # Per-aircraft state
        self.state = {}         # icao24 -> state dict
        self.alerts_sent = {}   # icao24 -> set of alert keys sent
        self.last_notify = {}   # icao24_type -> datetime of last notification

    # ── Auth ──────────────────────────────────────────────────────────────────

    def login(self):
        """Login to FinalPing and get a JWT token"""
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
                tier = data.get("license_tier", "unknown")
                log.info(f"✅ Logged in — {tier} license")
                return True
            else:
                log.error(f"Login failed: {resp.status_code} {resp.text}")
                return False
        except Exception as e:
            log.error(f"Login error: {e}")
            return False

    def validate_ground_station(self):
        """Check that this account has ground station access enabled"""
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
                log.error("")
                log.error("━" * 60)
                log.error("  ❌ Ground Station not enabled for this account")
                log.error("")
                log.error("  Purchase FinalPing Ground Station at:")
                log.error("  https://finalpingapp.com/ground")
                log.error("━" * 60)
                log.error("")
                return False
            else:
                log.error(f"Validation failed: {resp.status_code}")
                return False
        except Exception as e:
            log.error(f"Validation error: {e}")
            return False

    # ── Receiver ──────────────────────────────────────────────────────────────

    def fetch_aircraft(self):
        """Fetch aircraft list from local dump1090"""
        try:
            resp = requests.get(DUMP1090_URL, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                # dump1090 returns either {"aircraft": [...]} or just [...]
                if isinstance(data, list):
                    return data
                return data.get("aircraft", [])
        except requests.exceptions.ConnectionError:
            log.warning("Cannot reach dump1090 — is your receiver running?")
        except Exception as e:
            log.warning(f"Receiver fetch error: {e}")
        return []

    # ── State & Alert Logic ───────────────────────────────────────────────────

    def should_notify(self, icao24, alert_type, cooldown_minutes=2):
        """Cooldown check — avoid spamming the same alert"""
        key = f"{icao24}_{alert_type}"
        if key in self.last_notify:
            if datetime.now() - self.last_notify[key] < timedelta(minutes=cooldown_minutes):
                return False
        self.last_notify[key] = datetime.now()
        return True

    def process_aircraft(self, raw):
        """
        Process a single aircraft from dump1090 and return any alerts to send.
        dump1090 fields: hex, flight, lat, lon, altitude, speed, track, seen, seen_pos
        """
        icao24 = raw.get("hex", "").lower().strip()
        if icao24 not in self.icao_map:
            return []

        tail = self.icao_map[icao24]
        lat = raw.get("lat")
        lon = raw.get("lon")
        alt = raw.get("altitude")   # feet MSL, or "ground"
        speed = raw.get("speed", 0) or 0
        seen = raw.get("seen", 0)   # seconds since last message

        # Skip stale data
        if seen > 30:
            return []

        # Skip if no position
        if lat is None or lon is None:
            return []

        on_ground = alt == "ground" or (isinstance(alt, (int, float)) and alt <= MY_ELEVATION_FT + 50)
        alt_ft = MY_ELEVATION_FT if on_ground else (float(alt) if alt and alt != "ground" else MY_ELEVATION_FT)
        alt_agl = max(0, alt_ft - MY_ELEVATION_FT)

        distance_nm = haversine_nm(MY_LAT, MY_LON, lat, lon)

        prev = self.state.get(icao24, {})
        prev_ground = prev.get("on_ground", None)
        prev_distance = prev.get("distance", None)
        max_distance = prev.get("max_distance", distance_nm)

        if distance_nm > max_distance:
            max_distance = distance_nm

        alerts = []
        sent = self.alerts_sent.setdefault(icao24, set())

        # ── Ground detection (real data from receiver) ─────────────────────
        # Takeoff: was on ground, now airborne and gaining speed
        if prev_ground is True and not on_ground and speed > 60:
            if self.should_notify(icao24, "takeoff"):
                log.info(f"🛫 TAKEOFF detected: {tail} — speed {speed}kts")
                alerts.append({
                    "type": "takeoff",
                    "tail": tail,
                    "distance": distance_nm,
                    "altitude": alt_ft,
                    "speed": speed,
                })

        # Landing: was airborne, now on ground
        if prev_ground is False and on_ground:
            if self.should_notify(icao24, "landing"):
                log.info(f"🛬 LANDING detected: {tail}")
                alerts.append({
                    "type": "landing",
                    "tail": tail,
                    "distance": distance_nm,
                    "altitude": alt_ft,
                    "speed": speed,
                })
                sent.clear()  # Reset distance alerts after landing

        # ── Distance alerts (airborne approaching) ─────────────────────────
        if not on_ground and prev_distance is not None:
            for alert_dist in sorted(ALERT_DISTANCES_NM, reverse=True):
                key = f"{int(alert_dist) if alert_dist == int(alert_dist) else alert_dist}nm"
                crossed = prev_distance > alert_dist >= distance_nm
                was_far_enough = max_distance > alert_dist
                if crossed and was_far_enough and key not in sent:
                    eta = int(distance_nm / max(speed / 60, 0.5)) if speed > 10 else int(distance_nm / 1.5)
                    if self.should_notify(icao24, key):
                        log.info(f"📍 {key} alert: {tail} — {distance_nm:.1f}nm, {alt_agl:.0f}ft AGL, ETA ~{eta}min")
                        alerts.append({
                            "type": key,
                            "tail": tail,
                            "distance": distance_nm,
                            "altitude": alt_ft,
                            "eta": eta,
                            "speed": speed,
                        })
                        sent.add(key)

        # Reset distance alerts if aircraft moves back out past 12nm
        if distance_nm > 12.0:
            self.alerts_sent[icao24] = set()

        # Update state
        self.state[icao24] = {
            "on_ground": on_ground,
            "distance": distance_nm,
            "max_distance": max_distance,
            "lat": lat,
            "lon": lon,
            "alt_ft": alt_ft,
            "speed": speed,
        }

        return alerts

    # ── Push to FinalPing ────────────────────────────────────────────────────

    def push_alerts(self, alerts):
        """Send alerts to FinalPing Railway backend"""
        if not self.token:
            return

        for alert in alerts:
            try:
                resp = requests.post(
                    f"{BACKEND_URL}/api/ground/ingest",
                    json=alert,
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10,
                )
                if resp.status_code == 200:
                    log.info(f"✅ Alert pushed: {alert['type']} for {alert['tail']}")
                elif resp.status_code == 401:
                    log.warning("Token expired — re-logging in...")
                    self.login()
                else:
                    log.warning(f"Push failed: {resp.status_code} {resp.text}")
            except Exception as e:
                log.error(f"Push error: {e}")

    # ── Main loop ─────────────────────────────────────────────────────────────

    def run(self):
        """Main polling loop"""
        log.info("=" * 60)
        log.info("  FinalPing Ground Station")
        log.info(f"  Location: {MY_LAT}, {MY_LON} @ {MY_ELEVATION_FT}ft MSL")
        log.info(f"  Tracking: {', '.join(a['tail'] for a in TRACKED_AIRCRAFT)}")
        log.info(f"  Receiver: {DUMP1090_URL}")
        log.info(f"  Polling every {POLL_INTERVAL_SECONDS}s")
        log.info("=" * 60)

        if not self.login():
            log.error("Could not log in — check your credentials and try again.")
            return

        if not self.validate_ground_station():
            return

        # Re-login every 23 hours to keep token fresh
        last_login = datetime.now()

        while True:
            try:
                # Refresh token if needed
                if datetime.now() - last_login > timedelta(hours=23):
                    self.login()
                    last_login = datetime.now()

                aircraft_list = self.fetch_aircraft()
                all_alerts = []

                for raw in aircraft_list:
                    alerts = self.process_aircraft(raw)
                    all_alerts.extend(alerts)

                if all_alerts:
                    self.push_alerts(all_alerts)

            except KeyboardInterrupt:
                log.info("Stopped by user.")
                break
            except Exception as e:
                log.error(f"Loop error: {e}")

            time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    station = GroundStation()
    station.run()
