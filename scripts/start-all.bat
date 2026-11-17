@echo off
title Blog Forum Platform - Dev Start

echo.
echo ========================================================
echo      Blog Forum Platform - Docker Compose Dev Start
echo ========================================================
echo.

where docker >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Docker not found. Please install Docker Desktop first.
    echo         Or follow docs\QUICK_START.md to start MySQL, Redis, backend and frontend manually.
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0\.."

echo [INFO] Starting frontend, backend, MySQL and Redis...
docker compose -f docker\docker-compose.dev.yml up --build
