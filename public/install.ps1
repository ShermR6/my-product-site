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
Write-Host "  Opening Zadig now. Once it loads:" -ForegroundColor White
Write-Host "  1. In Zadig: Options -> List All Devices" -ForegroundColor Gray
Write-Host "  2. Select RTL2832U from the dropdown" -ForegroundColor Gray
Write-Host "  3. Choose WinUSB as the driver" -ForegroundColor Gray
Write-Host "  4. Click Install Driver and wait for it to finish" -ForegroundColor Gray
Write-Host "  5. Return here and press Enter to continue" -ForegroundColor Gray
Write-Host ""

Start-Process "https://zadig.akeo.ie"
Write-Success "Opened Zadig download page in your browser"
Read-Host "Press Enter once the Zadig driver is installed to continue"

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

# ── Validate account has Ground Station ──────────────────────
Write-Host ""
Write-Host "Verifying your account..." -ForegroundColor Cyan

$backendUrl = "https://aircraft-tracker-backend-production.up.railway.app"

try {
    $loginBody = @{ email = $fpEmail; password = $fpPassword } | ConvertTo-Json
    $loginResp = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $token = $loginResp.access_token
} catch {
    Write-Host ""
    $errBody = $_.ErrorDetails.Message
    if ($errBody -match "license_expired") {
        Write-Host "Your FinalPing license has expired. Renew it at https://finalpingapp.com/pricing" -ForegroundColor Red
    } elseif ($errBody -match "license" -or $_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "No active FinalPing license found. You need an active FinalPing license to use Ground Station." -ForegroundColor Red
        Write-Host "Purchase one at https://finalpingapp.com/pricing" -ForegroundColor Yellow
    } else {
        Write-Host "Login failed. Check your email and password and try again." -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor DarkGray
    }
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $headers = @{ Authorization = "Bearer $token" }
    Invoke-RestMethod -Uri "$backendUrl/api/ground/validate" -Method Post -Headers $headers -ErrorAction Stop | Out-Null
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host ""
    if ($statusCode -eq 403) {
        Write-Host "This account has not purchased FinalPing Ground Station." -ForegroundColor Red
        Write-Host "Purchase it at https://finalpingapp.com/pricing then re-run this installer." -ForegroundColor Yellow
    } else {
        Write-Host "Could not verify ground station access (HTTP $statusCode). Check your internet connection and try again." -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor DarkGray
    }
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Success "Ground Station access confirmed"
Write-Host ""
Write-Host "  Your location and tracked aircraft are pulled automatically from your FinalPing account." -ForegroundColor Gray
Write-Host ""

# Update the script with user's credentials
$content = Get-Content $scriptPath -Raw
$content = $content.Replace('FINALPING_EMAIL    = "your@email.com"', 'FINALPING_EMAIL    = "' + $fpEmail + '"')
$content = $content.Replace('FINALPING_PASSWORD = "yourpassword"', 'FINALPING_PASSWORD = "' + $fpPassword + '"')
Set-Content $scriptPath $content -Encoding UTF8

# Create a hidden PowerShell launcher (no console windows on startup)
$startupScript = "$INSTALL_DIR\start-finalping-ground.ps1"
$dump1090Exe = Get-ChildItem -Path $dump1090Dir -Recurse -Filter "dump1090.exe" | Select-Object -First 1 -ExpandProperty FullName
$pythonwExe = (Get-Command pythonw -ErrorAction SilentlyContinue)?.Source
if (-not $pythonwExe) { $pythonwExe = (Get-Command python -ErrorAction SilentlyContinue)?.Source }

@"
Start-Process -FilePath "$dump1090Exe" -ArgumentList "--net","--quiet" -WindowStyle Hidden
Start-Sleep -Seconds 3
Start-Process -FilePath "$pythonwExe" -ArgumentList "`"$scriptPath`"" -WindowStyle Hidden
"@ | Set-Content $startupScript

# Add to Windows startup via Task Scheduler (hidden, no window)
$taskName = "FinalPingGroundStation"
$taskExists = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($taskExists) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -NonInteractive -ExecutionPolicy Bypass -File `"$startupScript`""
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -RunLevel Highest

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Write-Success "Auto-start configured via Task Scheduler"

# ── Done ──────────────────────────────────────────────────────
Write-Header "✅ Installation complete!"

Write-Host "  FinalPing Ground Station is installed and configured." -ForegroundColor White
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "  1. Connect your antenna to the Pro Stick Plus" -ForegroundColor Gray
Write-Host "  2. Plug the Pro Stick Plus into this PC" -ForegroundColor Gray
Write-Host "  3. Restart your computer" -ForegroundColor Gray
Write-Host "  4. FinalPing Ground Station will start silently in the background on every login" -ForegroundColor Gray
Write-Host ""
Write-Host "  Files installed to:" -ForegroundColor White
Write-Host "  $INSTALL_DIR" -ForegroundColor Gray
Write-Host ""
