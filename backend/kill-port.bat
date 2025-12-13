@echo off
REM Batch script to kill process on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 5000...
    taskkill /PID %%a /F
    echo Port 5000 is now free.
    goto :done
)
echo Port 5000 is already free.
:done

