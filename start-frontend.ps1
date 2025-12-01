# Frontend Startup Script
Write-Host "Starting Frontend Server..." -ForegroundColor Green

# Refresh PATH and set execution policy
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Navigate to frontend directory
Set-Location frontend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check if .env.local exists (not needed anymore since API is merged)
# API is now served from the same server on /api

# Start the server (now includes backend)
Write-Host "Starting application on http://localhost:3000..." -ForegroundColor Green
Write-Host "This will start both frontend and backend API together" -ForegroundColor Yellow
npm run dev

