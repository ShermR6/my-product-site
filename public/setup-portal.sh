#!/bin/bash
# FinalPing Ground Station - Kit Preparation Script
# Run once on a fresh Raspberry Pi before shipping to a customer.
#
#   curl -fsSL https://finalpingapp.com/setup-portal.sh | sudo bash

set -e

INSTALL_DIR="/home/pi/finalping-ground"
SETUP_DIR="/home/pi/finalping-setup"

echo ""
echo "============================================================"
echo "   FinalPing Ground Station — Kit Preparation"
echo "============================================================"
echo ""

# ── Dependencies ─────────────────────────────────────────────
echo "[1/6] Installing dependencies..."
apt update -qq
apt install -y -qq hostapd dnsmasq python3-pip python3-flask python3-requests rfkill

# Build dump1090 from source
apt install -y -qq build-essential libusb-1.0-0-dev librtlsdr-dev pkg-config git libncurses-dev
rm -rf /tmp/dump1090-src
git clone --depth 1 https://github.com/flightaware/dump1090.git /tmp/dump1090-src
make -C /tmp/dump1090-src
install -m 755 /tmp/dump1090-src/dump1090 /usr/local/bin/dump1090-fa
echo "✓ dump1090 built and installed"

echo "✓ Dependencies installed"

# ── Download scripts ─────────────────────────────────────────
echo "[2/6] Downloading FinalPing scripts..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$SETUP_DIR"
curl -fsSL https://finalpingapp.com/ground/finalping_ground.py -o "$INSTALL_DIR/finalping_ground.py"
curl -fsSL https://finalpingapp.com/finalping_setup.py -o "$SETUP_DIR/finalping_setup.py"
chmod +x "$SETUP_DIR/finalping_setup.py"
chown -R pi:pi "$INSTALL_DIR" "$SETUP_DIR"
echo "✓ Scripts downloaded"

# ── hostapd (access point) ───────────────────────────────────
echo "[3/6] Configuring access point..."
systemctl unmask hostapd 2>/dev/null || true

cat > /etc/hostapd/hostapd.conf << 'EOF'
interface=wlan0
driver=nl80211
ssid=FinalPing-Setup
hw_mode=g
channel=6
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=finalping
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF

sed -i 's|#DAEMON_CONF=""|DAEMON_CONF="/etc/hostapd/hostapd.conf"|' /etc/default/hostapd

# Tell NetworkManager to leave wlan0 alone so hostapd can use it
mkdir -p /etc/NetworkManager/conf.d
cat > /etc/NetworkManager/conf.d/finalping-unmanaged.conf << 'EOF'
[keyfile]
unmanaged-devices=interface-name:wlan0
EOF
echo "✓ Access point configured (SSID: FinalPing-Setup, password: finalping)"

# ── dnsmasq (DHCP + DNS redirect) ────────────────────────────
echo "[4/6] Configuring DHCP and captive portal DNS..."
cat > /etc/dnsmasq.d/finalping-setup.conf << 'EOF'
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
domain=local
address=/#/192.168.4.1
EOF
echo "✓ DHCP and DNS redirect configured"

# ── Systemd services ─────────────────────────────────────────
echo "[5/6] Creating systemd services..."

cat > /etc/systemd/system/finalping-setup.service << 'EOF'
[Unit]
Description=FinalPing Ground Station Setup Portal
After=network.target

[Service]
ExecStart=/usr/bin/python3 /home/pi/finalping-setup/finalping_setup.py
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/finalping-ground.service << 'EOF'
[Unit]
Description=FinalPing Ground Station
After=network-online.target finalping-dump1090.service
Wants=network-online.target

[Service]
ExecStart=/usr/bin/python3 /home/pi/finalping-ground/finalping_ground.py
Restart=on-failure
RestartSec=10
User=pi

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/finalping-dump1090.service << 'EOF'
[Unit]
Description=dump1090 ADS-B Decoder
After=network.target

[Service]
ExecStart=/usr/local/bin/dump1090-fa --net --quiet
Restart=on-failure
RestartSec=5
User=pi

[Install]
WantedBy=multi-user.target
EOF

# Boot manager — decides AP mode vs ground station on every boot
cat > /usr/local/bin/finalping-boot << 'EOF'
#!/bin/bash
if [ ! -f /etc/finalping/.setup_done ]; then
    # AP mode: set static IP and start hotspot
    rfkill unblock wifi
    ip link set wlan0 up
    ip addr flush dev wlan0 2>/dev/null || true
    ip addr add 192.168.4.1/24 dev wlan0
    systemctl start hostapd
    sleep 1
    systemctl start dnsmasq
    systemctl start finalping-setup
else
    # Ground station mode
    systemctl stop finalping-setup 2>/dev/null || true
    systemctl stop hostapd 2>/dev/null || true
    systemctl stop dnsmasq 2>/dev/null || true
    systemctl start finalping-dump1090
    sleep 3
    systemctl start finalping-ground
fi
EOF
chmod +x /usr/local/bin/finalping-boot

cat > /etc/systemd/system/finalping-boot.service << 'EOF'
[Unit]
Description=FinalPing Boot Manager
After=network.target

[Service]
ExecStart=/usr/local/bin/finalping-boot
Type=oneshot
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable finalping-boot
systemctl disable hostapd 2>/dev/null || true
systemctl disable dnsmasq 2>/dev/null || true
mkdir -p /etc/finalping
echo "✓ Systemd services configured"

# ── Done ─────────────────────────────────────────────────────
echo "[6/6] Finalizing..."
# Clear WiFi credentials so Pi boots into AP mode for customer
cat > /etc/wpa_supplicant/wpa_supplicant.conf << 'EOF'
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=US
EOF
# Remove any existing NM WiFi connection profiles so Pi boots clean
rm -f /etc/NetworkManager/system-connections/*.nmconnection 2>/dev/null || true
echo "✓ WiFi config cleared — Pi will boot into setup mode for customer"
echo ""
echo "============================================================"
echo "   Kit preparation complete!"
echo ""
echo "   Customer flow:"
echo "   1. Customer powers on the Pi"
echo "   2. Connect to 'FinalPing-Setup' WiFi (password: finalping)"
echo "   3. Setup page opens automatically"
echo "   4. Customer enters WiFi + FinalPing credentials"
echo "   5. Pi reboots and starts tracking"
echo "============================================================"
echo ""
