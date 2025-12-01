# Application Startup Script
# This script starts both backend and frontend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Inventory Management System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set execution policy for this session
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

# Get the script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $scriptPath "frontend"

# Check if frontend directory exists
if (-not (Test-Path $frontendPath)) {
    Write-Host "ERROR: Frontend directory not found!" -ForegroundColor Red
    exit 1
}

# Start Application (Frontend + Backend merged)
Write-Host "Starting Application..." -ForegroundColor Green
Write-Host "Backend and Frontend are now merged into one application" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '=== INVENTORY MANAGEMENT SYSTEM ===' -ForegroundColor Cyan; Write-Host 'Starting on http://localhost:3000' -ForegroundColor Green; Write-Host 'API available at http://localhost:3000/api' -ForegroundColor Green; Write-Host ''; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Application is starting..." -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  API:      http://localhost:3000/api" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "A PowerShell window has opened." -ForegroundColor Yellow
Write-Host "Wait for the application to finish starting, then open:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000" -ForegroundColor White
Write-Host ""

