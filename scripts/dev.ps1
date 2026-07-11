# Launch backend (uvicorn) and frontend (next dev) in separate windows.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\dev.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "Starting backend on http://127.0.0.1:8000 ..."
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "Set-Location '$root\backend'; .\.venv\Scripts\python -m uvicorn main:app --reload --port 8000"
)

Write-Host "Starting frontend on http://localhost:3000 ..."
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "Set-Location '$root\frontend'; npm run dev"
)

Write-Host "Both launched. Open http://localhost:3000"
