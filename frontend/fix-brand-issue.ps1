# Fix Brand Model Issue - Regenerate Prisma and Clear Cache
Write-Host "=== Fixing Brand Model Issue ===" -ForegroundColor Cyan

Write-Host "`n1. Stopping all Node processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

Write-Host "`n2. Regenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Prisma generation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n3. Clearing Next.js build cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next.tmp -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

Write-Host "`n4. Prisma client regenerated and cache cleared!" -ForegroundColor Green
Write-Host "`nPlease restart your dev server manually:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   OR" -ForegroundColor White
Write-Host "   npm run dev:next" -ForegroundColor White
