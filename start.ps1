# Signal - 30-Day Intelligence Hub: Quick Start (PowerShell)
# Usage: .\start.ps1
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "   SIGNAL  ·  30-Day Intelligence Hub  ·  Startup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""

# ── 1. Backend setup ────────────────────────────────────────────────────── #
Write-Host "[1/4] Configurando Backend (FastAPI)..." -ForegroundColor Yellow

$backendDir = Join-Path $root "backend"
Push-Location $backendDir

if (-not (Test-Path ".env")) {
    Write-Host "  -> Copiando .env.example -> .env"
    Copy-Item ".env.example" ".env"
}

if (-not (Test-Path "venv")) {
    Write-Host "  -> Creando entorno virtual Python..."
    python -m venv venv
}

Write-Host "  -> Instalando/verificando dependencias Python..."
& ".\venv\Scripts\python.exe" -m pip install -q -r requirements.txt

# Kill any existing uvicorn on :8000
$existing = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "  -> Puerto 8000 ocupado. Cerrando proceso anterior..."
    $existing | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}

# ── 2. Launch Backend ───────────────────────────────────────────────────── #
Write-Host ""
Write-Host "[2/4] Iniciando Backend FastAPI en http://localhost:8000 ..." -ForegroundColor Green

$uvicornArgs = @(
    "-m", "uvicorn",
    "app.main:app",
    "--host", "0.0.0.0",
    "--port", "8000",
    "--log-level", "info"
)

$backendProcess = Start-Process `
    -FilePath ".\venv\Scripts\python.exe" `
    -ArgumentList $uvicornArgs `
    -WorkingDirectory $backendDir `
    -PassThru `
    -NoNewWindow

Pop-Location

# Wait for backend to be ready (up to 10s)
Write-Host "  -> Esperando que el backend esté listo..."
$ready = $false
for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -TimeoutSec 2 -ErrorAction Stop
        if ($r.status -eq "healthy") {
            $ready = $true
            break
        }
    } catch { }
}

if ($ready) {
    Write-Host "  -> Backend OK  (skill: $($r.skill.exists), script: $($r.skill.script_exists))" -ForegroundColor Green
} else {
    Write-Host "  -> Backend aun arrancando (timeout). Continuando de todos modos..." -ForegroundColor Yellow
}

# ── 3. Frontend setup ───────────────────────────────────────────────────── #
Write-Host ""
Write-Host "[3/4] Configurando Frontend (Vue 3 + Vite)..." -ForegroundColor Yellow

$frontendDir = Join-Path $root "frontend"
Push-Location $frontendDir

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "  -> Copiando .env.example -> .env"
        Copy-Item ".env.example" ".env"
    }
}

if (-not (Test-Path "node_modules")) {
    Write-Host "  -> Instalando dependencias npm..."
    npm install
}

# ── 4. Launch Frontend ──────────────────────────────────────────────────── #
Write-Host ""
Write-Host "[4/4] Iniciando Frontend Vite en http://localhost:5173 ..." -ForegroundColor Green
Write-Host ""
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Frontend UI :  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API :  http://localhost:8000" -ForegroundColor White
Write-Host "  Swagger Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Presiona Ctrl+C para detener el frontend." -ForegroundColor DarkGray
Write-Host ""

npm run dev
