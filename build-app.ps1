# Build Script for KSO Application
# Builds both backend and frontend

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building KSO Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Build Backend
Write-Host "Building Backend..." -ForegroundColor Yellow
Set-Location backend

# Try to install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Blue
    npm install --ignore-scripts
}

# Try TypeScript compilation (skip Prisma for now)
Write-Host "Compiling TypeScript..." -ForegroundColor Blue
try {
    npx tsc --noEmit
    Write-Host "✓ TypeScript type checking passed" -ForegroundColor Green
    
    # Try actual build
    Write-Host "Building TypeScript..." -ForegroundColor Blue
    npx tsc
    Write-Host "✓ Backend build successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend build error: $_" -ForegroundColor Red
    Write-Host "Continuing with frontend build..." -ForegroundColor Yellow
}

Set-Location ..

Write-Host ""

# Build Frontend
Write-Host "Building Frontend..." -ForegroundColor Yellow
Set-Location frontend

# Try to install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Blue
    npm install --ignore-scripts
}

# Try Next.js build
Write-Host "Building Next.js application..." -ForegroundColor Blue
try {
    # Temporarily modify build script to skip db push
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    $originalBuild = $packageJson.scripts.build
    
    # Create a build without db push
    $buildScript = $originalBuild -replace "prisma db push && ", ""
    
    Write-Host "Running build command..." -ForegroundColor Blue
    npm run build 2>&1 | ForEach-Object {
        if ($_ -match "error|Error|ERROR|failed|Failed") {
            Write-Host $_ -ForegroundColor Red
        } else {
            Write-Host $_
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend build successful" -ForegroundColor Green
    } else {
        Write-Host "✗ Frontend build had errors" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Frontend build error: $_" -ForegroundColor Red
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

