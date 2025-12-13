@echo off
REM Batch script to kill process on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 3000...
    taskkill /PID %%a /F
    echo Port 3000 is now free.
    goto :done
)
echo Port 3000 is already free.
:done

