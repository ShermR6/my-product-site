# Backend Additions and Ground Agent 3.7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-event channel routing, a multi-runway approach filter and receiver stats to the Personal tracker backend, fix the plan channel-list mismatch, and ship ground agent 3.7 that reports the stats.

**Architecture:** All decision logic goes into one pure module, `alert_rules.py`, that both `main.py` and `tracker.py` import and that is unit-tested without a database. Three new nullable JSON columns are mapped as SQLAlchemy `deferred` columns and read through a guarded helper, so a database that has not been migrated cannot break any existing query. The agent only adds fields to the heartbeat body it already sends.

**Tech Stack:** Python 3, FastAPI, SQLAlchemy 2.0, PostgreSQL, pytest (local only, not added to `requirements.txt`).

This is plan 1 of 3 for the spec `docs/superpowers/specs/2026-11-10-web-app-black-theme-design.md`. Plan 2 is the site theme, plan 3 is the web app.

## Global Constraints

- Repo: `C:\Users\sherm\OneDrive\Documents\FinalPing\aircraft-tracker-backend` (Personal backend only; `aircraft-tracker-backend-teams` is not touched).
- Pushing `main` deploys to Railway AND is where every customer receiver self-updates from. `version.txt` on `main` stays `3.6` and `finalping_ground.py` on `main` stays unchanged until Task 6 says otherwise.
- Every schema change is `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, nullable, behavior unchanged when null.
- Desktop apps must behave exactly as before: a payload from the desktop app must never cause a write to a new column unless it is clearing a list the web app set.
- Alert type keys: ring keys as the tracker emits them (`"10nm"`, `"2.5nm"`), `"landing"`, `"takeoff"`.
- Routing shape: `{"<alert_type>": ["<integration_id>", …]}` listing integrations switched OFF.
- Heading tolerance stays 35°.
- Commit messages end with `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.

## File Structure

| File | Responsibility |
|---|---|
| `alert_rules.py` (new) | Pure rules: plan channels, routing filter/cleaning, heading checks, stats cleaning |
| `tests/test_alert_rules.py` (new) | Unit tests for `alert_rules.py` |
| `tests/test_ground_agent.py` (new) | Unit tests for the agent's stats helpers |
| `migrate_web_app.py` (new) | Pre-start migration adding the three columns |
| `models.py` | Three deferred columns + `read_optional_column` |
| `main.py` | Routing endpoints, heartbeat/status stats, airport config headings, cleanup fixes |
| `tracker.py` | Uses `alert_rules` for channels, routing and headings |
| `railway.toml` | Runs `migrate_web_app.py` before uvicorn |
| `finalping_ground.py`, `version.txt` | Agent 3.7 (branch `agent-3.7` until verified on the Pi) |

---

### Task 1: Pure rules module

**Files:**
- Create: `alert_rules.py`
- Create: `tests/test_alert_rules.py`

**Interfaces:**
- Produces: `PLAN_CHANNELS: dict[str, list[str]]`, `send_channels_for_tier(tier) -> list[str]`, `normalize_alert_type(s) -> str`, `routed_integrations(integrations, routing, alert_type) -> list`, `clean_routing(routing, valid_integration_ids) -> dict`, `prune_routing(routing, valid_alert_types=None, remove_integration_id=None) -> dict`, `clean_headings(value) -> list[float] | None`, `reconcile_headings(payload, current) -> list[float] | None`, `approach_headings(airspace) -> list[float]`, `heading_allowed(track, headings, tolerance=35.0) -> bool`, `clean_gs_stats(body) -> dict | None`.

- [ ] **Step 1: Branch and install pytest locally**

```bash
cd "C:/Users/sherm/OneDrive/Documents/FinalPing/aircraft-tracker-backend"
git checkout -b web-app-backend
python -m pip install --quiet pytest
```

- [ ] **Step 2: Write the failing tests** — `tests/test_alert_rules.py`

```python
from types import SimpleNamespace

import alert_rules as r


def _ints(*ids):
    return [SimpleNamespace(id=i, type="discord") for i in ids]


# ── plan channels ────────────────────────────────────────────────────────────

def test_pro_sends_to_everything_it_can_connect():
    for ch in ("telegram", "webhook", "google_chat", "sms"):
        assert ch in r.send_channels_for_tier("pro")


def test_owner_is_not_treated_as_starter():
    assert "sms" in r.send_channels_for_tier("owner")


def test_nobody_loses_a_channel_the_tracker_used_to_send():
    legacy = {
        "starter": ["discord", "email"],
        "premium": ["discord", "email", "slack", "sms", "teams"],
        "pro": ["discord", "email", "slack", "sms", "teams", "whatsapp"],
    }
    for tier, channels in legacy.items():
        for ch in channels:
            assert ch in r.send_channels_for_tier(tier), (tier, ch)


def test_unknown_tier_falls_back_to_starter():
    assert r.send_channels_for_tier("free") == ["discord", "email"]


# ── routing ──────────────────────────────────────────────────────────────────

def test_no_routing_sends_to_everyone():
    ints = _ints("a", "b")
    assert r.routed_integrations(ints, None, "10nm") == ints
    assert r.routed_integrations(ints, {}, "10nm") == ints


def test_routing_drops_only_the_listed_integration_for_that_event():
    ints = _ints("a", "b")
    routing = {"10nm": ["a"]}
    assert [i.id for i in r.routed_integrations(ints, routing, "10nm")] == ["b"]
    assert [i.id for i in r.routed_integrations(ints, routing, "landing")] == ["a", "b"]


def test_routing_matches_float_style_ring_keys():
    ints = _ints("a")
    assert r.routed_integrations(ints, {"10nm": ["a"]}, "10.0nm") == []


def test_malformed_routing_never_blocks_alerts():
    ints = _ints("a")
    assert r.routed_integrations(ints, "nonsense", "10nm") == ints
    assert r.routed_integrations(ints, {"10nm": "a"}, "10nm") == ints


def test_clean_routing_keeps_only_own_ids_and_valid_keys():
    cleaned = r.clean_routing(
        {"10.0nm": ["a", "zzz", "a"], "landing": [], "bogus": ["a"], 5: ["a"], "takeoff": ["b"]},
        ["a", "b"],
    )
    assert cleaned == {"10nm": ["a"], "takeoff": ["b"]}


def test_clean_routing_rejects_non_dict():
    assert r.clean_routing(["a"], ["a"]) == {}


def test_prune_routing_removes_an_integration_and_dead_rings():
    routing = {"10nm": ["a", "b"], "5nm": ["a"], "landing": ["a"]}
    assert r.prune_routing(routing, remove_integration_id="a") == {"10nm": ["b"]}
    assert r.prune_routing(routing, valid_alert_types={"10nm", "landing", "takeoff"}) == {
        "10nm": ["a", "b"], "landing": ["a"],
    }


# ── headings ─────────────────────────────────────────────────────────────────

def test_single_heading_behaves_as_before():
    airspace = {"approach_runway_heading": 180.0}
    hs = r.approach_headings(airspace)
    assert hs == [180.0]
    assert r.heading_allowed(182, hs)
    assert r.heading_allowed(215, hs)
    assert not r.heading_allowed(216, hs)


def test_list_of_headings_allows_any_of_them():
    hs = r.approach_headings({"approach_runway_heading": 180.0, "approach_runway_headings": [180.0, 0.0]})
    assert hs == [180.0, 0.0]
    assert r.heading_allowed(355, hs)
    assert r.heading_allowed(170, hs)
    assert not r.heading_allowed(90, hs)


def test_no_heading_configured_means_no_filter_list():
    assert r.approach_headings({}) == []
    assert r.approach_headings({"approach_runway_headings": []}) == []


def test_clean_headings():
    assert r.clean_headings([180, "0", 360, 999, "x", True, 180]) == [180.0, 0.0]
    assert r.clean_headings([]) is None
    assert r.clean_headings("180") is None


def test_reconcile_web_payload_keeps_list():
    assert r.reconcile_headings(
        {"approach_runway_headings": [180, 0], "approach_runway_heading": 180}, None
    ) == [180.0, 0.0]


def test_reconcile_desktop_payload_clears_list():
    # Desktop builds its own payload: single heading only.
    assert r.reconcile_headings({"approach_runway_heading": 0}, [180.0, 0.0]) is None
    # Desktop echoes a fetched config back but changed the single heading.
    assert r.reconcile_headings(
        {"approach_runway_headings": [180.0, 0.0], "approach_runway_heading": 0}, [180.0, 0.0]
    ) is None


def test_reconcile_untouched_payload_keeps_current():
    assert r.reconcile_headings({"alert_distances_nm": [10]}, [180.0]) == [180.0]
    # Desktop echoing the fetched config unchanged keeps the web app's list.
    assert r.reconcile_headings(
        {"approach_runway_headings": [180.0, 0.0], "approach_runway_heading": 180.0}, [180.0, 0.0]
    ) == [180.0, 0.0]


# ── receiver stats ───────────────────────────────────────────────────────────

def test_old_agents_send_nothing_and_change_nothing():
    assert r.clean_gs_stats({}) is None
    assert r.clean_gs_stats(None) is None
    assert r.clean_gs_stats("x") is None


def test_stats_are_whitelisted_and_typed():
    assert r.clean_gs_stats({
        "version": "3.7", "uptime_s": 3600.9, "msg_rate": 84.26, "aircraft_count": 12,
        "evil": "<script>", "extra": 1,
    }) == {"version": "3.7", "uptime_s": 3600, "msg_rate": 84.3, "aircraft_count": 12}


def test_stats_drop_bad_values_individually():
    assert r.clean_gs_stats({
        "version": "x" * 50, "uptime_s": -1, "msg_rate": None, "aircraft_count": True,
    }) is None
    assert r.clean_gs_stats({"uptime_s": 5, "msg_rate": float("nan")}) == {"uptime_s": 5}
```

- [ ] **Step 3: Run the tests and see them fail**

Run: `python -m pytest tests -q`
Expected: collection error, `ModuleNotFoundError: No module named 'alert_rules'`.

- [ ] **Step 4: Write `alert_rules.py`**

```python
"""Pure rules for who gets which alert.

Shared by main.py and tracker.py. Deliberately imports nothing from the app
(no database, no FastAPI) so it can be tested on its own, and so neither
module has to import the other to agree on what a plan includes.
"""

import re
from typing import Iterable, List, Optional

# ── Plan channels ────────────────────────────────────────────────────────────

# Channels a plan may CONNECT. main.TIER_LIMITS[tier]["channels"] points here.
PLAN_CHANNELS = {
    "starter":      ["discord", "email"],
    "premium":      ["discord", "email", "slack", "teams", "google_chat"],
    "pro":          ["discord", "email", "slack", "teams", "google_chat", "sms", "telegram", "webhook"],
    "team-starter": ["discord", "email"],
    "team-premium": ["discord", "email", "slack", "teams", "google_chat", "sms", "telegram", "webhook"],
    "team-pro":     ["discord", "email", "slack", "teams", "google_chat", "sms", "telegram", "webhook"],
    # Internal, never sold.
    "owner":        ["discord", "email", "slack", "teams", "google_chat", "sms", "telegram", "webhook"],
}

# The tracker used to keep a second, private list of channels it would deliver
# to. The two disagreed: a Pro user could connect Telegram, a webhook or Google
# Chat and the tracker silently never sent to them, and "owner" was missing so
# it fell back to starter. Delivery now follows PLAN_CHANNELS, plus the few
# channels only the old list had, so nobody stops receiving an alert they get
# today.
_LEGACY_SEND_EXTRAS = {
    "premium":  ["sms"],
    "pro":      ["whatsapp"],
    "team-pro": ["whatsapp"],
}


def send_channels_for_tier(tier: str) -> List[str]:
    """Channel types the tracker will deliver to for this plan."""
    base = PLAN_CHANNELS.get(tier, PLAN_CHANNELS["starter"])
    return base + [c for c in _LEGACY_SEND_EXTRAS.get(tier, []) if c not in base]


# ── Per-event routing ────────────────────────────────────────────────────────

_ALERT_TYPE_RE = re.compile(r"^(\d+(\.\d+)?nm|landing|takeoff)$")


def normalize_alert_type(alert_type) -> str:
    """ "10.0nm" -> "10nm". "2.5nm" and anything that is not a ring stay as is."""
    s = str(alert_type)
    if s.endswith("nm"):
        try:
            f = float(s[:-2])
        except ValueError:
            return s
        return f"{int(f)}nm" if f == int(f) else f"{f}nm"
    return s


def routed_integrations(integrations: Iterable, routing, alert_type) -> list:
    """Drop the integrations the user switched off for this alert type.

    `routing` is {"<alert_type>": [integration_id, ...]}. Anything malformed is
    treated as "no routing": a bad setting must never stop an alert going out.
    """
    integrations = list(integrations)
    if not isinstance(routing, dict) or not routing:
        return integrations
    off = routing.get(normalize_alert_type(alert_type))
    if off is None:
        off = routing.get(str(alert_type))
    if not isinstance(off, list) or not off:
        return integrations
    off_ids = {str(i) for i in off}
    return [i for i in integrations if str(i.id) not in off_ids]


def clean_routing(routing, valid_integration_ids: Iterable) -> dict:
    """Sanitise a routing map sent by a client: known alert types only, the
    caller's own integration ids only, no duplicates, no empty lists."""
    if not isinstance(routing, dict):
        return {}
    valid = {str(i) for i in valid_integration_ids}
    out = {}
    for key, ids in routing.items():
        if not isinstance(key, str) or not _ALERT_TYPE_RE.match(key) or not isinstance(ids, list):
            continue
        kept = []
        for i in ids:
            s = str(i)
            if s in valid and s not in kept:
                kept.append(s)
        if kept:
            out[normalize_alert_type(key)] = kept
    return out


def prune_routing(routing, valid_alert_types=None, remove_integration_id=None) -> dict:
    """Routing with a deleted integration and/or removed rings taken out."""
    if not isinstance(routing, dict):
        return {}
    out = {}
    for key, ids in routing.items():
        if valid_alert_types is not None and key not in valid_alert_types:
            continue
        if not isinstance(ids, list):
            continue
        kept = [str(i) for i in ids if remove_integration_id is None or str(i) != str(remove_integration_id)]
        if kept:
            out[key] = kept
    return out


# ── Approach filter ──────────────────────────────────────────────────────────

MAX_APPROACH_HEADINGS = 8


def clean_headings(value) -> Optional[List[float]]:
    """A list of runway headings (degrees true) from a client, or None."""
    if not isinstance(value, list):
        return None
    out: List[float] = []
    for v in value:
        if isinstance(v, bool):
            continue
        try:
            f = float(v)
        except (TypeError, ValueError):
            continue
        if f != f or f < 0 or f > 360:   # f != f is NaN
            continue
        f = f % 360
        if f not in out:
            out.append(f)
    return out[:MAX_APPROACH_HEADINGS] or None


def reconcile_headings(payload: dict, current) -> Optional[List[float]]:
    """What approach_runway_headings should be after an airport-config save.

    The web app sends the list and, for older readers, the first entry as
    approach_runway_heading. The desktop app only knows the single heading: it
    either builds a payload without the list, or echoes back a config it
    fetched (list included) with the single heading changed. In both desktop
    cases the single heading must win, so the list is cleared.
    """
    if "approach_runway_headings" in payload:
        cleaned = clean_headings(payload.get("approach_runway_headings"))
        single = payload.get("approach_runway_heading")
        if cleaned and single is not None:
            try:
                if float(single) % 360 != cleaned[0]:
                    return None
            except (TypeError, ValueError):
                pass
        return cleaned
    if "approach_runway_heading" in payload:
        return None
    return current


def approach_headings(airspace: dict) -> List[float]:
    """Headings the approach filter accepts: the list when there is one,
    otherwise the single legacy heading, otherwise nothing."""
    headings = airspace.get("approach_runway_headings")
    if isinstance(headings, list) and headings:
        return [float(h) for h in headings]
    single = airspace.get("approach_runway_heading")
    return [float(single)] if single is not None else []


def heading_allowed(track, headings: Iterable[float], tolerance: float = 35.0) -> bool:
    """True when the aircraft's track is within `tolerance` of any heading."""
    t = float(track)
    return any(abs((t - h + 180) % 360 - 180) <= tolerance for h in headings)


# ── Receiver stats ───────────────────────────────────────────────────────────

def clean_gs_stats(body) -> Optional[dict]:
    """The stats a ground agent reported with its heartbeat, whitelisted and
    typed. None when there is nothing usable, which is what agents up to 3.6
    send, so their heartbeat leaves any stored stats alone."""
    if not isinstance(body, dict):
        return None
    out = {}
    version = body.get("version")
    if isinstance(version, str) and 0 < len(version) <= 12:
        out["version"] = version
    for key, is_float, cap in (("uptime_s", False, 10**9), ("msg_rate", True, 10**6), ("aircraft_count", False, 10**5)):
        x = body.get(key)
        if isinstance(x, bool) or not isinstance(x, (int, float)):
            continue
        if x != x or x < 0 or x > cap:
            continue
        out[key] = round(float(x), 1) if is_float else int(x)
    return out or None
```

- [ ] **Step 5: Run the tests and see them pass**

Run: `python -m pytest tests -q`
Expected: `22 passed`.

- [ ] **Step 6: Commit**

```bash
git add alert_rules.py tests/test_alert_rules.py
git commit -m "Add pure alert rules: plan channels, routing, headings, receiver stats"
```

---

### Task 2: Columns, migration and the guarded reader

**Files:**
- Modify: `models.py` (imports, `User`, `AirportConfig`, new helper at the bottom)
- Create: `migrate_web_app.py`
- Modify: `railway.toml`
- Modify: `main.py` (startup `migrations` list)

**Interfaces:**
- Produces: `User.routing`, `User.gs_stats`, `AirportConfig.approach_runway_headings` (all deferred JSON, nullable); `models.read_optional_column(db, obj, name)` returning the value or `None`.

- [ ] **Step 1: `models.py` — import `deferred` and add a logger**

Replace `from sqlalchemy.orm import relationship` with:

```python
from sqlalchemy.orm import relationship, deferred
import logging
```

and after `from database import Base` add:

```python
logger = logging.getLogger("finalpingapp")
```

- [ ] **Step 2: `models.py` — `User` columns**, directly after `gs_lon = Column(Float, nullable=True)`:

```python
    # Added for the web app. Deferred on purpose: they are left out of the
    # default SELECT, so a database where migrate_web_app.py has not run yet
    # cannot break every query that touches this table. Read them through
    # read_optional_column().
    #
    # routing: {"10nm": [integration_id, ...]} = integrations switched OFF for
    # that alert type. gs_stats: what the ground agent last reported.
    routing = deferred(Column(JSON, nullable=True))
    gs_stats = deferred(Column(JSON, nullable=True))
```

- [ ] **Step 3: `models.py` — `AirportConfig` column**, directly after `approach_runway_heading = Column(Float, nullable=True)  # degrees true`:

```python
    # Several accepted runway headings (web app). When set, it replaces the
    # single heading above. Deferred for the same reason as User.routing.
    approach_runway_headings = deferred(Column(JSON, nullable=True))
```

- [ ] **Step 4: `models.py` — helper**, appended at the end of the file:

```python
def read_optional_column(db, obj, name):
    """Read a deferred column that an un-migrated database may not have.

    Loading it issues its own SELECT. If that fails, the session is rolled
    back (PostgreSQL refuses further statements in a failed transaction) and
    None is returned, which every caller treats as "feature not in use".
    """
    if obj is None:
        return None
    try:
        return getattr(obj, name)
    except Exception as e:
        logger.warning("Optional column %s unavailable: %s", name, e)
        try:
            db.rollback()
        except Exception:
            pass
        return None
```

- [ ] **Step 5: Create `migrate_web_app.py`**

```python
"""
Migration: columns for the web app.

  users.routing                              per-event channel routing
  users.gs_stats                             last stats reported by the ground agent
  airport_configs.approach_runway_headings   several accepted runway headings

Runs before uvicorn on every Railway start (see railway.toml). Idempotent, and
it never raises: a failure here must not stop the API from starting. The
columns are mapped as deferred, so the app runs fine without them and only the
features that use them are unavailable.
"""

from database import engine
from sqlalchemy import text

STATEMENTS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS routing JSON",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS gs_stats JSON",
    "ALTER TABLE airport_configs ADD COLUMN IF NOT EXISTS approach_runway_headings JSON",
]


def migrate():
    for stmt in STATEMENTS:
        try:
            with engine.connect() as conn:
                conn.execute(text(stmt))
                conn.commit()
            print(f"Migration ok: {stmt}")
        except Exception as e:
            print(f"Migration error ({stmt}): {e}")


if __name__ == "__main__":
    migrate()
```

- [ ] **Step 6: `railway.toml`** — the `startCommand` line becomes:

```toml
startCommand = "python migrate_gs_device_key.py && python migrate_sdr_range.py && python migrate_gs_location.py && python migrate_web_app.py && python -m uvicorn main:app --host 0.0.0.0 --port $PORT"
```

- [ ] **Step 7: `main.py` startup list** — in `startup_event`, in the `migrations = [` list, after the line `"ALTER TABLE team_airport_configs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE",` add:

```python
            # Web app — per-event routing, receiver stats, multi-runway approach filter
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS routing JSON",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS gs_stats JSON",
            "ALTER TABLE airport_configs ADD COLUMN IF NOT EXISTS approach_runway_headings JSON",
```

- [ ] **Step 8: Check the files compile**

Run: `python -m py_compile models.py migrate_web_app.py main.py && echo compiled`
Expected: `compiled`.

- [ ] **Step 9: Commit**

```bash
git add models.py migrate_web_app.py railway.toml main.py
git commit -m "Add deferred web-app columns and their pre-start migration"
```

---

### Task 3: Tracker uses the rules

**Files:**
- Modify: `tracker.py` (imports; `check_and_notify` corridor block; `update_user_aircraft`; `TIER_CHANNELS`; `send_notifications`)

**Interfaces:**
- Consumes: `alert_rules.send_channels_for_tier`, `routed_integrations`, `approach_headings`, `heading_allowed`; `models.read_optional_column`.

- [ ] **Step 1: Imports** — after `import ground_state as _gs` add:

```python
from alert_rules import send_channels_for_tier, routed_integrations, approach_headings, heading_allowed
from models import read_optional_column
```

- [ ] **Step 2: Approach filter** — in `check_and_notify`, replace

```python
                        if airspace.get('approach_corridor_enabled') and airspace.get('approach_runway_heading') is not None:
                            track = aircraft_data.get('track') or aircraft_data.get('heading')
                            if track is not None:
                                rwy_hdg = float(airspace['approach_runway_heading'])
                                diff = abs((track - rwy_hdg + 180) % 360 - 180)
                                if diff > 35:
                                    self.distance_alerts_sent[aircraft_id].add(alert_key)  # suppress quietly
                                    continue
```

with

```python
                        rwy_headings = approach_headings(airspace) if airspace.get('approach_corridor_enabled') else []
                        if rwy_headings:
                            track = aircraft_data.get('track') or aircraft_data.get('heading')
                            if track is not None and not heading_allowed(track, rwy_headings):
                                self.distance_alerts_sent[aircraft_id].add(alert_key)  # suppress quietly
                                continue
```

- [ ] **Step 3: Config carries the list** — in `update_user_aircraft`, after

```python
        if not airport_config:
            # No config yet, skip
            return
```

add

```python
        # Read before anything else is loaded: on an un-migrated database this
        # rolls the session back.
        runway_headings = read_optional_column(db, airport_config, "approach_runway_headings")
```

and in the `'airspace'` dict, after `'approach_runway_heading': airport_config.approach_runway_heading,` add:

```python
                'approach_runway_headings': runway_headings,
```

- [ ] **Step 4: One channel list** — delete the whole `TIER_CHANNELS = { … }` class attribute (the dict directly above `async def send_notifications`) and in `send_notifications` replace

```python
                allowed_channels = self.TIER_CHANNELS.get(tier, self.TIER_CHANNELS["starter"])
```

with

```python
                allowed_channels = send_channels_for_tier(tier)
```

- [ ] **Step 5: Routing** — in `send_notifications`, directly after `user = db.query(User).filter(User.id == user_id).first()` add:

```python
            routing = read_optional_column(db, user, "routing")
```

and replace `for integration in integrations:` (the loop inside `for notification in notifications:` in the non-team branch) with:

```python
                    for integration in routed_integrations(integrations, routing, alert_type):
```

- [ ] **Step 6: Compile and re-run tests**

Run: `python -m py_compile tracker.py && python -m pytest tests -q`
Expected: `22 passed`.

- [ ] **Step 7: Commit**

```bash
git add tracker.py
git commit -m "Tracker: per-event routing, multi-runway approach filter, one channel list"
```

---

### Task 4: API endpoints

**Files:**
- Modify: `main.py` (imports; `TIER_LIMITS`; `ground_ingest`; `ground_heartbeat`; `ground_status`; alert-settings section; airport config GET/POST; `delete_integration`)

**Interfaces:**
- Consumes: everything Task 1 and 2 produce.
- Produces (HTTP): `GET /api/settings/routing` → `{"routing": {...}}`; `PUT /api/settings/routing` body `{"routing": {...}}` → `{"routing": {...}}`; `GET /api/ground/status` gains `"stats"`; `GET /api/airport/config` gains `"approach_runway_headings"`; `POST /api/airport/config` accepts `approach_runway_headings`; `POST /api/ground/heartbeat` accepts an optional JSON body.

- [ ] **Step 1: Imports** — after `from tracker import CloudAircraftTracker` add:

```python
from alert_rules import (
    PLAN_CHANNELS, routed_integrations, clean_routing, prune_routing,
    clean_headings, reconcile_headings, clean_gs_stats,
)
from models import read_optional_column
```

- [ ] **Step 2: `TIER_LIMITS` points at `PLAN_CHANNELS`** — in each of the seven rows replace the literal `"channels": [...]` with `"channels": PLAN_CHANNELS["<tier>"]` using that row's own key (`starter`, `premium`, `pro`, `team-starter`, `team-premium`, `team-pro`, `owner`). The lists are identical, so nothing a plan may connect changes.

- [ ] **Step 3: Ground ingest honors routing** — in `ground_ingest`, replace

```python
    if not integrations:
        return {"message": "No integrations configured", "alerts_sent": 0}
```

with

```python
    if not integrations:
        return {"message": "No integrations configured", "alerts_sent": 0}

    integrations = routed_integrations(
        integrations, read_optional_column(db, current_user, "routing"), alert_type
    )
```

- [ ] **Step 4: Heartbeat stores stats** — replace the `ground_heartbeat` function with:

```python
@app.post("/api/ground/heartbeat")
async def ground_heartbeat(request: Request, current_user: User = Depends(get_ground_user), db: Session = Depends(get_db)):
    """Called by the ground station every minute to signal it is online.

    Agents from 3.7 on also report a few stats in the body. Older agents send
    an empty body, which leaves whatever is stored untouched.
    """
    if not getattr(current_user, 'ground_station_enabled', False):
        raise HTTPException(status_code=403, detail="ground_station_not_enabled")
    now = datetime.utcnow()
    _gs.ground_last_seen[str(current_user.id)] = now
    current_user.gs_last_heartbeat = now
    db.commit()

    # Stats are saved separately, after the heartbeat itself is safely
    # recorded, so nothing about them can make a station look offline.
    try:
        stats = clean_gs_stats(await request.json())
    except Exception:
        stats = None
    if stats is not None:
        try:
            current_user.gs_stats = stats
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning("Could not store ground station stats: %s", e)
    return {"ok": True}
```

- [ ] **Step 5: Status returns stats** — change the `ground_status` signature to

```python
async def ground_status(current_user: User = Depends(get_ground_user), db: Session = Depends(get_db)):
```

and add to the returned dict, after `"gs_device_key": getattr(current_user, 'gs_device_key', None),`:

```python
        # Reported by agents 3.7+ with each heartbeat; None for older agents.
        "stats": read_optional_column(db, current_user, "gs_stats"),
```

- [ ] **Step 6: Routing endpoints** — insert directly above the `# AIRPORT CONFIGURATION` banner comment:

```python
class RoutingUpdate(BaseModel):
    routing: dict


@app.get("/api/settings/routing")
async def get_routing(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Per-event channel routing: integrations switched OFF per alert type."""
    return {"routing": read_optional_column(db, current_user, "routing") or {}}


@app.put("/api/settings/routing")
async def update_routing(
    body: RoutingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Replace the caller's routing. Unknown alert types and integration ids
    that are not the caller's own are dropped."""
    own_ids = [str(i.id) for i in db.query(Integration).filter(Integration.user_id == current_user.id).all()]
    cleaned = clean_routing(body.routing, own_ids)
    current_user.routing = cleaned or None
    db.commit()
    return {"routing": cleaned}

```

- [ ] **Step 7: Airport config GET** — in `get_airport_config`, after `"approach_runway_heading": config.approach_runway_heading,` add:

```python
        "approach_runway_headings": read_optional_column(db, config, "approach_runway_headings"),
```

- [ ] **Step 8: Airport config POST, update branch** — after

```python
        if "approach_runway_heading" in config_data:
            config.approach_runway_heading = config_data["approach_runway_heading"]
```

add

```python
        # Only written when it actually changes, so a save from the desktop app
        # (which never sends the list) touches this column only to clear a list
        # the web app set.
        if "approach_runway_headings" in config_data or "approach_runway_heading" in config_data:
            _current_headings = read_optional_column(db, config, "approach_runway_headings")
            _new_headings = reconcile_headings(config_data, _current_headings)
            if _new_headings != _current_headings:
                config.approach_runway_headings = _new_headings
```

- [ ] **Step 9: Airport config POST, create branch** — after `db.add(config)` in the `else:` branch add:

```python
        _new_headings = clean_headings(config_data.get("approach_runway_headings"))
        if _new_headings:
            config.approach_runway_headings = _new_headings
```

- [ ] **Step 10: Cleanup keeps takeoff and prunes routing** — in the "Clean up orphaned alert settings" block replace

```python
            valid_types.add("landing")  # never delete landing alerts
```

with

```python
            valid_types.add("landing")  # never delete landing alerts
            # Takeoff was missing here, so a custom takeoff message was deleted
            # every time the rings were saved.
            valid_types.add("takeoff")
```

and directly before that block's `db.commit()` add:

```python
            _routing = read_optional_column(db, current_user, "routing")
            if _routing:
                _pruned = prune_routing(_routing, valid_alert_types=valid_types)
                if _pruned != _routing:
                    current_user.routing = _pruned or None
```

- [ ] **Step 11: Deleting an integration removes it from routing** — in `delete_integration`, replace

```python
    db.delete(integration)
    db.commit()
    return {"message": "Integration deleted"}
```

with

```python
    _routing = read_optional_column(db, current_user, "routing")
    db.delete(integration)
    if _routing:
        _pruned = prune_routing(_routing, remove_integration_id=integration_id)
        if _pruned != _routing:
            current_user.routing = _pruned or None
    db.commit()
    return {"message": "Integration deleted"}
```

- [ ] **Step 12: Compile, test, review the diff**

Run: `python -m py_compile main.py && python -m pytest tests -q && git diff --stat`
Expected: `22 passed`; only `main.py` changed.

- [ ] **Step 13: Commit**

```bash
git add main.py
git commit -m "API: routing settings, receiver stats, multi-runway airport config"
```

---

### Task 5: Deploy and verify against production

**Files:** none.

- [ ] **Step 1: Confirm nothing agent-facing changed**

Run: `git diff main --stat -- finalping_ground.py version.txt`
Expected: no output.

- [ ] **Step 2: Record the "before" state with the desktop app's stored session** (never print the token)

```bash
python - <<'EOF'
import json, os, glob, requests
API = "https://aircraft-tracker-backend-production.up.railway.app"
cfg = next(p for p in glob.glob(os.path.expandvars(r"%APPDATA%\finalping*\config.json")) if "teams" not in p.lower())
tok = json.load(open(cfg, encoding="utf-8"))["auth_token"]
h = {"Authorization": f"Bearer {tok}"}
for path in ["/health", "/api/user/me", "/api/aircraft", "/api/aircraft/live", "/api/airport/config", "/api/integrations", "/api/settings/alerts", "/api/ground/status", "/api/settings/routing"]:
    r = requests.get(API + path, headers=h, timeout=20)
    body = r.json() if "json" in r.headers.get("content-type", "") else None
    print(r.status_code, path, sorted(body.keys()) if isinstance(body, dict) else (len(body) if isinstance(body, list) else ""))
EOF
```

Expected before deploy: 200 for everything except `/api/settings/routing` (404).

- [ ] **Step 3: Deploy**

```bash
git checkout main && git merge --ff-only web-app-backend && git push origin main
```

- [ ] **Step 4: Wait for the new build, then re-run the Step 2 script**

Poll `/health` until the service has restarted (2–4 minutes), then run the script again.
Expected after deploy: every line 200, including `/api/settings/routing`; `/api/airport/config` keys now include `approach_runway_headings`; `/api/ground/status` keys include `stats`.

- [ ] **Step 5: Round-trip the new settings without changing behavior**

Using the same token: `PUT /api/settings/routing {"routing": {}}` → `{"routing": {}}`; `PUT` with `{"routing": {"bogus": ["x"], "landing": ["not-mine"]}}` → `{"routing": {}}`; `POST /api/ground/heartbeat` with a JWT and body `{"version": "test", "uptime_s": 1}` then `GET /api/ground/status` shows those stats; then restore by posting `{}` (stats stay, which is expected) — acceptable because the real agent overwrites them within a minute once 3.7 is installed, and 3.6 never reads them.

- [ ] **Step 6: Desktop check**

Launch the installed Personal desktop app (clear `ELECTRON_RUN_AS_NODE` first), confirm Dashboard, Aircraft, Live Map and Ground Station load with data and no error banner.

- [ ] **Step 7: If anything in Steps 4–6 fails**

```bash
git revert --no-edit HEAD~3..HEAD && git push origin main
```

(the three code commits; the added columns are harmless and stay), then investigate on the branch.

---

### Task 6: Ground agent 3.7

**Files:**
- Modify: `finalping_ground.py`
- Modify: `version.txt` (only in Step 8)
- Create: `tests/test_ground_agent.py`
- Later, on the site's `web-app` branch: `my-product-site/public/ground/finalping_ground.py`, `my-product-site/public/ground/version.txt`

**Interfaces:**
- Produces: heartbeat body `{"version": str, "uptime_s": int, "msg_rate": float | None, "aircraft_count": int | None}`.

- [ ] **Step 1: Branch**

```bash
git checkout -b agent-3.7
```

- [ ] **Step 2: Write the failing tests** — `tests/test_ground_agent.py`

```python
import finalping_ground as g


def setup_function(_):
    g._msg_total = None
    g._sbs_lines = 0
    g._rate_mark = None


def test_rate_is_unknown_until_there_are_two_samples():
    g._note_messages({"messages": 1000})
    assert g.message_rate(100.0) is None
    g._note_messages({"messages": 1600})
    assert g.message_rate(160.0) == 10.0


def test_rate_survives_a_dump1090_restart():
    g._note_messages({"messages": 5000})
    g.message_rate(0.0)
    g._note_messages({"messages": 40})       # counter reset
    assert g.message_rate(60.0) is None
    g._note_messages({"messages": 640})
    assert g.message_rate(120.0) == 10.0


def test_rate_falls_back_to_sbs_lines():
    g._sbs_lines = 100
    assert g.message_rate(0.0) is None
    g._sbs_lines = 400
    assert g.message_rate(30.0) == 10.0


def test_rate_unknown_with_no_source():
    assert g.message_rate(0.0) is None
    assert g.message_rate(60.0) is None


def test_heartbeat_stats_shape():
    stats = g.heartbeat_stats(g.START_TIME + 125.7, 12)
    assert stats["version"] == g.VERSION
    assert stats["uptime_s"] == 125
    assert stats["aircraft_count"] == 12
    assert "msg_rate" in stats
```

- [ ] **Step 3: Run and see them fail**

Run: `python -m pytest tests/test_ground_agent.py -q`
Expected: `AttributeError: module 'finalping_ground' has no attribute '_msg_total'`.

- [ ] **Step 4: Implement in `finalping_ground.py`**

a. `VERSION    = "3.6"` → `VERSION    = "3.7"`.

b. After the `_sbs_connected = False` line add:

```python
# ── Stats reported with the heartbeat ─────────────────────────────────────────
START_TIME  = time.time()
_msg_total  = None   # dump1090's running message counter, when the source has one
_sbs_lines  = 0      # lines read from the SBS stream, the fallback counter
_rate_mark  = None   # (time, counter) at the previous heartbeat


def _note_messages(data):
    """Remember dump1090's total message count from an aircraft.json payload."""
    global _msg_total
    m = data.get("messages") if isinstance(data, dict) else None
    if isinstance(m, (int, float)) and not isinstance(m, bool):
        _msg_total = float(m)


def message_rate(now):
    """Messages per second since the previous call, or None when unknown."""
    global _rate_mark
    if _msg_total is not None:
        counter = _msg_total
    elif _sbs_lines:
        counter = float(_sbs_lines)
    else:
        return None
    prev, _rate_mark = _rate_mark, (now, counter)
    if prev is None:
        return None
    dt, dn = now - prev[0], counter - prev[1]
    if dt <= 0 or dn < 0:      # clock step, or dump1090 restarted and reset its counter
        return None
    return round(dn / dt, 1)


def heartbeat_stats(now, aircraft_count):
    return {
        "version": VERSION,
        "uptime_s": int(now - START_TIME),
        "msg_rate": message_rate(now),
        "aircraft_count": aircraft_count,
    }
```

c. In `_sbs_reader_thread`, make the globals line `global _sbs_connected, _sbs_lines` and replace

```python
                        line, buf = buf.split("\n", 1)
                        _parse_sbs_line(line.strip())
```

with

```python
                        line, buf = buf.split("\n", 1)
                        _sbs_lines += 1
                        _parse_sbs_line(line.strip())
```

d. In `fetch_dump1090`, in the HTTP loop replace

```python
            data = r.json()
            return data.get("aircraft", data.get("ac", []))
```

with

```python
            data = r.json()
            _note_messages(data)
            return data.get("aircraft", data.get("ac", []))
```

and in the file loop replace

```python
                data = json.load(f)
            return data.get("aircraft", data.get("ac", []))
```

with

```python
                data = json.load(f)
            _note_messages(data)
            return data.get("aircraft", data.get("ac", []))
```

e. In `run()`, after `last_config_refresh = time.time()` add `last_aircraft_count = None`, and replace

```python
                api_post("/api/ground/heartbeat", token, {})
```

with

```python
                # Stats ride along with the heartbeat. They must never be the
                # reason a heartbeat is not sent.
                try:
                    hb_body = heartbeat_stats(now, last_aircraft_count)
                except Exception:
                    hb_body = {}
                api_post("/api/ground/heartbeat", token, hb_body)
```

f. In `run()`, directly after `bin_range(range_nm, aircraft_list, recv_lat, recv_lon)` add:

```python
        last_aircraft_count = sum(1 for ac in aircraft_list if ac.get("lat") is not None and ac.get("lon") is not None)
```

- [ ] **Step 5: Run all tests and the self-update guards' own check**

Run: `python -m pytest tests -q && python -c "import ast,sys; s=open('finalping_ground.py',encoding='utf-8').read(); compile(s,'a','exec'); assert len(s)>4000 and 'def run(' in s; print('agent ok')"`
Expected: `27 passed` and `agent ok`.

- [ ] **Step 6: Commit on the branch (not main)**

```bash
git add finalping_ground.py tests/test_ground_agent.py
git commit -m "Ground agent 3.7: report uptime, message rate and aircraft count"
```

- [ ] **Step 7: Install by hand on the owner's Pi and verify**

Over SSH to `pi@192.168.4.166`: find the installed path from `systemctl cat finalping-ground` (the `ExecStart` script path), copy the current file to `<path>.3.6.bak`, upload the branch's `finalping_ground.py` to that path, `sudo systemctl restart finalping-ground`, then `journalctl -u finalping-ground -n 40 --no-pager`.
Expected in the log: `FinalPing Ground Station v3.7`, no traceback, position lines or "No tracked aircraft" lines continuing for at least 3 minutes, no "Heartbeat failed".
Then with the desktop token: `GET /api/ground/status` → `online: true` and `stats` containing `version: "3.7"`, a growing `uptime_s`, and (after the second heartbeat) a numeric `msg_rate` when dump1090 is decoding.
The agent will not downgrade itself: `check_for_update` only moves forward and `main` still says 3.6.
If anything fails: restore `<path>.3.6.bak`, restart the service, confirm v3.6 in the log.

- [ ] **Step 8: Publish only after Step 7 passes**

```bash
printf '3.7' > version.txt
git add version.txt && git commit -m "Publish ground agent 3.7"
git checkout main && git merge --ff-only agent-3.7 && git push origin main
```

Then check `https://raw.githubusercontent.com/ShermR6/aircraft-tracker-backend/main/version.txt` returns `3.7` and the raw `finalping_ground.py` contains `VERSION    = "3.7"` (raw GitHub can lag a few minutes).

- [ ] **Step 9: Update the site's copies on the `web-app` branch**

```bash
cd "C:/Users/sherm/OneDrive/Documents/FinalPing/my-product-site"
cp ../aircraft-tracker-backend/finalping_ground.py public/ground/finalping_ground.py
printf '3.7' > public/ground/version.txt
git add public/ground && git commit -m "Ship ground agent 3.7 on the download page"
```

(Committed to `web-app`, not pushed to `main`. New installs keep getting 3.6 from the live site and self-update to 3.7 on first run.)
