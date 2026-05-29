#!/usr/bin/env python3
"""FinalPing Ground Station - Captive Portal Setup"""

from flask import Flask, request, jsonify
import subprocess, os
from pathlib import Path

app = Flask(__name__)

GROUND_SCRIPT = "/home/pi/finalping-ground/finalping_ground.py"
SETUP_DONE    = "/etc/finalping/.setup_done"

HTML = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FinalPing Ground Station Setup</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0a0a0f;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:40px;max-width:440px;width:100%}
    .logo{display:flex;align-items:center;gap:10px;margin-bottom:32px}
    .logo-icon{width:36px;height:36px;background:#0ea5e9;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
    .logo-text{font-size:20px;font-weight:800;letter-spacing:-.02em}
    h1{font-size:24px;font-weight:800;margin-bottom:8px}
    .sub{color:#94a3b8;font-size:14px;margin-bottom:32px;line-height:1.6}
    .section{margin-bottom:24px}
    .section-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#0ea5e9;margin-bottom:12px}
    label{display:block;font-size:13px;color:#94a3b8;margin-bottom:6px;margin-top:14px}
    label:first-of-type{margin-top:0}
    input{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:12px 14px;color:#e2e8f0;font-size:14px;outline:none;transition:border-color .15s}
    input:focus{border-color:#0ea5e9}
    .btn{width:100%;padding:14px;background:#0ea5e9;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-top:28px;transition:opacity .15s}
    .btn:hover{opacity:.9}
    .btn:disabled{opacity:.5;cursor:not-allowed}
    .error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:10px;padding:12px 16px;font-size:13px;color:#fca5a5;margin-top:16px;display:none}
    .success{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:10px;padding:16px;font-size:14px;color:#86efac;margin-top:16px;display:none;line-height:1.8}
    .spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-radius:50%;border-top-color:#fff;animation:spin .8s linear infinite;margin-right:8px;vertical-align:middle}
    @keyframes spin{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-icon">📡</div>
      <div class="logo-text">FinalPing</div>
    </div>
    <h1>Ground Station Setup</h1>
    <p class="sub">Enter your WiFi network and FinalPing account. Your location and tracked aircraft are pulled automatically from your account.</p>

    <form id="form">
      <div class="section">
        <div class="section-label">WiFi Network</div>
        <label>Network name (SSID)</label>
        <input type="text" name="wifi_ssid" placeholder="Your home WiFi name" required autocomplete="off">
        <label>Password</label>
        <input type="password" name="wifi_password" placeholder="Your WiFi password" autocomplete="off">
      </div>

      <div class="section">
        <div class="section-label">FinalPing Account</div>
        <label>Email</label>
        <input type="email" name="email" placeholder="your@email.com" required>
        <label>Password</label>
        <input type="password" name="password" required>
      </div>

      <button type="submit" class="btn" id="btn">Connect Ground Station</button>
      <div class="error" id="err"></div>
      <div class="success" id="ok"></div>
    </form>
  </div>

  <script>
    document.getElementById('form').addEventListener('submit', async e => {
      e.preventDefault();
      const btn = document.getElementById('btn');
      const err = document.getElementById('err');
      const ok  = document.getElementById('ok');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>Connecting...';
      err.style.display = 'none';
      ok.style.display  = 'none';
      const fd = new FormData(e.target);
      try {
        const r = await fetch('/setup', { method: 'POST', body: fd });
        const d = await r.json();
        if (d.success) {
          ok.innerHTML = '&#10003; Ground station configured!<br>Connecting to <strong>' + fd.get('wifi_ssid') + '</strong>. Your Pi will reboot and start tracking in about 30 seconds.<br><br>You can close this page.';
          ok.style.display = 'block';
          btn.style.display = 'none';
        } else {
          err.textContent = d.error;
          err.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Connect Ground Station';
        }
      } catch {
        err.textContent = 'Connection error — make sure you are connected to FinalPing-Setup WiFi.';
        err.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Connect Ground Station';
      }
    });
  </script>
</body>
</html>"""


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
    return HTML, 200


@app.route('/setup', methods=['POST'])
def setup():
    wifi_ssid     = request.form.get('wifi_ssid', '').strip()
    wifi_password = request.form.get('wifi_password', '')
    email         = request.form.get('email', '').strip()
    password      = request.form.get('password', '')

    if not wifi_ssid or not email or not password:
        return jsonify({"success": False, "error": "All fields are required."})

    # Save credentials to a persistent file so they survive script updates
    try:
        os.makedirs('/etc/finalping', exist_ok=True)
        with open('/etc/finalping/credentials', 'w') as f:
            f.write(f"{email}\n{password}\n")
        os.chmod('/etc/finalping/credentials', 0o600)
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to save credentials: {e}"})

    # Also write credentials into the ground station script
    try:
        with open(GROUND_SCRIPT, 'r') as f:
            content = f.read()
        content = content.replace('FINALPING_EMAIL    = "your@email.com"', f'FINALPING_EMAIL    = "{email}"')
        content = content.replace('FINALPING_PASSWORD = "yourpassword"', f'FINALPING_PASSWORD = "{password}"')
        with open(GROUND_SCRIPT, 'w') as f:
            f.write(content)
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to write config: {e}"})

    # Configure WiFi via NetworkManager connection profile
    try:
        nm_conn = f"""[connection]
id=FinalPing-Home
type=wifi
autoconnect=true

[wifi]
mode=infrastructure
ssid={wifi_ssid}

[wifi-security]
key-mgmt=wpa-psk
psk={wifi_password}

[ipv4]
method=auto

[ipv6]
method=auto
"""
        os.makedirs('/etc/NetworkManager/system-connections', exist_ok=True)
        nm_path = '/etc/NetworkManager/system-connections/FinalPing-Home.nmconnection'
        with open(nm_path, 'w') as f:
            f.write(nm_conn)
        os.chmod(nm_path, 0o600)

        # Re-enable NM management of wlan0 so it connects to customer WiFi on reboot
        unmanaged_conf = '/etc/NetworkManager/conf.d/finalping-unmanaged.conf'
        if os.path.exists(unmanaged_conf):
            os.remove(unmanaged_conf)
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to configure WiFi: {e}"})

    # Mark setup complete and reboot
    Path("/etc/finalping").mkdir(exist_ok=True)
    Path(SETUP_DONE).touch()
    subprocess.Popen(["bash", "-c", "sleep 3 && reboot"])

    return jsonify({"success": True})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=False)
