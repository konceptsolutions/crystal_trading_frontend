@echo off
echo ========================================
echo Fixing Brand Functionality
echo ========================================
echo.

echo Step 1: Stopping any running servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo Step 2: Regenerating Prisma Client...
cd frontend
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Prisma generation failed!
    echo Please make sure all Node.js processes are stopped.
    pause
    exit /b 1
)

echo.
echo Step 3: Cleaning node modules cache...
rmdir /s /q node_modules\.prisma 2>nul
call npx prisma generate

echo.
echo ========================================
echo SUCCESS! Brand functionality fixed.
echo ========================================
echo.
echo Now you can start your servers:
echo 1. Frontend: cd frontend && npm run dev
echo 2. Backend: cd backend && npm run dev
echo.
pause
