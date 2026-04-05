# ============================================================
#  FinalPing Ground Station — Windows Installer
#  https://finalpingapp.com
#
#  Run in PowerShell as Administrator:
#  irm https://finalpingapp.com/install.ps1 | iex
# ============================================================

$ErrorActionPreference = "Stop"

function Write-Header($text) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "   $text" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step($num, $total, $text) {
    Write-Host "[$num/$total] $text..." -ForegroundColor Cyan
}

function Write-Success($text) {
    Write-Host "✓ $text" -ForegroundColor Green
}

function Write-Warn($text) {
    Write-Host "⚠  $text" -ForegroundColor Yellow
}

Write-Header "FinalPing Ground Station — Windows Installer"

# ── Check Administrator ───────────────────────────────────────
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator." -ForegroundColor Red
    Write-Host "   Right-click PowerShell → Run as Administrator, then try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "This installer will:" -ForegroundColor White
Write-Host "  • Install Chocolatey (package manager)"
Write-Host "  • Install RTL-SDR drivers via Zadig"
Write-Host "  • Install dump1090 for Windows"
Write-Host "  • Install Python 3"
Write-Host "  • Download FinalPing Ground Station"
Write-Host "  • Set up auto-start on Windows login"
Write-Host ""
$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Cancelled."
    exit 0
}

$INSTALL_DIR = "$env:USERPROFILE\finalping-ground"
New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null

# ── Step 1: Chocolatey ────────────────────────────────────────
Write-Step 1 5 "Installing Chocolatey package manager"
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    Write-Success "Chocolatey installed"
} else {
    Write-Success "Chocolatey already installed"
}

# ── Step 2: Python ────────────────────────────────────────────
Write-Step 2 5 "Installing Python 3"
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    choco install python3 -y --quiet
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    Write-Success "Python 3 installed"
} else {
    Write-Success "Python 3 already installed"
}
python -m pip install requests --quiet
Write-Success "Python requests library installed"

# ── Step 3: dump1090 ─────────────────────────────────────────
Write-Step 3 5 "Downloading dump1090 for Windows"
$dump1090Dir = "$INSTALL_DIR\dump1090"
New-Item -ItemType Directory -Force -Path $dump1090Dir | Out-Null

$dump1090Url = "https://github.com/MalcolmRobb/dump1090/archive/refs/heads/master.zip"
$dump1090Zip = "$env:TEMP\dump1090.zip"
Invoke-WebRequest -Uri $dump1090Url -OutFile $dump1090Zip -UseBasicParsing
Expand-Archive -Path $dump1090Zip -DestinationPath $dump1090Dir -Force
Remove-Item $dump1090Zip

Write-Success "dump1090 downloaded to $dump1090Dir"

# ── Step 4: RTL-SDR driver info ───────────────────────────────
Write-Step 4 5 "RTL-SDR driver setup"
Write-Host ""
Write-Warn "Windows requires a manual driver installation step."
Write-Host "  After this installer finishes, do the following:" -ForegroundColor White
Write-Host "  1. Download Zadig from https://zadig.akeo.ie" -ForegroundColor Gray
Write-Host "  2. Plug in your ADS-B receiver" -ForegroundColor Gray
Write-Host "  3. Open Zadig → Options → List All Devices" -ForegroundColor Gray
Write-Host "  4. Select your RTL-SDR device" -ForegroundColor Gray
Write-Host "  5. Choose WinUSB and click Install Driver" -ForegroundColor Gray
Write-Host ""

# Open Zadig download page automatically
Start-Process "https://zadig.akeo.ie"
Write-Success "Opened Zadig download page in your browser"

# ── Step 5: FinalPing Ground Station ─────────────────────────
Write-Step 5 5 "Downloading FinalPing Ground Station"
$scriptPath = "$INSTALL_DIR\finalping_ground.py"
Invoke-WebRequest -Uri "https://finalpingapp.com/ground/finalping_ground.py" -OutFile $scriptPath -UseBasicParsing
Write-Success "Downloaded to $scriptPath"

# ── Configuration wizard ──────────────────────────────────────
Write-Header "Configuration"
Write-Host "Let's set up your FinalPing account details."
Write-Host ""

$fpEmail = Read-Host "FinalPing email"
$fpPasswordSecure = Read-Host "FinalPing password" -AsSecureString
$fpPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($fpPasswordSecure))
$fpLat = Read-Host "Your latitude (e.g. 33.2001)"
$fpLon = Read-Host "Your longitude (e.g. -97.1998)"
$fpElev = Read-Host "Your elevation in feet MSL (e.g. 641)"

# Update the script with user's credentials
$content = Get-Content $scriptPath -Raw
$content = $content -replace 'FINALPING_EMAIL    = "your@email.com"', "FINALPING_EMAIL    = `"$fpEmail`""
$content = $content -replace 'FINALPING_PASSWORD = "yourpassword"', "FINALPING_PASSWORD = `"$fpPassword`""
$content = $content -replace 'MY_LAT = 33.2001', "MY_LAT = $fpLat"
$content = $content -replace 'MY_LON = -97.1998', "MY_LON = $fpLon"
$content = $content -replace 'MY_ELEVATION_FT = 641', "MY_ELEVATION_FT = $fpElev"
Set-Content $scriptPath $content -Encoding UTF8

# Create a startup batch file that launches dump1090 then FinalPing
$startupScript = "$INSTALL_DIR\start-finalping-ground.bat"
$dump1090Exe = Get-ChildItem -Path $dump1090Dir -Recurse -Filter "dump1090.exe" | Select-Object -First 1 -ExpandProperty FullName

@"
@echo off
echo Starting FinalPing Ground Station...
start "dump1090" "$dump1090Exe" --net --quiet
timeout /t 3 /nobreak > nul
python "$scriptPath"
"@ | Set-Content $startupScript

# Add to Windows startup via Task Scheduler
$taskName = "FinalPingGroundStation"
$taskExists = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($taskExists) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute $startupScript
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Write-Success "Auto-start configured via Task Scheduler"

# ── Done ──────────────────────────────────────────────────────
Write-Header "✅ Installation complete!"

Write-Host "  FinalPing Ground Station is installed and configured." -ForegroundColor White
Write-Host "  It will start automatically every time you log in." -ForegroundColor White
Write-Host ""
Write-Host "  To start it now, run:" -ForegroundColor White
Write-Host "  $startupScript" -ForegroundColor Gray
Write-Host ""
Write-Host "  Files installed to:" -ForegroundColor White
Write-Host "  $INSTALL_DIR" -ForegroundColor Gray
Write-Host ""
Write-Host "  ⚠  IMPORTANT: Complete the Zadig driver step!" -ForegroundColor Yellow
Write-Host "  Your browser opened the Zadig download page." -ForegroundColor Yellow
Write-Host "  Install the WinUSB driver for your RTL-SDR device," -ForegroundColor Yellow
Write-Host "  then restart your computer." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Once restarted, plug in your receiver and FinalPing will start automatically." -ForegroundColor White
Write-Host ""

# Open the install folder
Start-Process $INSTALL_DIR
