#!/usr/bin/env bash
# FinalPing Ground Station: one-command install for a Raspberry Pi.
#
#   curl -fsSL https://finalpingapp.com/install.sh | sudo bash -s -- YOUR_DEVICE_KEY
#
# Your device key is on https://finalpingapp.com/app/ground-station
#
# Add the antenna's position and the feed includes MLAT, which finds aircraft
# that do not send their own position. MLAT needs the position to within a few
# metres, and the antenna's height above sea level (metres, or feet as 675ft):
#
#   ... | sudo bash -s -- YOUR_DEVICE_KEY LATITUDE LONGITUDE ALTITUDE
#
# The Ground Station page builds this line for you. Run it again with a
# position at any time to turn MLAT on or to move the antenna.
#
# What it does. Each step is skipped when it is already in place, so it is
# safe to run again (for example to give the receiver a new device key):
#
#   1. checks the device key with FinalPing
#   2. installs an ADS-B decoder (readsb) unless one is already running
#   3. installs the adsb.lol feed client, so the receiver also feeds adsb.lol,
#      with MLAT when the antenna's position was given
#   4. installs the FinalPing receiver program and starts it on every boot
#
# Nothing here asks a question, and there is no phone or hotspot step.

# Everything is inside main() so a download that is cut short runs nothing,
# and so no command can swallow the rest of the script from the pipe.
main() {
  set -uo pipefail

  local API="https://aircraft-tracker-backend-production.up.railway.app"
  local AGENT_URL="${FP_AGENT_URL:-https://raw.githubusercontent.com/ShermR6/aircraft-tracker-backend/main/finalping_ground.py}"
  local READSB_INSTALLER="https://raw.githubusercontent.com/wiedehopf/adsb-scripts/master/readsb-install.sh"
  local ADSBLOL_REPO="https://github.com/adsblol/feed.git"
  # The branch with adsb.lol's installer for a plain Pi. Their default branch
  # is a Docker setup and has no update.sh.
  local ADSBLOL_BRANCH="master"
  local ADSBLOL_DIR="/usr/local/share/adsblol"
  local ADSBLOL_CONF="/etc/default/adsblol"
  local STATE="/var/lib/finalping-ground"
  local SERVICE="/etc/systemd/system/finalping-ground.service"
  local LOG="/var/log/finalping-install.log"

  local KEY="${1:-}" LAT="${2:-}" LON="${3:-}" ALT="${4:-}"
  KEY="$(printf '%s' "$KEY" | tr 'A-F' 'a-f' | tr -d '[:space:]')"

  say()  { printf '\n== %s\n' "$*"; }
  note() { printf '   %s\n' "$*"; }
  die()  { printf '\nStopped: %s\n' "$*" >&2; exit 1; }
  # The two long steps print thousands of lines while they build. Those go to
  # the log; the screen gets a line every two minutes so it is clearly alive.
  run_logged() {   # run_logged "what it is" command...
    local what="$1" pid secs=0; shift
    printf '\n##### %s\n' "$what" >> "$LOG"
    "$@" >> "$LOG" 2>&1 </dev/null &
    pid=$!
    while kill -0 "$pid" 2>/dev/null; do
      sleep 5; secs=$((secs + 5))
      if [ $((secs % 120)) -eq 0 ]; then note "Still working on $what ($((secs / 60)) min so far)"; fi
    done
    if wait "$pid"; then return 0; fi
    note "$what reported a problem. The last lines of $LOG:"
    tail -n 12 "$LOG" | sed 's/^/     | /'
    return 1
  }

  # ── before anything is changed ────────────────────────────────────────────
  [ "$(id -u)" = "0" ] || die "this needs sudo. Run it again as:
  curl -fsSL https://finalpingapp.com/install.sh | sudo bash -s -- YOUR_DEVICE_KEY"
  command -v apt-get >/dev/null 2>&1 || die "this installer is for Raspberry Pi OS and other Debian-based systems."
  command -v systemctl >/dev/null 2>&1 || die "this installer needs systemd."

  if ! printf '%s' "$KEY" | grep -Eq '^[0-9a-f]{64}$'; then
    die "that is not a device key. Copy yours from https://finalpingapp.com/app/ground-station and run:
  curl -fsSL https://finalpingapp.com/install.sh | sudo bash -s -- YOUR_DEVICE_KEY"
  fi

  local number='^-?[0-9]+(\.[0-9]+)?$'
  if [ -n "$LAT$LON" ]; then
    { printf '%s' "$LAT" | grep -Eq "$number" && printf '%s' "$LON" | grep -Eq "$number"; } \
      || die "the position should be two numbers, for example: 33.09376 -97.25061"
    awk -v a="$LAT" -v o="$LON" 'BEGIN { exit !(a >= -90 && a <= 90 && o >= -180 && o <= 180) }' \
      || die "that position is not on the map: latitude is -90 to 90, longitude -180 to 180."
  fi
  if [ -n "$ALT" ]; then
    local unit="m"
    case "$ALT" in
      *ft) unit="ft"; ALT="${ALT%ft}" ;;
      *m)  ALT="${ALT%m}" ;;
    esac
    printf '%s' "$ALT" | grep -Eq "$number" \
      || die "the altitude should be the antenna's height above sea level, in metres (206) or feet (675ft)."
    # The limits adsb.lol's MLAT client accepts: the Dead Sea to the Andes.
    awk -v a="$ALT" -v u="$unit" 'BEGIN { if (u == "ft") a *= 0.3048; exit !(a >= -420 && a <= 5100) }' \
      || die "that altitude is out of range. It is the antenna's height above sea level, in metres (206) or feet (675ft)."
    ALT="$ALT$unit"
  fi

  echo "FinalPing Ground Station installer"
  echo "On a Pi Zero 2 W a first install takes 15 to 30 minutes, most of it building the decoder."

  export DEBIAN_FRONTEND=noninteractive
  local TMP
  TMP="$(mktemp -d)" || die "could not make a temporary folder."
  # Expanded now: TMP is local and is gone by the time the trap runs.
  # shellcheck disable=SC2064
  trap "rm -rf '$TMP'" EXIT
  : > "$LOG" 2>/dev/null || LOG="$TMP/install.log"

  # ── 1. the device key ─────────────────────────────────────────────────────
  say "1/4  Checking your device key"
  local missing=""
  # adduser and wget are what the decoder's installer needs and a minimal
  # system does not have.
  for tool in curl git python3 adduser wget; do command -v "$tool" >/dev/null 2>&1 || missing="$missing $tool"; done
  python3 -c 'import requests' >/dev/null 2>&1 || missing="$missing python3-requests"
  if [ -n "$missing" ]; then
    note "Installing:$missing"
    apt-get update -qq </dev/null || true
    apt-get install -y -qq --no-install-recommends curl git ca-certificates python3 python3-requests adduser wget </dev/null \
      || die "could not install the basics ($missing). Check the internet connection and run this again."
  fi

  local code
  code="$(curl -s -o "$TMP/validate" -w '%{http_code}' -m 25 -X POST \
    -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' -d '{}' \
    "$API/api/ground/validate" </dev/null || true)"
  case "$code" in
    200) note "Device key accepted." ;;
    401) die "FinalPing did not accept that device key. Copy it again from
  https://finalpingapp.com/app/ground-station (if you replaced the key, use the new one)." ;;
    000|"") die "could not reach FinalPing. Check that this Pi is online and run this again." ;;
    *) note "FinalPing answered $code. Carrying on: the receiver will keep trying by itself." ;;
  esac

  # A rough position for the decoder (it needs one to place aircraft on the
  # ground): the antenna's if it was given, else the account's airport.
  local NEAR_LAT="$LAT" NEAR_LON="$LON"
  if [ -z "$NEAR_LAT" ]; then
    local where
    where="$(curl -s -m 25 -H "Authorization: Bearer $KEY" "$API/api/ground/config" </dev/null \
      | python3 -c 'import json,sys
try:
    c = json.load(sys.stdin); print(round(float(c["lat"]), 2), round(float(c["lon"]), 2))
except Exception:
    pass' 2>/dev/null || true)"
    if [ -n "$where" ]; then NEAR_LAT="${where% *}"; NEAR_LON="${where#* }"; fi
  fi

  # ── 2. the decoder ────────────────────────────────────────────────────────
  say "2/4  ADS-B decoder"
  decoder_up() { (exec 3<>/dev/tcp/127.0.0.1/30005) 2>/dev/null; }
  wait_for_decoder() { local n; for n in 1 2 3 4 5 6 7 8 9 10; do decoder_up && return 0; sleep 3; done; return 1; }

  has_unit() { systemctl list-unit-files "$1.service" 2>/dev/null | grep -q "^$1.service"; }
  # readsb counts as installed only once its installer has finished here. A
  # unit file left by an install that was cut short does not count, so a
  # second run finishes it. (A readsb from elsewhere that is running is used
  # as it is; one that is stopped gets the installer, which updates it.)
  readsb_installed() { has_unit readsb && [ -x /usr/bin/readsb ] && [ -e "$STATE/readsb-installed" ]; }

  local HAVE_DECODER=0 unit
  for unit in dump1090-fa dump1090-mutability finalping-dump1090; do
    has_unit "$unit" && HAVE_DECODER=1
  done
  readsb_installed && HAVE_DECODER=1

  if ! decoder_up && [ "$HAVE_DECODER" = "1" ]; then
    # One that is installed but stopped only needs starting.
    for unit in readsb dump1090-fa dump1090-mutability finalping-dump1090; do
      if has_unit "$unit"; then
        note "Starting $unit"
        systemctl enable "$unit" >/dev/null 2>&1 || true
        systemctl restart "$unit" >/dev/null 2>&1 || true
        wait_for_decoder && break
      fi
    done
  fi

  local DECODER_OK=1
  if decoder_up; then
    note "A decoder is running."
  elif [ "$HAVE_DECODER" = "1" ]; then
    DECODER_OK=0
    note "A decoder is installed but is not running. That is usually the radio not being plugged in."
  else
    note "Installing readsb. This is the long step."
    curl -fsSL -m 60 -o "$TMP/readsb-install.sh" "$READSB_INSTALLER" </dev/null \
      || die "could not download the decoder installer. Check the internet connection and run this again."
    if run_logged "the decoder" bash "$TMP/readsb-install.sh" no-tar1090 && [ -x /usr/bin/readsb ]; then
      mkdir -p "$STATE" && : > "$STATE/readsb-installed"
    else
      note "Carrying on without the decoder. Run this installer again to retry it."
    fi
    if [ -n "$NEAR_LAT" ] && [ -x /usr/local/bin/readsb-set-location ]; then
      /usr/local/bin/readsb-set-location "$NEAR_LAT" "$NEAR_LON" </dev/null >/dev/null 2>&1 || true
    fi
    if wait_for_decoder; then note "Decoder installed and running."; else DECODER_OK=0; fi
  fi

  # ── 3. the adsb.lol feed, with MLAT ───────────────────────────────────────
  say "3/4  adsb.lol feed"
  # MLAT is part of the feed, but it only works with the antenna's exact
  # position and height. Given all three, they go into adsb.lol's settings
  # (also on a receiver that is already installed) and MLAT is switched on.
  # An MLAT name that is already there is kept; a new one is random and is
  # kept off adsb.lol's public MLAT map. Without a position nothing in an
  # existing setup is touched, and the position stays on this Pi.
  cat > "$TMP/mlat.py" <<'PY_MLAT'
import os, re, sys

path, lat, lon, alt, name = sys.argv[1:6]
with open(path, encoding="utf-8") as f:
    text = f.read()
lines = text.split("\n")


def value(key):
    found = ""
    for line in lines:
        m = re.match(r"\s*%s=(.*)$" % key, line)
        if m:
            found = m.group(1).strip().strip("\"'").strip()
    return found


def put(key, new):
    row = '%s="%s"' % (key, new)
    hits = [i for i, line in enumerate(lines) if re.match(r"\s*%s=" % key, line)]
    if hits:
        lines[hits[-1]] = row
    elif lines and lines[-1] == "":
        lines.insert(len(lines) - 1, row)
    else:
        lines.append(row)


def named():
    return value("USER") not in ("", "0", "disable")


def placed():
    try:
        return float(value("LATITUDE")) != 0 and float(value("LONGITUDE")) != 0
    except ValueError:
        return False


if lat and lon and alt:
    put("LATITUDE", lat)
    put("LONGITUDE", lon)
    put("ALTITUDE", alt)
    if not named():
        put("USER", name)
        if not value("PRIVACY"):
            put("PRIVACY", "--privacy")

new = "\n".join(lines)
if new != text:
    tmp = path + ".finalping"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(new)
    os.chmod(tmp, os.stat(path).st_mode & 0o777)
    os.replace(tmp, path)
print("on" if named() and placed() else "off", "changed" if new != text else "same")
PY_MLAT
  local MLAT_LAT="" MLAT_LON="" MLAT_ALT="" MLAT_STATE="off same"
  if [ -n "$LAT" ] && [ -n "$ALT" ]; then MLAT_LAT="$LAT"; MLAT_LON="$LON"; MLAT_ALT="$ALT"; fi
  local MLAT_NAME
  MLAT_NAME="FinalPing-$(od -An -tx1 -N3 /dev/urandom | tr -d ' \n')"
  # Puts the position into adsb.lol's settings when there is one, and says
  # where MLAT stands: "on" or "off", then "changed" or "same".
  set_mlat() {
    MLAT_STATE="off same"
    [ -s "$ADSBLOL_CONF" ] || return 0
    MLAT_STATE="$(python3 "$TMP/mlat.py" "$ADSBLOL_CONF" "$MLAT_LAT" "$MLAT_LON" "$MLAT_ALT" "$MLAT_NAME" 2>>"$LOG" </dev/null)" \
      || MLAT_STATE="off same"
  }

  if [ -x "$ADSBLOL_DIR/feed-adsblol" ] && has_unit adsblol-feed; then
    note "Already installed."
    systemctl enable adsblol-feed >/dev/null 2>&1 || true
    systemctl is-active --quiet adsblol-feed || systemctl restart adsblol-feed >/dev/null 2>&1 || true
    set_mlat
    if has_unit adsblol-mlat; then
      case "$MLAT_STATE" in
        "on changed")
          note "Giving MLAT the antenna's position."
          systemctl enable adsblol-mlat >/dev/null 2>&1 || true
          systemctl restart adsblol-mlat >/dev/null 2>&1 || true ;;
        on*)
          systemctl enable adsblol-mlat >/dev/null 2>&1 || true
          systemctl is-active --quiet adsblol-mlat || systemctl restart adsblol-mlat >/dev/null 2>&1 || true ;;
      esac
    fi
  else
    if [ ! -s "$ADSBLOL_CONF" ]; then
      # Written with MLAT off (name "0"); set_mlat below turns it on.
      cat > "$ADSBLOL_CONF" <<EOF
INPUT="127.0.0.1:30005"
REDUCE_INTERVAL="0.5"

# feed name for checking MLAT sync
# also displayed on the MLAT map
USER="0"

LATITUDE="${NEAR_LAT:-0}"
LONGITUDE="${NEAR_LON:-0}"

ALTITUDE="0m"

# this is the source for 978 data, use port 30978 from dump978 --raw-port
# if you're not receiving 978, don't worry about it, not doing any harm!
UAT_INPUT="127.0.0.1:30978"

RESULTS="--results beast,connect,127.0.0.1:30104"
RESULTS2="--results basestation,listen,31420"
RESULTS3="--results beast,listen,31422"
RESULTS4="--results beast,connect,127.0.0.1:31421"
# add --privacy between the quotes below to disable having the feed name shown on the mlat map
# (position is never shown accurately no matter the settings)
PRIVACY=""
INPUT_TYPE="dump1090"

MLATSERVER="feed.adsb.lol:31090"
TARGET="--net-connector feed.adsb.lol,30004,beast_reduce_plus_out,feed2.adsb.lol,1337"
NET_OPTIONS="--net-heartbeat 60 --net-ro-size 1280 --net-ro-interval=0.05 --net-ro-interval-beast-reduce=0.12 --net-ro-port 0 --net-sbs-port 0 --net-bi-port 31421 --net-bo-port 0 --net-ri-port 0 --write-json-every 1"
JSON_OPTIONS="--max-range 450 --json-location-accuracy 2 --range-outline-hours 24"
EOF
    fi
    # Before their installer runs: it starts MLAT itself when the settings ask for it.
    set_mlat
    note "Installing adsb.lol's feed client (their own installer, run without its questions)."
    mkdir -p "$ADSBLOL_DIR"
    rm -rf "$ADSBLOL_DIR/git"
    if git clone -q --depth 1 --single-branch --branch "$ADSBLOL_BRANCH" "$ADSBLOL_REPO" "$ADSBLOL_DIR/git" </dev/null \
        && [ -f "$ADSBLOL_DIR/git/update.sh" ]; then
      run_logged "the adsb.lol feed client" bash "$ADSBLOL_DIR/git/update.sh" \
        || note "Carrying on without the feed. Run this installer again to retry it."
    else
      note "Could not download adsb.lol's feed client. Run this installer again later to add it."
    fi
    set_mlat
  fi
  local FEED_OK=0 MLAT_OK=0
  systemctl is-active --quiet adsblol-feed && FEED_OK=1
  case "$MLAT_STATE" in on*) systemctl is-active --quiet adsblol-mlat && MLAT_OK=1 ;; esac
  if [ "$MLAT_OK" = "1" ]; then
    note "MLAT is on."
  elif [ "$FEED_OK" = "1" ] && [ -z "$MLAT_LAT" ]; then
    note "MLAT is off: it needs the antenna's exact position."
  fi

  # ── 4. the FinalPing receiver ─────────────────────────────────────────────
  say "4/4  FinalPing receiver"
  local DIR RUN_USER
  if [ -f /home/pi/finalping-ground/finalping_ground.py ]; then
    DIR="/home/pi/finalping-ground"                 # an earlier install: keep its place and its files
    RUN_USER="$(stat -c %U "$DIR" 2>/dev/null || echo pi)"
  else
    DIR="/opt/finalping-ground"
    RUN_USER="finalping"
    id -u "$RUN_USER" >/dev/null 2>&1 \
      || useradd --system --home-dir "$DIR" --shell /usr/sbin/nologin "$RUN_USER" \
      || die "could not create the user the receiver runs as."
    mkdir -p "$DIR"
  fi

  case "$AGENT_URL" in
    /*) cp "$AGENT_URL" "$TMP/agent.py" || die "could not read $AGENT_URL" ;;
    *)  curl -fsSL -m 60 -o "$TMP/agent.py" "$AGENT_URL" </dev/null \
          || die "could not download the receiver program. Check the internet connection and run this again." ;;
  esac
  # Never install something that is not the program: a half download or an
  # error page would stop the receiver from starting at all.
  if [ "$(wc -c < "$TMP/agent.py")" -lt 4000 ] || ! grep -q 'def run(' "$TMP/agent.py" \
     || ! python3 -m py_compile "$TMP/agent.py" 2>/dev/null; then
    die "the receiver program did not download properly. Run this again in a minute."
  fi
  install -m 755 "$TMP/agent.py" "$DIR/finalping_ground.py"

  # The key, and the antenna's position when given. Anything else already in
  # config.json is kept.
  python3 - "$DIR/config.json" "$KEY" "$LAT" "$LON" <<'PY' || die "could not write the receiver's settings."
import json, os, sys
path, key, lat, lon = sys.argv[1:5]
try:
    with open(path, encoding="utf-8") as f:
        cfg = json.load(f)
    if not isinstance(cfg, dict):
        cfg = {}
except Exception:
    cfg = {}
cfg["token"] = key
if lat and lon:
    cfg["receiver_lat"], cfg["receiver_lon"] = float(lat), float(lon)
tmp = path + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    json.dump(cfg, f, indent=2)
    f.write("\n")
os.replace(tmp, path)
PY
  chmod 600 "$DIR/config.json"
  chown -R "$RUN_USER" "$DIR"

  cat > "$SERVICE" <<EOF
[Unit]
Description=FinalPing Ground Station
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$DIR
ExecStart=/usr/bin/python3 -u $DIR/finalping_ground.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable finalping-ground >/dev/null 2>&1 || true
  systemctl restart finalping-ground || die "the receiver did not start. See: sudo journalctl -u finalping-ground -n 40"

  # ── did it work ───────────────────────────────────────────────────────────
  note "Waiting for the receiver to report in..."
  local ONLINE=0 n
  for n in 1 2 3 4 5 6 7 8 9 10 11 12; do
    sleep 5
    if curl -s -m 15 -H "Authorization: Bearer $KEY" "$API/api/ground/status" </dev/null \
        | python3 -c 'import json,sys
d = json.load(sys.stdin)
# heard from since this run restarted it, not just "was online earlier"
sys.exit(0 if d.get("online") and (d.get("last_seen_seconds") or 999) <= 60 else 1)' 2>/dev/null; then
      ONLINE=1; break
    fi
  done

  echo
  echo "------------------------------------------------------------"
  if [ "$ONLINE" = "1" ]; then
    echo " Done. Your receiver is online."
  elif systemctl is-active --quiet finalping-ground; then
    echo " Installed and running. FinalPing has not heard from it yet;"
    echo " give it a minute, then check the page below."
  else
    echo " Installed, but the receiver is not running. See:"
    echo "   sudo journalctl -u finalping-ground -n 40"
  fi
  if [ "$DECODER_OK" != "1" ]; then
    echo
    echo " The decoder is not running yet. Plug in the radio (the USB"
    echo " dongle with the antenna) and restart the Pi: sudo reboot"
    echo " Everything starts by itself after that."
  fi
  if [ "$FEED_OK" != "1" ]; then
    echo
    echo " The adsb.lol feed is not running yet. Run this installer again"
    echo " once the decoder is up; it only does what is still missing."
  fi
  if [ "$FEED_OK" = "1" ] && [ "$MLAT_OK" != "1" ]; then
    echo
    if [ -n "$MLAT_LAT" ]; then
      echo " MLAT did not start. See: sudo journalctl -u adsblol-mlat -n 20"
    else
      echo " MLAT is off, because it needs to know exactly where the antenna"
      echo " is. Enter the position on the page below and run the command it"
      echo " gives you. Everything else keeps running as it is."
    fi
  fi
  echo
  echo " Status, and your feeder plan:"
  echo "   https://finalpingapp.com/app/ground-station"
  echo " Logs:   sudo journalctl -u finalping-ground -f"
  echo " Full install log: $LOG"
  echo "------------------------------------------------------------"
}

main "$@"
