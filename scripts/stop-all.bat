@echo off
title Blog Forum Platform - Dev Stop

echo.
echo ========================================================
echo      Blog Forum Platform - Docker Compose Dev Stop
echo ========================================================
echo.

where docker >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Docker not found. Nothing to stop through this script.
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0\.."
docker compose -f docker\docker-compose.dev.yml down

echo.
echo [INFO] Dev services stopped.
timeout /t 3 /nobreak >nul
