Param()

$ErrorActionPreference = "Stop"

# Project root is the directory of this script
$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Project root: $ROOT_DIR"

#
# 1) Start frontend (Vite / React) in a separate process
#
$frontendDir = Join-Path $ROOT_DIR "frontend"
Write-Host "Starting frontend (npm run dev) in $frontendDir..." -ForegroundColor Cyan

Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $frontendDir | Out-Null
Write-Host "Frontend dev server: http://localhost:3000"

#
# 2) Start backend (FastAPI) in this terminal and tee logs to a file
#
$backendDir = Join-Path $ROOT_DIR "backend"
$backendLog = Join-Path $ROOT_DIR "backend.log"

Write-Host ""
Write-Host "Starting backend (python app.py) in $backendDir..." -ForegroundColor Cyan
Write-Host "API:          http://localhost:8000"
Write-Host "Backend logs: $backendLog"
Write-Host ""

Set-Location $backendDir

# Run backend and tee all output (stdout + stderr) to backend.log while showing it in the terminal
python app.py 2>&1 | Tee-Object -FilePath $backendLog -Append

