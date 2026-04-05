#!/bin/bash
# ============================================================
#  FinalPing Ground Station — macOS Installer
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
echo -e "${CYAN}${BOLD}   FinalPing Ground Station — macOS Installer${NC}"
echo -e "${CYAN}${BOLD}============================================================${NC}"
echo ""

# ── Check macOS ───────────────────────────────────────────────
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo -e "${RED}❌ This script is for macOS only.${NC}"
  echo "   For Raspberry Pi, run: curl -fsSL https://finalpingapp.com/install.sh | bash"
  exit 1
fi

echo -e "${BOLD}This installer will:${NC}"
echo "  • Install Homebrew (if not installed)"
echo "  • Install RTL-SDR drivers and dump1090"
echo "  • Install Python 3 and required packages"
echo "  • Download FinalPing Ground Station"
echo "  • Set up auto-start on login"
echo ""
read -p "Continue? (y/n): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Cancelled."
  exit 0
fi

echo ""
echo -e "${CYAN}[1/5] Checking for Homebrew...${NC}"
if ! command -v brew &> /dev/null; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add brew to PATH for Apple Silicon
  if [[ -f "/opt/homebrew/bin/brew" ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  fi
else
  echo "Homebrew already installed. Updating..."
  brew update --quiet
fi
echo -e "${GREEN}✓ Homebrew ready${NC}"

echo ""
echo -e "${CYAN}[2/5] Installing RTL-SDR and dump1090...${NC}"
brew install librtlsdr --quiet 2>/dev/null || brew upgrade librtlsdr --quiet 2>/dev/null || true
brew install dump1090-mutability --quiet 2>/dev/null || brew upgrade dump1090-mutability --quiet 2>/dev/null || true
echo -e "${GREEN}✓ RTL-SDR and dump1090 installed${NC}"

echo ""
echo -e "${CYAN}[3/5] Installing Python 3 and dependencies...${NC}"
if ! command -v python3 &> /dev/null; then
  brew install python3 --quiet
fi
pip3 install requests --quiet
echo -e "${GREEN}✓ Python ready${NC}"

echo ""
echo -e "${CYAN}[4/5] Downloading FinalPing Ground Station...${NC}"
INSTALL_DIR="$HOME/finalping-ground"
mkdir -p "$INSTALL_DIR"
curl -fsSL https://finalpingapp.com/ground/finalping_ground.py -o "$INSTALL_DIR/finalping_ground.py"
echo -e "${GREEN}✓ Downloaded to $INSTALL_DIR/finalping_ground.py${NC}"

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

# Update the config in the downloaded script
sed -i '' "s|FINALPING_EMAIL    = \"your@email.com\"|FINALPING_EMAIL    = \"$fp_email\"|" "$INSTALL_DIR/finalping_ground.py"
sed -i '' "s|FINALPING_PASSWORD = \"yourpassword\"|FINALPING_PASSWORD = \"$fp_password\"|" "$INSTALL_DIR/finalping_ground.py"
sed -i '' "s|MY_LAT = 33.2001|MY_LAT = $fp_lat|" "$INSTALL_DIR/finalping_ground.py"
sed -i '' "s|MY_LON = -97.1998|MY_LON = $fp_lon|" "$INSTALL_DIR/finalping_ground.py"
sed -i '' "s|MY_ELEVATION_FT = 641|MY_ELEVATION_FT = $fp_elev|" "$INSTALL_DIR/finalping_ground.py"

echo ""
echo -e "${CYAN}[5/5] Setting up auto-start on login...${NC}"

# Create a Launch Agent for dump1090
DUMP1090_PLIST="$HOME/Library/LaunchAgents/com.finalpingapp.dump1090.plist"
cat > "$DUMP1090_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.finalpingapp.dump1090</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/dump1090</string>
    <string>--net</string>
    <string>--quiet</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/dump1090.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/dump1090.err</string>
</dict>
</plist>
EOF

# Create a Launch Agent for FinalPing Ground Station
FINALPING_PLIST="$HOME/Library/LaunchAgents/com.finalpingapp.ground.plist"
cat > "$FINALPING_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.finalpingapp.ground</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/python3</string>
    <string>$INSTALL_DIR/finalping_ground.py</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$INSTALL_DIR/finalping_ground.log</string>
  <key>StandardErrorPath</key>
  <string>$INSTALL_DIR/finalping_ground.err</string>
</dict>
</plist>
EOF

# Load them
launchctl load "$DUMP1090_PLIST" 2>/dev/null || true
launchctl load "$FINALPING_PLIST" 2>/dev/null || true

echo -e "${GREEN}✓ Auto-start configured${NC}"

echo ""
echo -e "${GREEN}${BOLD}============================================================${NC}"
echo -e "${GREEN}${BOLD}   ✅ Installation complete!${NC}"
echo -e "${GREEN}${BOLD}============================================================${NC}"
echo ""
echo -e "  FinalPing Ground Station is now running."
echo -e "  It will start automatically every time you log in."
echo ""
echo -e "  ${BOLD}Useful commands:${NC}"
echo -e "  View logs:   tail -f $INSTALL_DIR/finalping_ground.log"
echo -e "  Stop:        launchctl unload $FINALPING_PLIST"
echo -e "  Start:       launchctl load $FINALPING_PLIST"
echo ""
echo -e "  ${BOLD}Your receiver:${NC}"
echo -e "  View aircraft: http://localhost:8080"
echo ""
echo -e "  ${YELLOW}Note: If you need to add more aircraft, edit:${NC}"
echo -e "  $INSTALL_DIR/finalping_ground.py"
echo ""
echo -e "  ${YELLOW}macOS tip: If prompted about security blocking the RTL-SDR driver,${NC}"
echo -e "  go to System Settings → Privacy & Security → Allow Anyway${NC}"
echo ""
