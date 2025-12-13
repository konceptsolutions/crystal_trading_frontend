# Fix Brand Model Cache Issue - Complete Reset
Write-Host "=== Fixing Brand Model Cache Issue ===" -ForegroundColor Cyan

Write-Host "`n1. Stopping all Node processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 3

Write-Host "`n2. Clearing Next.js build cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next.tmp -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

Write-Host "`n3. Verifying Prisma client has Brand model..." -ForegroundColor Yellow
$prismaIndex = "node_modules\.prisma\client\index.d.ts"
if (Test-Path $prismaIndex) {
    $content = Get-Content $prismaIndex -Raw
    if ($content -match "get brand\(\)") {
        Write-Host "   ✓ Brand model found in Prisma client" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Brand model NOT found - regenerating..." -ForegroundColor Red
        npx prisma generate
    }
} else {
    Write-Host "   ✗ Prisma client not found - regenerating..." -ForegroundColor Red
    npx prisma generate
}

Write-Host "`n4. Cache cleared and Prisma verified!" -ForegroundColor Green
Write-Host "`nPlease restart your dev server:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   OR" -ForegroundColor White
Write-Host "   npm run dev:next" -ForegroundColor White
Write-Host "`nAfter restart, the Brand model should be available." -ForegroundColor Green
