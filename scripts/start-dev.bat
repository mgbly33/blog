@echo off
title Blog System - Development Mode

echo.
echo ========================================================
echo        Blog System - Development Mode
echo ========================================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo [ERROR] node_modules not found! Run 'start-all.bat' first.
    pause
    exit /b 1
)

echo [INFO] Starting development server...
echo.
echo Server: http://localhost:3000
echo Mode: Development (TypeScript)
echo.
echo ========================================================
echo.

npm run dev

pause
