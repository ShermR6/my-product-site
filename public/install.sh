#!/bin/bash
# ============================================================
#  FinalPing Ground Station — Raspberry Pi Installer
#  https://finalpingapp.com
# ============================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}============================================================${NC}"
echo -e "${CYAN}${BOLD}   FinalPing Ground Station — Raspberry Pi Installer${NC}"
echo -e "${CYAN}${BOLD}============================================================${NC}"
echo ""

# ── Check we're on a Pi / Debian system ──────────────────────
if ! command -v apt &> /dev/null; then
  echo -e "${RED}❌ This script requires a Debian-based system (Raspberry Pi OS, Ubuntu, etc.)${NC}"
  exit 1
fi

# ── Check for root / sudo ─────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}⚠️  This script needs sudo privileges.${NC}"
  echo ""
  echo "Please re-run with sudo:"
  echo "  curl -fsSL https://finalpingapp.com/install.sh | sudo bash"
  echo ""
  exit 1
fi

echo -e "${BOLD}This installer will:${NC}"
echo "  • Update your system packages"
echo "  • Install RTL-SDR drivers"
echo "  • Install dump1090-fa (FlightAware's ADS-B decoder)"
echo "  • Install Python 3 and required packages"
echo "  • Download FinalPing Ground Station"
echo "  • Set up auto-start on boot"
echo ""
read -p "Continue? (y/n): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Cancelled."
  exit 0
fi

echo ""
echo -e "${CYAN}[1/7] Updating system packages...${NC}"
apt update -qq && apt upgrade -y -qq
echo -e "${GREEN}✓ System updated${NC}"

echo ""
echo -e "${CYAN}[2/7] Installing RTL-SDR drivers...${NC}"
apt install -y -qq rtl-sdr librtlsdr-dev
echo -e "${GREEN}✓ RTL-SDR drivers installed${NC}"

echo ""
echo -e "${CYAN}[3/7] Blacklisting conflicting DVB-T driver...${NC}"
echo 'blacklist dvb_usb_rtl28xxu' > /etc/modprobe.d/rtlsdr.conf
echo 'blacklist rtl2832' >> /etc/modprobe.d/rtlsdr.conf
echo 'blacklist rtl2830' >> /etc/modprobe.d/rtlsdr.conf
modprobe -r dvb_usb_rtl28xxu 2>/dev/null || true
echo -e "${GREEN}✓ DVB-T driver blacklisted${NC}"

echo ""
echo -e "${CYAN}[4/7] Installing dump1090-fa (FlightAware ADS-B decoder)...${NC}"
apt install -y -qq wget
# Add FlightAware repository
wget -q https://flightaware.com/adsb/piaware/files/packages/pool/piaware/p/piaware-support/piaware-repository_10.0_all.deb -O /tmp/piaware-repo.deb
dpkg -i /tmp/piaware-repo.deb
apt update -qq
apt install -y -qq dump1090-fa
rm /tmp/piaware-repo.deb
# Enable and start dump1090-fa
systemctl enable dump1090-fa
systemctl start dump1090-fa
echo -e "${GREEN}✓ dump1090-fa installed and running${NC}"

echo ""
echo -e "${CYAN}[5/7] Installing Python 3 and dependencies...${NC}"
apt install -y -qq python3 python3-pip
pip3 install requests --quiet
echo -e "${GREEN}✓ Python installed${NC}"

echo ""
echo -e "${CYAN}[6/7] Downloading FinalPing Ground Station...${NC}"
INSTALL_DIR="/home/pi/finalping-ground"
mkdir -p "$INSTALL_DIR"
wget -q https://finalpingapp.com/ground/finalping_ground.py -O "$INSTALL_DIR/finalping_ground.py"
chown -R pi:pi "$INSTALL_DIR"
echo -e "${GREEN}✓ Downloaded to $INSTALL_DIR/finalping_ground.py${NC}"

echo ""
echo -e "${CYAN}[7/7] Setting up auto-start service...${NC}"
cat > /etc/systemd/system/finalping-ground.service << EOF
[Unit]
Description=FinalPing Ground Station
After=network.target dump1090-fa.service
Wants=dump1090-fa.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/finalping-ground
ExecStart=/usr/bin/python3 /home/pi/finalping-ground/finalping_ground.py
Restart=on-failure
RestartSec=15
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
# Don't enable yet — user needs to configure first
echo -e "${GREEN}✓ Service created (will enable after configuration)${NC}"

# ── Configuration wizard ──────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}============================================================${NC}"
echo -e "${CYAN}${BOLD}   Configuration${NC}"
echo -e "${CYAN}${BOLD}============================================================${NC}"
echo ""
echo "Let's set up your FinalPing account details."
echo ""

read -p "FinalPing email: " fp_email
read -s -p "FinalPing password: " fp_password
echo ""
read -p "Your latitude (e.g. 33.2001): " fp_lat
read -p "Your longitude (e.g. -97.1998): " fp_lon
read -p "Your elevation in feet MSL (e.g. 641): " fp_elev

echo ""
echo "Now add the aircraft you want to track."
echo "You can find ICAO24 hex codes at globe.adsbexchange.com"
echo ""

aircraft_entries=""
while true; do
  read -p "Aircraft tail number (or press Enter to finish): " tail
  if [ -z "$tail" ]; then
    break
  fi
  read -p "ICAO24 hex code for $tail: " icao
  aircraft_entries="${aircraft_entries}    {\"tail\": \"${tail}\", \"icao24\": \"${icao}\"},\n"
done

# Write config into the script
cat > "$INSTALL_DIR/finalping_ground.py" << PYEOF
$(wget -q https://finalpingapp.com/ground/finalping_ground.py -O - | \
  sed "s|FINALPING_EMAIL    = \"your@email.com\"|FINALPING_EMAIL    = \"$fp_email\"|" | \
  sed "s|FINALPING_PASSWORD = \"yourpassword\"|FINALPING_PASSWORD = \"$fp_password\"|" | \
  sed "s|MY_LAT = 33.2001|MY_LAT = $fp_lat|" | \
  sed "s|MY_LON = -97.1998|MY_LON = $fp_lon|" | \
  sed "s|MY_ELEVATION_FT = 641|MY_ELEVATION_FT = $fp_elev|")
PYEOF

chown pi:pi "$INSTALL_DIR/finalping_ground.py"

# Enable and start the service
systemctl enable finalping-ground
systemctl start finalping-ground

echo ""
echo -e "${GREEN}${BOLD}============================================================${NC}"
echo -e "${GREEN}${BOLD}   ✅ Installation complete!${NC}"
echo -e "${GREEN}${BOLD}============================================================${NC}"
echo ""
echo -e "  FinalPing Ground Station is now running."
echo -e "  It will start automatically on every boot."
echo ""
echo -e "  ${BOLD}Useful commands:${NC}"
echo -e "  Check status:  sudo systemctl status finalping-ground"
echo -e "  View logs:     sudo journalctl -u finalping-ground -f"
echo -e "  Stop:          sudo systemctl stop finalping-ground"
echo -e "  Restart:       sudo systemctl restart finalping-ground"
echo ""
echo -e "  ${BOLD}Your receiver:${NC}"
echo -e "  View aircraft: http://$(hostname -I | awk '{print $1}'):8080"
echo ""
echo -e "  ${YELLOW}Note: If you need to add more aircraft, edit:${NC}"
echo -e "  ${INSTALL_DIR}/finalping_ground.py"
echo ""
